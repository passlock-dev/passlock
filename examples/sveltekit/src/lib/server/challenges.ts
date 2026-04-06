import { CHALLENGE_FLOW_TTL_MS } from './cookies';
import {
	createMailboxChallenge as createPasslockMailboxChallenge,
	getMailboxChallenge as getPasslockMailboxChallenge,
	type ChallengeRateLimitedError,
	type MailboxChallenge,
	type MailboxChallengeDetails,
	type MailboxChallengeMetadata,
	isChallengeRateLimitedError,
	verifyMailboxChallenge as verifyPasslockMailboxChallenge
} from './passlock';
import {
	createUser,
	getUserByEmail,
	getUserById,
	type AccountNotFound,
	type DuplicateUser,
	type SessionUser,
	updateUserEmail
} from './repository.js';

/**
 * Mailbox challenge flows supported by the sample app.
 */
export type ChallengePurpose = 'login' | 'signup' | 'email-change';
type UserChallengePurpose = Exclude<ChallengePurpose, 'signup'>;

/**
 * Normalized mailbox challenge shape used by the app after reading from
 * Passlock.
 */
export type Challenge = {
	id: string;
	purpose: ChallengePurpose;
	userId: number | null;
	email: string;
	givenName: string | null;
	familyName: string | null;
	createdAt: number;
	challengeExpiresAt: number;
};

/**
 * Challenge plus the secret and code needed to complete the current flow.
 */
export type CreatedChallenge = {
	_tag: 'CreatedChallenge';
	challenge: Challenge;
	secret: string;
	code: string;
  message: {
    html: string
    text: string
  }
};

type ChallengeCreationResult = CreatedChallenge | ChallengeRateLimitedError;

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

type VerifiedChallenge = {
	_tag: 'VerifiedChallenge';
	challenge: Challenge;
};

type ValidatedChallengeMetadata = {
	challengeExpiresAt: number;
	givenName: string | null;
	familyName: string | null;
};

type ValidatedChallenge = {
	_tag: 'ValidatedChallenge';
	challenge: Challenge;
};

const isDuplicateUser = (user: SessionUser | DuplicateUser): user is DuplicateUser =>
	(user as DuplicateUser)._tag === '@error/DuplicateUser';

const createChallengeVerificationError = (
	code: ChallengeVerificationError['code'],
	email?: string
): ChallengeVerificationError => ({
	_tag: '@error/ChallengeVerificationError',
	code,
	email
});

const isMailboxChallengeMetadataRecord = (
	metadata: MailboxChallengeDetails['metadata']
): metadata is MailboxChallengeMetadata =>
	typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata);

