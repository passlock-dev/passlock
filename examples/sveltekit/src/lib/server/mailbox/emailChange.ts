import type { MailboxChallengeDetails } from '@passlock/server';
import { error as kitError } from '@sveltejs/kit';
import { CHALLENGE_FLOW_TTL_MS } from '../cookies.js';
import {
	getUserByEmail,
	getUserById,
	updateUserEmail,
	type AccountNotFound,
	type DuplicateUser,
	type SessionUser
} from '../repository.js';
import {
	type ChallengeAttemptsExceededError,
	type ChallengeExpiredError,
	type ChallengeRateLimitedError,
	type InvalidChallengeCodeError,
	type InvalidChallengeError,
	BaseMetadataSchema,
	createPasslockMailboxChallenge,
	createInvalidChallengeError,
	getProjectedMailboxChallenge,
	parseChallengeUserId,
	validateMailboxChallenge,
	verifyAndProjectMailboxChallenge
} from './mailboxChallenge.js';

import type * as v from 'valibot';

export type EmailChangeChallenge = {
	_tag: 'EmailChangeChallenge';
	id: string;
	email: string;
	userId: number;
	processExpiresAt: number;
};

export type CreatedEmailChangeChallenge = {
	_tag: 'CreatedChallenge';
	challenge: EmailChangeChallenge;
	secret: string;
	code: string;
	message: {
		html: string;
		text: string;
	};
};

/**
 * Returned when an email-change challenge has been verified and applied.
 */
export type EmailChangeSuccess = {
	_tag: 'EmailChangeSuccess';
	user: SessionUser;
	oldEmail: string;
};

type EmailChangeMetadata = v.InferOutput<typeof BaseMetadataSchema>;

const toEmailChangeChallenge = (
	details: MailboxChallengeDetails
): EmailChangeChallenge | InvalidChallengeError => {
	const challenge = validateMailboxChallenge<EmailChangeMetadata>(details, {
		purpose: 'email-change',
		metadataSchema: BaseMetadataSchema,
		expiredMessage: 'Email-change flow has expired'
	});
	if (challenge._tag === '@error/InvalidChallenge') return challenge;

	const userId = parseChallengeUserId(challenge.userId);
	if (typeof userId !== 'number') return userId;

	return {
		_tag: 'EmailChangeChallenge',
		id: challenge.id,
		email: challenge.email,
		userId,
		processExpiresAt: challenge.metadata.processExpiresAt
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

	const result = await createPasslockMailboxChallenge({
		email: input.email,
		purpose: 'email-change',
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
			_tag: 'EmailChangeChallenge',
			id: challenge.challengeId,
			email: challenge.email,
			userId: account.userId,
			processExpiresAt
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
export const getPendingEmailChallenge = (
	challengeId: string
): Promise<EmailChangeChallenge | null> =>
	getProjectedMailboxChallenge(challengeId, toEmailChangeChallenge);

/**
 * Verify an email-change code, ensure it belongs to the signed-in user, and
 * update the local account email address.
 */
export const consumeEmailChallenge = async (input: {
	challengeId: string;
	secret: string;
	code: string;
	userId: number;
}): Promise<
	| EmailChangeSuccess
	| DuplicateUser
	| InvalidChallengeError
	| InvalidChallengeCodeError
	| ChallengeExpiredError
	| ChallengeAttemptsExceededError
> => {
	const challenge = await verifyAndProjectMailboxChallenge(input, toEmailChangeChallenge);
	if (challenge._tag !== 'EmailChangeChallenge') return challenge;

	if (challenge.userId !== input.userId) {
		return createInvalidChallengeError('Challenge does not belong to the signed-in user');
	}

	const currentAccount = await getUserById(input.userId);
	if (!currentAccount) {
		console.error('Unable to load signed-in account', { userId: input.userId });
		kitError(500, 'Unable to load signed-in account');
	}

	const existingAccount = await getUserByEmail(challenge.email);
	if (existingAccount && existingAccount.userId !== input.userId) {
		return { _tag: '@error/DuplicateUser', email: challenge.email };
	}

	const updatedUser = await updateUserEmail(input.userId, challenge.email);
	if (!updatedUser) {
		console.error('Unable to load signed-in account after email update', {
			userId: input.userId
		});
		kitError(500, 'Unable to load signed-in account');
	}
	if (updatedUser._tag === '@error/DuplicateUser') return updatedUser;

	return {
		_tag: 'EmailChangeSuccess',
		user: updatedUser,
		oldEmail: currentAccount.email
	};
};
