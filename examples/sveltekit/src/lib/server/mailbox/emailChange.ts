import * as v from 'valibot';
import * as PasslockServer from '@passlock/server/safe';
import type { MailboxChallengeMetadata } from '@passlock/server/safe';
import { error as kitError } from '@sveltejs/kit';
import { CHALLENGE_FLOW_TTL_MS } from '../cookies.js';
import { getPasslockConfig } from '../passlock.js';
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
	createInvalidChallengeError,
	getPasslockMailboxChallenge,
	isDuplicateUser,
	isProcessExpired,
} from './mailboxChallenge.js';

export type EmailChangeChallenge = {
  _tag: "EmailChangeChallenge";
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

/**
 * Returned when an email-change challenge has been verified and applied.
 */
export type EmailChangeSuccess = {
	_tag: 'EmailChangeSuccess';
	user: SessionUser;
	oldEmail: string;
};

const toEmailChangeChallenge = (
	details: PasslockServer.MailboxChallengeDetails
): EmailChangeChallenge | InvalidChallengeError => {
	if (details.purpose !== 'email-change') {
		return createInvalidChallengeError('Challenge purpose does not match email-change flow');
	}

	const parsed = v.safeParse(BaseMetadataSchema, details.metadata);
	if (!parsed.success) {
		return createInvalidChallengeError('Challenge metadata is malformed');
	}

	if (isProcessExpired(parsed.output.processExpiresAt)) {
		return createInvalidChallengeError('Email-change flow has expired');
	}

	const userIdRaw = details.userId;
	const userId = userIdRaw && /^\d+$/.test(userIdRaw) ? Number(userIdRaw) : NaN;
	if (!Number.isSafeInteger(userId) || userId <= 0) {
		return createInvalidChallengeError('Challenge is not bound to a valid user');
	}

	return {
    _tag: "EmailChangeChallenge",
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

	const result = await PasslockServer.createMailboxChallenge({
		...getPasslockConfig(),
		email: account.email,
		purpose: 'email-change',
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
}): Promise<
	| EmailChangeSuccess
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

	const challenge = toEmailChangeChallenge(result.value.challenge);
  if (challenge._tag === "@error/InvalidChallenge") return challenge;

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
	if (isDuplicateUser(updatedUser)) return updatedUser;

	return {
		_tag: 'EmailChangeSuccess',
		user: updatedUser,
		oldEmail: currentAccount.email
	};
};
