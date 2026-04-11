import * as v from 'valibot';
import * as PasslockServer from '@passlock/server/safe';
import type { MailboxChallengeDetails, MailboxChallengeMetadata } from '@passlock/server/safe';
import { error as kitError } from '@sveltejs/kit';
import {
	CHALLENGE_RATE_LIMIT_READY_MESSAGE,
	getChallengeRateLimitRemainingSeconds,
	type ChallengeRateLimitView
} from '$lib/shared/challengeRateLimit.js';
import { CHALLENGE_FLOW_TTL_MS } from './cookies.js';
import { getPasslockConfig } from './passlock.js';
import {
	createUser,
	getUserByEmail,
	getUserById,
	type AccountNotFound,
	type DuplicateUser,
	type SessionUser,
	updateUserEmail
} from './repository.js';

// ============================================================================
// Passlock SDK wrappers
// ============================================================================

/**
 * Tagged rate-limited error surfaced to callers when Passlock refuses a
 * mailbox challenge because the tenancy has exceeded its allowance.
 */
export type ChallengeRateLimitedError = {
	_tag: '@error/ChallengeRateLimited';
	message: string;
	retryAfterSeconds: number;
};

const isChallengeRateLimitedError = (value: unknown): value is ChallengeRateLimitedError =>
	typeof value === 'object' &&
	value !== null &&
	'_tag' in value &&
	value._tag === '@error/ChallengeRateLimited' &&
	'retryAfterSeconds' in value &&
	typeof value.retryAfterSeconds === 'number';

/**
 * Create a Passlock mailbox challenge for one-time-code flows.
 *
 * The returned challenge includes the code and secret needed by the rest of
 * the sample. Route handlers persist only the challenge id and secret in a
 * short-lived cookie; the user receives the code separately by email.
 */
const createPasslockMailboxChallenge = async (input: {
	email: string;
	purpose: 'login' | 'signup' | 'email-change';
	userId?: number | undefined;
	metadata?: MailboxChallengeMetadata | undefined;
	invalidateOthers?: boolean | undefined;
}): Promise<PasslockServer.MailboxChallenge | ChallengeRateLimitedError> => {
	const result = await PasslockServer.createMailboxChallenge({
		...getPasslockConfig(),
		email: input.email,
		purpose: input.purpose,
		userId: input.userId === undefined ? undefined : String(input.userId),
		metadata: input.metadata,
		invalidateOthers: input.invalidateOthers,
		skipRateLimit: true
	});

	if (result.failure) {
		if (isChallengeRateLimitedError(result)) {
			return result;
		}

		console.error('Unable to create mailbox challenge', result);
		kitError(500, 'Unable to create one-time code challenge');
	}

	return result.challenge;
};

/**
 * Read challenge details from Passlock so loaders can recover or validate
 * in-progress login, signup, or email-change flows.
 */
const getPasslockMailboxChallenge = async (input: {
	challengeId: string;
}): Promise<MailboxChallengeDetails | null> => {
	const result = await PasslockServer.getMailboxChallenge({
		...getPasslockConfig(),
		...input
	});

	if (result.failure) {
		if (PasslockServer.isNotFoundError(result)) {
			return null;
		}

		console.error('Unable to read mailbox challenge', result);
		kitError(500, 'Unable to read one-time code challenge');
	}

	return result;
};

/**
 * Ask Passlock to verify a submitted challenge code against the stored secret.
 *
 * Callers still apply app-specific checks afterwards, such as making sure the
 * challenge purpose matches the current route and that the challenge belongs
 * to the expected local user.
 */
const verifyPasslockMailboxChallenge = async (input: {
	challengeId: string;
	secret: string;
	code: string;
}) =>
	PasslockServer.verifyMailboxChallenge({
		...getPasslockConfig(),
		...input
	});

// ============================================================================
// Rate-limit view helpers
// ============================================================================

const normaliseRetryAfterSeconds = (retryAfterSeconds: number) =>
	Math.max(1, Math.ceil(Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : 1));

const normaliseRetryAtMs = (retryAtMs: number) =>
	Number.isFinite(retryAtMs) ? Math.ceil(retryAtMs) : Date.now();

