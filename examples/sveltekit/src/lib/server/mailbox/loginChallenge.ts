import type { MailboxChallengeDetails, MailboxChallengeMetadata } from '@passlock/server/safe';
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
	getPasslockMailboxChallenge,
	validateMailboxChallenge,
	verifyPasslockMailboxChallenge
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
	code: string;
	message: {
		html: string;
		text: string;
	};
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
	const metadata: MailboxChallengeMetadata = { processExpiresAt };

	const result = await createPasslockMailboxChallenge({
		email: account.email,
		purpose: 'login',
		userId: String(account.userId),
		metadata,
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
	return result._tag === '@error/InvalidChallenge' ? null : result;
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
	const result = await verifyPasslockMailboxChallenge(input);
	if (result._tag !== 'ChallengeVerified') return result;

	const challenge = toLoginChallenge(result.challenge);
	if (challenge._tag === '@error/InvalidChallenge') return challenge;

	const user = await getUserByEmail(challenge.email);
	if (!user) {
		return { _tag: '@error/AccountNotFound', email: challenge.email };
	}

	return { _tag: 'ChallengeConsumed', user };
};