const parseChallengeExpiresAt = (metadata: MailboxChallengeMetadata): number | null => {
	const value = metadata.challengeExpiresAt;
	return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

const parseChallengeName = (
	metadata: MailboxChallengeMetadata,
	key: 'givenName' | 'familyName'
): string | null => {
	const value = metadata[key];
	if (typeof value !== 'string') return null;

	const trimmed = value.trim();
	return trimmed || null;
};

const parseChallengeMetadata = (
	purpose: ChallengePurpose,
	metadata: MailboxChallengeDetails['metadata']
): ValidatedChallengeMetadata | null => {
	if (!isMailboxChallengeMetadataRecord(metadata)) return null;

	const challengeExpiresAt = parseChallengeExpiresAt(metadata);
	if (challengeExpiresAt === null) return null;

	if (purpose !== 'signup') {
		return {
			challengeExpiresAt,
			givenName: null,
			familyName: null
		};
	}

	const givenName = parseChallengeName(metadata, 'givenName');
	const familyName = parseChallengeName(metadata, 'familyName');
	if (!givenName || !familyName) return null;

	return {
		challengeExpiresAt,
		givenName,
		familyName
	};
};

const parseChallengeUserId = (userId: string | undefined): number | null => {
	if (!userId || !/^\d+$/.test(userId)) return null;

	const parsed = Number(userId);
	if (!Number.isSafeInteger(parsed) || parsed <= 0) return null;

	return parsed;
};

const toChallenge = (input: {
	challenge: MailboxChallengeDetails;
	purpose: ChallengePurpose;
	expectedUserId?: number | undefined;
}): ValidatedChallenge | ChallengeVerificationError => {
	if (input.challenge.purpose !== input.purpose) {
		return createChallengeVerificationError('PURPOSE_MISMATCH');
	}

	const metadata = parseChallengeMetadata(input.purpose, input.challenge.metadata);
	if (!metadata) {
		return createChallengeVerificationError('CHALLENGE_EXPIRED');
	}

	if (Date.now() > metadata.challengeExpiresAt) {
		return createChallengeVerificationError('CHALLENGE_EXPIRED');
	}

	const userId = input.purpose === 'signup' ? null : parseChallengeUserId(input.challenge.userId);
	if (input.purpose !== 'signup' && userId === null) {
		return createChallengeVerificationError('CHALLENGE_EXPIRED');
	}

	if (input.expectedUserId !== undefined && userId !== null && userId !== input.expectedUserId) {
		return createChallengeVerificationError('UNAUTHORIZED');
	}

	return {
		_tag: 'ValidatedChallenge',
		challenge: {
			id: input.challenge.challengeId,
			purpose: input.purpose,
			userId,
			email: input.challenge.email,
			givenName: metadata.givenName,
			familyName: metadata.familyName,
			createdAt: input.challenge.createdAt,
			challengeExpiresAt: metadata.challengeExpiresAt
		}
	};
};

const toCreatedChallenge = (input: {
	challenge: MailboxChallenge;
	purpose: ChallengePurpose;
	userId: number | null;
	givenName: string | null;
	familyName: string | null;
	challengeExpiresAt: number;
}): CreatedChallenge => ({
	_tag: 'CreatedChallenge',
	challenge: {
		id: input.challenge.challengeId,
		purpose: input.purpose,
		userId: input.userId,
		email: input.challenge.email,
		givenName: input.givenName,
		familyName: input.familyName,
		createdAt: input.challenge.createdAt,
		challengeExpiresAt: input.challengeExpiresAt
	},
	secret: input.challenge.secret,
	code: input.challenge.code,
	message: input.challenge.message
});

const createSignupChallenge = async (input: {
	email: string;
	givenName: string;
	familyName: string;
}): Promise<ChallengeCreationResult> => {
	const { givenName, familyName } = input
	if (!givenName || !familyName) {
		throw new Error('Signup challenge requires given and family names');
	}

	const challengeExpiresAt = Date.now() + CHALLENGE_FLOW_TTL_MS;
	const metadata: MailboxChallengeMetadata = {
		challengeExpiresAt,
		givenName,
		familyName
	};
	const challenge = await createPasslockMailboxChallenge({
		email: input.email,
		purpose: 'signup',
		metadata,
		invalidateOthers: true
	});
	if (isChallengeRateLimitedError(challenge)) return challenge;

	return toCreatedChallenge({
		challenge,
		purpose: 'signup',
		userId: null,
		givenName,
		familyName,
		challengeExpiresAt
	});
};

const createUserChallenge = async (input: {
	purpose: UserChallengePurpose;
	userId: number;
	email: string;
	givenName: string | null;
	familyName: string | null;
}): Promise<ChallengeCreationResult> => {
	const challengeExpiresAt = Date.now() + CHALLENGE_FLOW_TTL_MS;
	const metadata: MailboxChallengeMetadata = {
		challengeExpiresAt
	};
	const challenge = await createPasslockMailboxChallenge({
		email: input.email,
		purpose: input.purpose,
		userId: input.userId,
		metadata,
		invalidateOthers: true
	});
	if (isChallengeRateLimitedError(challenge)) return challenge;

	return toCreatedChallenge({
		challenge,
		purpose: input.purpose,
		userId: input.userId,
		givenName: input.givenName?.trim() ?? null,
		familyName: input.familyName?.trim() ?? null,
		challengeExpiresAt
	});
};

const getPendingChallenge = async (
	challengeId: string,
	purpose: ChallengePurpose
): Promise<Challenge | null> => {
	const challenge = await getPasslockMailboxChallenge({ challengeId });
	if (!challenge) return null;

	const validated = toChallenge({ challenge, purpose });
	return validated._tag === 'ValidatedChallenge' ? validated.challenge : null;
};

/**
 * Read a pending login challenge if it still exists and still matches the
 * expected purpose.
 */
export const getPendingLoginChallenge = async (challengeId: string): Promise<Challenge | null> =>
	getPendingChallenge(challengeId, 'login');

/**
 * Read a pending email-change challenge if it still exists and still matches
 * the expected purpose.
 */
export const getPendingEmailChallenge = async (challengeId: string): Promise<Challenge | null> =>
	getPendingChallenge(challengeId, 'email-change');

/**
 * Read a pending signup challenge if it still exists and still matches the
 * expected purpose.
 */
export const getPendingSignupChallenge = async (challengeId: string): Promise<Challenge | null> =>
	getPendingChallenge(challengeId, 'signup');

const verifyChallenge = async (input: {
	challengeId: string;
	secret: string;
	code: string;
	purpose: ChallengePurpose;
	expectedUserId?: number | undefined;
}): Promise<VerifiedChallenge | ChallengeVerificationError> => {
	const result = await verifyPasslockMailboxChallenge({
		challengeId: input.challengeId,
		code: input.code,
		secret: input.secret
	});

	if (result.success) {
		const validated = toChallenge({
			challenge: result.challenge,
			purpose: input.purpose,
			expectedUserId: input.expectedUserId
		});
		if (validated._tag !== 'ValidatedChallenge') return validated;

		return { _tag: 'VerifiedChallenge', challenge: validated.challenge };
	}

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
 * Create or refresh the login one-time-code challenge for an existing account.
 */
export const createOrRefreshLoginChallenge = async (
	email: string
): Promise<CreatedChallenge | AccountNotFound | ChallengeRateLimitedError> => {
	const account = await getUserByEmail(email);
	if (!account) return { _tag: '@error/AccountNotFound', email };

	return createUserChallenge({
		purpose: 'login',
		userId: account.userId,
		email: account.email,
		givenName: account.givenName,
		familyName: account.familyName
	});
};

/**
 * Create or refresh the signup one-time-code challenge for a new account.
 */
export const createOrRefreshSignupChallenge = async (input: {
	email: string;
	givenName: string;
	familyName: string;
}): Promise<CreatedChallenge | DuplicateUser | ChallengeRateLimitedError> => {
	const existingAccount = await getUserByEmail(input.email);
	if (existingAccount) return { _tag: '@error/DuplicateUser', email: input.email };

	return createSignupChallenge(input);
};

/**
 * Create or refresh the challenge that verifies ownership of a replacement
 * email address for an existing account.
 */
export const createOrRefreshEmailChallenge = async (input: {
	userId: number;
	email: string;
}): Promise<CreatedChallenge | AccountNotFound | DuplicateUser | ChallengeRateLimitedError> => {
	const account = await getUserById(input.userId);
	if (!account) return { _tag: '@error/AccountNotFound', email: input.email };

	const existingAccount = await getUserByEmail(input.email);
	if (existingAccount && existingAccount.userId !== input.userId) {
		return { _tag: '@error/DuplicateUser', email: input.email };
	}

	return createUserChallenge({
		purpose: 'email-change',
		userId: account.userId,
		email: input.email,
		givenName: account.givenName,
		familyName: account.familyName
	});
};

const consumeChallengeByEmail = async (
	challenge: Challenge
): Promise<ConsumedChallenge | ChallengeVerificationError> => {
	const user = await getUserByEmail(challenge.email);
	if (!user) {
		return createChallengeVerificationError('ACCOUNT_NOT_FOUND', challenge.email);
	}

	return { _tag: 'ChallengeConsumed', user };
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
	const verified = await verifyChallenge({
		challengeId: input.challengeId,
		secret: input.secret,
		code: input.code,
		purpose: 'signup'
	});
	if (verified._tag !== 'VerifiedChallenge') return verified;

	const { challenge } = verified;

	const existingAccount = await getUserByEmail(challenge.email);
	if (existingAccount) {
		return { _tag: '@error/DuplicateUser', email: challenge.email };
	}

	const givenName = challenge.givenName;
	const familyName = challenge.familyName;
	if (!givenName || !familyName) {
		return createChallengeVerificationError('CHALLENGE_EXPIRED');
	}

	const createdUser = await createUser({
		email: challenge.email,
		givenName,
		familyName
	});

	if (createdUser._tag === '@error/DuplicateUser') {
		return createdUser;
	}

	return consumeChallengeByEmail(challenge);
};

/**
 * Verify a login code and resolve it to the existing local account.
 */
export const consumeLoginChallenge = async (input: {
	challengeId: string;
	secret: string;
	code: string;
}): Promise<ConsumedChallenge | ChallengeVerificationError> => {
	const verified = await verifyChallenge({
		challengeId: input.challengeId,
		secret: input.secret,
		code: input.code,
		purpose: 'login'
	});
	if (verified._tag !== 'VerifiedChallenge') return verified;

	return consumeChallengeByEmail(verified.challenge);
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
	const verified = await verifyChallenge({
		challengeId: input.challengeId,
		secret: input.secret,
		code: input.code,
		purpose: 'email-change',
		expectedUserId: input.userId
	});
	if (verified._tag !== 'VerifiedChallenge') return verified;

	const { challenge } = verified;

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
	if (isDuplicateUser(updatedUser)) {
		return updatedUser;
	}

	return {
		_tag: 'EmailChangeSuccess',
		user: updatedUser,
		oldEmail: currentAccount.email
	};
};