/**
 * Build a fresh rate-limit view from the `retryAfterSeconds` value Passlock
 * returns alongside a rate-limited challenge response. Route handlers attach
 * this to their form responses so the UI can display a countdown.
 */
export const createChallengeRateLimitView = (retryAfterSeconds: number): ChallengeRateLimitView => {
	const initialRemainingSeconds = normaliseRetryAfterSeconds(retryAfterSeconds);

	return {
		retryAtMs: Date.now() + initialRemainingSeconds * 1000,
		initialRemainingSeconds,
		readyMessage: CHALLENGE_RATE_LIMIT_READY_MESSAGE
	};
};

/**
 * Rehydrate a rate-limit view from a previously persisted `retryAtMs`
 * timestamp (e.g. query state), recomputing the remaining seconds.
 */
export const restoreChallengeRateLimitView = (retryAtMs: number): ChallengeRateLimitView => {
	const normalisedRetryAtMs = normaliseRetryAtMs(retryAtMs);

	return {
		retryAtMs: normalisedRetryAtMs,
		initialRemainingSeconds: getChallengeRateLimitRemainingSeconds(normalisedRetryAtMs),
		readyMessage: CHALLENGE_RATE_LIMIT_READY_MESSAGE
	};
};

// ============================================================================
// Shared prelude
// ============================================================================

/**
 * Application-level failure reasons for one-time-code verification.
 *
 * These collapse Passlock SDK errors plus local authorization checks into a
 * smaller set that route handlers can map to redirects and field errors.
 */
export type ChallengeVerificationError = {
	_tag: '@error/ChallengeVerificationError';
	code:
		| 'INVALID_CODE'
		| 'CODE_EXPIRED'
		| 'CHALLENGE_EXPIRED'
		| 'TOO_MANY_ATTEMPTS'
		| 'ACCOUNT_NOT_FOUND'
		| 'PURPOSE_MISMATCH'
		| 'UNAUTHORIZED';
	email?: string;
};

/**
 * Returned when a challenge successfully identifies a local account.
 */
export type ConsumedChallenge = {
	_tag: 'ChallengeConsumed';
	user: SessionUser;
};

/**
 * Returned when an email-change challenge has been verified and applied.
 */
export type EmailChangeSuccess = {
	_tag: 'EmailChangeSuccess';
	user: SessionUser;
	oldEmail: string;
};

const createChallengeVerificationError = (
	code: ChallengeVerificationError['code'],
	email?: string
): ChallengeVerificationError => ({
	_tag: '@error/ChallengeVerificationError',
	code,
	email
});

/**
 * Map a Passlock verify-mailbox-challenge failure to the app's verification
 * error vocabulary. `@error/Forbidden` indicates a misconfiguration and is
 * surfaced as a 500.
 */
const mapVerifyError = (
	result: Exclude<Awaited<ReturnType<typeof verifyPasslockMailboxChallenge>>, { success: true }>
): ChallengeVerificationError => {
	switch (result._tag) {
		case '@error/InvalidChallenge':
			return createChallengeVerificationError('CHALLENGE_EXPIRED');
		case '@error/InvalidChallengeCode':
			return createChallengeVerificationError('INVALID_CODE');
		case '@error/ChallengeAttemptsExceeded':
			return createChallengeVerificationError('TOO_MANY_ATTEMPTS');
		case '@error/ChallengeExpired':
			return createChallengeVerificationError('CODE_EXPIRED');
		case '@error/Forbidden':
			console.error('Unable to verify mailbox challenge', result);
			throw new Error('Unable to verify one-time code challenge');
	}
};

/**
 * Minimal metadata schema common to every flow. The `processExpiresAt`
 * timestamp bounds the local process flow (e.g. how long the user has from
 * first submitting their signup details to finishing verification) and is
 * distinct from Passlock's native `expiresAt`, which bounds the validity of
 * the emailed code.
 */
const BaseMetadataSchema = v.object({
	processExpiresAt: v.number()
});

const isProcessExpired = (processExpiresAt: number): boolean => Date.now() > processExpiresAt;

