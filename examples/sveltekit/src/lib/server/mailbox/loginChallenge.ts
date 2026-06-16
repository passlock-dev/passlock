import type { MailboxChallengeDetails } from '@passlock/server';
import { CHALLENGE_FLOW_TTL_MS } from '../cookies.js';
import { getUserByEmail, type AccountNotFound } from '../repository.js';
import {
	type ChallengeAttemptsExceededError,
	type ChallengeExpiredError,
	type ChallengeRateLimitedError,
	type ConsumedChallenge,
	type InvalidChallengeCodeError,
	type InvalidChallengeError,
	BaseMetadataSchema,
	createPasslockMailboxChallenge,
	getProjectedMailboxChallenge,
	validateMailboxChallenge,
	verifyAndProjectMailboxChallenge
} from './mailboxChallenge.js';

import type * as v from 'valibot';

export type LoginChallenge = {
	_tag: 'LoginChallenge';
	id: string;
	email: string;
	processExpiresAt: number;
};

export type CreatedLoginChallenge = {
	_tag: 'CreatedChallenge';
	challenge: LoginChallenge;
	secret: string;
};

type LoginMetadata = v.InferOutput<typeof BaseMetadataSchema>;

const toLoginChallenge = (
	details: MailboxChallengeDetails
): LoginChallenge | InvalidChallengeError => {
	const challenge = validateMailboxChallenge<LoginMetadata>(details, {
		purpose: 'login',
		metadataSchema: BaseMetadataSchema,
		expiredMessage: 'Login flow has expired'
	});
	if (challenge._tag === '@error/InvalidChallenge') return challenge;

	return {
		_tag: 'LoginChallenge',
		id: challenge.id,
		email: challenge.email,
		processExpiresAt: challenge.metadata.processExpiresAt
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

	const result = await createPasslockMailboxChallenge({
		email: account.email,
		purpose: 'login',
		userId: String(account.userId),
		metadata: { processExpiresAt },
		invalidateOthers: true,
		skipRateLimit: true
	});
	if (result._tag === '@error/ChallengeRateLimited') return result;

	const challenge = result.challenge;

	return {
		_tag: 'CreatedChallenge',
		challenge: {
			_tag: 'LoginChallenge',
			id: challenge.challengeId,
			email: challenge.email,
			processExpiresAt
		},
		secret: challenge.secret
	};
};

/**
 * Read a pending login challenge if it still exists and still matches the
 * expected purpose.
 */
export const getPendingLoginChallenge = (challengeId: string): Promise<LoginChallenge | null> =>
	getProjectedMailboxChallenge(challengeId, toLoginChallenge);

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
	const challenge = await verifyAndProjectMailboxChallenge(input, toLoginChallenge);
	if (challenge._tag !== 'LoginChallenge') return challenge;

	const user = await getUserByEmail(challenge.email);
	if (!user) {
		return { _tag: '@error/AccountNotFound', email: challenge.email };
	}

	return { _tag: 'ChallengeConsumed', user };
};
