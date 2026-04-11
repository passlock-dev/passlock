import * as v from 'valibot';
import * as PasslockServer from '@passlock/server/safe';
import type { MailboxChallengeMetadata } from '@passlock/server/safe';
import { error as kitError } from '@sveltejs/kit';
import { CHALLENGE_FLOW_TTL_MS } from '../cookies.js';
import { getPasslockConfig } from '../passlock.js';
import { getUserByEmail, type AccountNotFound } from '../repository.js';
import {
	type ChallengeAttemptsExceededError,
	type ChallengeExpiredError,
	type ChallengeRateLimitedError,
	type ConsumedChallenge,
	type InvalidChallengeCodeError,
	type InvalidChallengeError,
	BaseMetadataSchema,
	createInvalidChallengeError,
	getPasslockMailboxChallenge,
	isProcessExpired,
	verifyPasslockMailboxChallenge
} from './mailboxChallenge.js';

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
	details: PasslockServer.MailboxChallengeDetails
): LoginChallenge | InvalidChallengeError => {
	if (details.purpose !== 'login') {
		return createInvalidChallengeError('Challenge purpose does not match login flow');
	}

	const parsed = v.safeParse(BaseMetadataSchema, details.metadata);
	if (!parsed.success) {
		return createInvalidChallengeError('Challenge metadata is malformed');
	}

	if (isProcessExpired(parsed.output.processExpiresAt)) {
		return createInvalidChallengeError('Login flow has expired');
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

	const result = await PasslockServer.createMailboxChallenge({
		...getPasslockConfig(),
		email: account.email,
		purpose: 'login',
		userId: String(account.userId),
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
}): Promise<
	| ConsumedChallenge
	| AccountNotFound
	| InvalidChallengeError
	| InvalidChallengeCodeError
	| ChallengeExpiredError
	| ChallengeAttemptsExceededError
> => {
	const result = await verifyPasslockMailboxChallenge({
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

	const challenge = toLoginChallenge(result.challenge);
	if ('_tag' in challenge) return challenge;

	const user = await getUserByEmail(challenge.email);
	if (!user) {
		return { _tag: '@error/AccountNotFound', email: challenge.email };
	}

	return { _tag: 'ChallengeConsumed', user };
};