const isDuplicateUser = (user: SessionUser | DuplicateUser): user is DuplicateUser =>
	(user as DuplicateUser)._tag === '@error/DuplicateUser';

// ============================================================================
// Signup flow
// ============================================================================

const SignupMetadataSchema = v.object({
	processExpiresAt: v.number(),
	givenName: v.pipe(v.string(), v.trim(), v.nonEmpty()),
	familyName: v.pipe(v.string(), v.trim(), v.nonEmpty())
});

export type SignupChallenge = {
	id: string;
	email: string;
	givenName: string;
	familyName: string;
	processExpiresAt: number;
};

export type CreatedSignupChallenge = {
	_tag: 'CreatedChallenge';
	challenge: SignupChallenge;
	secret: string;
	code: string;
	message: {
		html: string;
		text: string;
	};
};

const toSignupChallenge = (
	details: MailboxChallengeDetails
): SignupChallenge | ChallengeVerificationError => {
	if (details.purpose !== 'signup') {
		return createChallengeVerificationError('PURPOSE_MISMATCH');
	}

	const parsed = v.safeParse(SignupMetadataSchema, details.metadata);
	if (!parsed.success) {
		return createChallengeVerificationError('CHALLENGE_EXPIRED');
	}

	if (isProcessExpired(parsed.output.processExpiresAt)) {
		return createChallengeVerificationError('CHALLENGE_EXPIRED');
	}

	return {
		id: details.challengeId,
		email: details.email,
		givenName: parsed.output.givenName,
		familyName: parsed.output.familyName,
		processExpiresAt: parsed.output.processExpiresAt
	};
};

/**
 * Create or refresh the signup one-time-code challenge for a new account.
 */
export const createOrRefreshSignupChallenge = async (input: {
	email: string;
	givenName: string;
	familyName: string;
}): Promise<CreatedSignupChallenge | DuplicateUser | ChallengeRateLimitedError> => {
	const existingAccount = await getUserByEmail(input.email);
	if (existingAccount) return { _tag: '@error/DuplicateUser', email: input.email };

	const processExpiresAt = Date.now() + CHALLENGE_FLOW_TTL_MS;
	const metadata: MailboxChallengeMetadata = {
		processExpiresAt,
		givenName: input.givenName,
		familyName: input.familyName
	};

	const challenge = await createPasslockMailboxChallenge({
		email: input.email,
		purpose: 'signup',
		metadata,
		invalidateOthers: true
	});
	if (isChallengeRateLimitedError(challenge)) return challenge;

	return {
		_tag: 'CreatedChallenge',
		challenge: {
			id: challenge.challengeId,
			email: challenge.email,
			givenName: input.givenName,
			familyName: input.familyName,
			processExpiresAt
		},
		secret: challenge.secret,
		code: challenge.code,
		message: challenge.message
	};
};

/**
 * Read a pending signup challenge if it still exists and still matches the
 * expected purpose.
 */
export const getPendingSignupChallenge = async (
	challengeId: string
): Promise<SignupChallenge | null> => {
	const details = await getPasslockMailboxChallenge({ challengeId });
	if (!details) return null;

	const result = toSignupChallenge(details);
	return '_tag' in result ? null : result;
};

/**
 * Verify a signup code, create the local account if needed, and resolve to
 * the new session user.
 */
export const consumeSignupChallenge = async (input: {
	challengeId: string;
	secret: string;
	code: string;
}): Promise<ConsumedChallenge | DuplicateUser | ChallengeVerificationError> => {
	const result = await verifyPasslockMailboxChallenge({
		challengeId: input.challengeId,
		code: input.code,
		secret: input.secret
	});
	if (!result.success) return mapVerifyError(result);

	const challenge = toSignupChallenge(result.challenge);
	if ('_tag' in challenge) return challenge;

	const existingAccount = await getUserByEmail(challenge.email);
	if (existingAccount) {
		return { _tag: '@error/DuplicateUser', email: challenge.email };
	}

	const createdUser = await createUser({
		email: challenge.email,
		givenName: challenge.givenName,
		familyName: challenge.familyName
	});
	if (createdUser._tag === '@error/DuplicateUser') return createdUser;

	const user = await getUserByEmail(challenge.email);
	if (!user) {
		return createChallengeVerificationError('ACCOUNT_NOT_FOUND', challenge.email);
	}

	return { _tag: 'ChallengeConsumed', user };
};

