import * as v from 'valibot';
import * as PasslockServer from '@passlock/server/safe';
import type { MailboxChallengeMetadata } from '@passlock/server/safe';
import { error as kitError } from '@sveltejs/kit';
import { CHALLENGE_FLOW_TTL_MS } from '../cookies.js';
import { getPasslockConfig } from '../passlock.js';
import { createUser, getUserByEmail, type DuplicateUser } from '../repository.js';
import {
	type ChallengeAttemptsExceededError,
	type ChallengeExpiredError,
	type ChallengeRateLimitedError,
	type ConsumedChallenge,
	type InvalidChallengeCodeError,
	type InvalidChallengeError,
	createInvalidChallengeError,
	getPasslockMailboxChallenge,
	isProcessExpired
} from './mailboxChallenge.js';

const SignupMetadataSchema = v.object({
	processExpiresAt: v.number(),
	givenName: v.pipe(v.string(), v.trim(), v.nonEmpty()),
	familyName: v.pipe(v.string(), v.trim(), v.nonEmpty())
});

export type SignupChallenge = {
	_tag: 'SignupChallenge';
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
	details: PasslockServer.MailboxChallengeDetails
): SignupChallenge | InvalidChallengeError => {
	if (details.purpose !== 'signup') {
		return createInvalidChallengeError('Challenge purpose does not match signup flow');
	}

	const parsed = v.safeParse(SignupMetadataSchema, details.metadata);
	if (!parsed.success) {
		return createInvalidChallengeError('Challenge metadata is malformed');
	}

	if (isProcessExpired(parsed.output.processExpiresAt)) {
		return createInvalidChallengeError('Signup flow has expired');
	}

	return {
		_tag: 'SignupChallenge',
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

	const result = await PasslockServer.createMailboxChallenge({
		...getPasslockConfig(),
		email: input.email,
		purpose: 'signup',
		metadata,
		invalidateOthers: true,
		skipRateLimit: true
	});

	if (result.failure) {
		if (PasslockServer.isChallengeRateLimitedError(result)) {
			return result.error;
		} else {
			kitError(500, 'Unable to create one-time code challenge');
		}
	}

	const challenge = result.value.challenge;

	return {
		_tag: 'CreatedChallenge',
		challenge: {
			_tag: 'SignupChallenge',
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
	const challenge = await getPasslockMailboxChallenge({ challengeId });
	if (!challenge) return null;

	const result = toSignupChallenge(challenge);
	return result._tag === "@error/InvalidChallenge" ? null : result
};

/**
 * Verify a signup code, create the local account if needed, and resolve to
 * the new session user.
 */
export const consumeSignupChallenge = async (input: {
	challengeId: string;
	secret: string;
	code: string;
}): Promise<
	| ConsumedChallenge
	| DuplicateUser
	| InvalidChallengeError
	| InvalidChallengeCodeError
	| ChallengeExpiredError
	| ChallengeAttemptsExceededError
> => {
	const result = await PasslockServer.verifyMailboxChallenge({
		...getPasslockConfig(),
		challengeId: input.challengeId,
		code: input.code,
		secret: input.secret
	});
	if (!result.success) {
		if (result._tag === '@error/Forbidden') {
			console.error('Unable to verify mailbox challenge', result);
			kitError(500, 'Unable to verify one-time code challenge');
		}
		return result.error;
	}

	const challenge = toSignupChallenge(result.challenge);
	if (challenge._tag === '@error/InvalidChallenge') return challenge;

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
		console.error('Unable to load newly created account', { email: challenge.email });
		kitError(500, 'Unable to load newly created account');
	}

	return { _tag: 'ChallengeConsumed', user };
};