// ============================================================================
// Login flow
// ============================================================================

export type LoginChallenge = {
	id: string;
	email: string;
	processExpiresAt: number;
};

export type CreatedLoginChallenge = {
	_tag: 'CreatedChallenge';
	challenge: LoginChallenge & { givenName: string | null };
	secret: string;
	code: string;
	message: {
		html: string;
		text: string;
	};
};

const toLoginChallenge = (
	details: MailboxChallengeDetails
): LoginChallenge | ChallengeVerificationError => {
	if (details.purpose !== 'login') {
		return createChallengeVerificationError('PURPOSE_MISMATCH');
	}

	const parsed = v.safeParse(BaseMetadataSchema, details.metadata);
	if (!parsed.success) {
		return createChallengeVerificationError('CHALLENGE_EXPIRED');
	}

	if (isProcessExpired(parsed.output.processExpiresAt)) {
		return createChallengeVerificationError('CHALLENGE_EXPIRED');
	}

	return {
		id: details.challengeId,
		email: details.email,
		processExpiresAt: parsed.output.processExpiresAt
	};
};

/**
 * Create or refresh the login one-time-code challenge for an existing account.
 */
export const createOrRefreshLoginChallenge = async (
	email: string
): Promise<CreatedLoginChallenge | AccountNotFound | ChallengeRateLimitedError> => {
	const account = await getUserByEmail(email);
	if (!account) return { _tag: '@error/AccountNotFound', email };

	const processExpiresAt = Date.now() + CHALLENGE_FLOW_TTL_MS;
	const metadata: MailboxChallengeMetadata = { processExpiresAt };

	const challenge = await createPasslockMailboxChallenge({
		email: account.email,
		purpose: 'login',
		userId: account.userId,
		metadata,
		invalidateOthers: true
	});
	if (isChallengeRateLimitedError(challenge)) return challenge;

	return {
		_tag: 'CreatedChallenge',
		challenge: {
			id: challenge.challengeId,
			email: challenge.email,
			givenName: account.givenName,
			processExpiresAt
		},
		secret: challenge.secret,
		code: challenge.code,
		message: challenge.message
	};
};

/**
 * Read a pending login challenge if it still exists and still matches the
 * expected purpose.
 */
export const getPendingLoginChallenge = async (
	challengeId: string
): Promise<LoginChallenge | null> => {
	const details = await getPasslockMailboxChallenge({ challengeId });
	if (!details) return null;

	const result = toLoginChallenge(details);
	return '_tag' in result ? null : result;
};

/**
 * Verify a login code and resolve it to the existing local account.
 */
export const consumeLoginChallenge = async (input: {
	challengeId: string;
	secret: string;
	code: string;
}): Promise<ConsumedChallenge | ChallengeVerificationError> => {
	const result = await verifyPasslockMailboxChallenge({
		challengeId: input.challengeId,
		code: input.code,
		secret: input.secret
	});
	if (!result.success) return mapVerifyError(result);

	const challenge = toLoginChallenge(result.challenge);
	if ('_tag' in challenge) return challenge;

	const user = await getUserByEmail(challenge.email);
	if (!user) {
		return createChallengeVerificationError('ACCOUNT_NOT_FOUND', challenge.email);
	}

	return { _tag: 'ChallengeConsumed', user };
};

// ============================================================================
// Email-change flow
// ============================================================================

export type EmailChangeChallenge = {
	id: string;
	email: string;
	userId: number;
	processExpiresAt: number;
};

export type CreatedEmailChangeChallenge = {
	_tag: 'CreatedChallenge';
	challenge: {
		id: string;
		email: string;
	};
	secret: string;
	code: string;
	message: {
		html: string;
		text: string;
	};
};

const toEmailChangeChallenge = (
	details: MailboxChallengeDetails
): EmailChangeChallenge | ChallengeVerificationError => {
	if (details.purpose !== 'email-change') {
		return createChallengeVerificationError('PURPOSE_MISMATCH');
	}

	const parsed = v.safeParse(BaseMetadataSchema, details.metadata);
	if (!parsed.success) {
		return createChallengeVerificationError('CHALLENGE_EXPIRED');
	}

	if (isProcessExpired(parsed.output.processExpiresAt)) {
		return createChallengeVerificationError('CHALLENGE_EXPIRED');
	}

	const userIdRaw = details.userId;
	const userId = userIdRaw && /^\d+$/.test(userIdRaw) ? Number(userIdRaw) : NaN;
	if (!Number.isSafeInteger(userId) || userId <= 0) {
		return createChallengeVerificationError('CHALLENGE_EXPIRED');
	}

	return {
		id: details.challengeId,
		email: details.email,
		userId,
		processExpiresAt: parsed.output.processExpiresAt
	};
};

/**
 * Create or refresh the challenge that verifies ownership of a replacement
 * email address for an existing account.
 */
export const createOrRefreshEmailChallenge = async (input: {
	userId: number;
	email: string;
}): Promise<
	CreatedEmailChangeChallenge | AccountNotFound | DuplicateUser | ChallengeRateLimitedError
> => {
	const account = await getUserById(input.userId);
	if (!account) return { _tag: '@error/AccountNotFound', email: input.email };

	const existingAccount = await getUserByEmail(input.email);
	if (existingAccount && existingAccount.userId !== input.userId) {
		return { _tag: '@error/DuplicateUser', email: input.email };
	}

	const processExpiresAt = Date.now() + CHALLENGE_FLOW_TTL_MS;
	const metadata: MailboxChallengeMetadata = { processExpiresAt };

	const challenge = await createPasslockMailboxChallenge({
		email: input.email,
		purpose: 'email-change',
		userId: account.userId,
		metadata,
		invalidateOthers: true
	});
	if (isChallengeRateLimitedError(challenge)) return challenge;

	return {
		_tag: 'CreatedChallenge',
		challenge: {
			id: challenge.challengeId,
			email: challenge.email
		},
		secret: challenge.secret,
		code: challenge.code,
		message: challenge.message
	};
};

/**
 * Read a pending email-change challenge if it still exists and still matches
 * the expected purpose.
 */
export const getPendingEmailChallenge = async (
	challengeId: string
): Promise<EmailChangeChallenge | null> => {
	const details = await getPasslockMailboxChallenge({ challengeId });
	if (!details) return null;

	const result = toEmailChangeChallenge(details);
	return '_tag' in result ? null : result;
};

/**
 * Verify an email-change code, ensure it belongs to the signed-in user, and
 * update the local account email address.
 */
export const consumeEmailChallenge = async (input: {
	challengeId: string;
	secret: string;
	code: string;
	userId: number;
}): Promise<EmailChangeSuccess | DuplicateUser | ChallengeVerificationError> => {
	const result = await verifyPasslockMailboxChallenge({
		challengeId: input.challengeId,
		code: input.code,
		secret: input.secret
	});
	if (!result.success) return mapVerifyError(result);

	const challenge = toEmailChangeChallenge(result.challenge);
	if ('_tag' in challenge) return challenge;

	if (challenge.userId !== input.userId) {
		return createChallengeVerificationError('UNAUTHORIZED');
	}

	const currentAccount = await getUserById(input.userId);
	if (!currentAccount) {
		return createChallengeVerificationError('ACCOUNT_NOT_FOUND');
	}

	const existingAccount = await getUserByEmail(challenge.email);
	if (existingAccount && existingAccount.userId !== input.userId) {
		return { _tag: '@error/DuplicateUser', email: challenge.email };
	}

	const updatedUser = await updateUserEmail(input.userId, challenge.email);
	if (!updatedUser) {
		return createChallengeVerificationError('ACCOUNT_NOT_FOUND');
	}
	if (isDuplicateUser(updatedUser)) return updatedUser;

	return {
		_tag: 'EmailChangeSuccess',
		user: updatedUser,
		oldEmail: currentAccount.email
	};
};
