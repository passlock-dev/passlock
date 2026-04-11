import * as PasslockServer from '@passlock/server/safe';
import type { MailboxChallengeDetails } from '@passlock/server/safe';
import { error as kitError } from '@sveltejs/kit';
import {
	CHALLENGE_RATE_LIMIT_READY_MESSAGE,
	type ChallengeRateLimitView
} from '$lib/shared/challengeRateLimit.js';
import * as v from 'valibot';
import { getPasslockConfig } from '../passlock.js';
import { type DuplicateUser, type SessionUser } from '../repository.js';

// ============================================================================
// Passlock SDK wrappers
// ============================================================================

/**
 * Tagged rate-limited error surfaced to callers when Passlock refuses a
 * mailbox challenge because the tenancy has exceeded its allowance.
 */
export type ChallengeRateLimitedError = PasslockServer.ChallengeRateLimitedError;

/**
 * Re-exports of the Passlock mailbox verify error payloads so the challenge
 * modules and route handlers have a single import surface for the errors
 * produced by `verifyMailboxChallenge`.
 */
export type InvalidChallengeError = PasslockServer.InvalidChallengeError;
export type InvalidChallengeCodeError = PasslockServer.InvalidChallengeCodeError;
export type ChallengeExpiredError = PasslockServer.ChallengeExpiredError;
export type ChallengeAttemptsExceededError = PasslockServer.ChallengeAttemptsExceededError;

/**
 * Read challenge details from Passlock so loaders can recover or validate
 * in-progress login, signup, or email-change flows.
 */
export const getPasslockMailboxChallenge = async (input: {
	challengeId: string;
}): Promise<MailboxChallengeDetails | null> => {
	const result = await PasslockServer.getMailboxChallenge({
		...getPasslockConfig(),
		...input
	});

	if (result.failure) {
		if (PasslockServer.isNotFoundError(result.error)) {
			return null;
		} else {
			console.error('Unable to read mailbox challenge', result);
			kitError(500, 'Unable to read one-time code challenge');
		}
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
export const verifyPasslockMailboxChallenge = async (input: {
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

/**
 * Build a rate-limit view from a `retryAfterSeconds` value. The value is
 * either fresh from a Passlock rate-limited response or rehydrated from
 * previously persisted query state.
 */
export const createChallengeRateLimitView = (
	retryAfterSeconds: number
): ChallengeRateLimitView => ({
	retryAfterSeconds,
	readyMessage: CHALLENGE_RATE_LIMIT_READY_MESSAGE
});

// ============================================================================
// Shared types and helpers
// ============================================================================

/**
 * Returned when a challenge successfully identifies a local account.
 */
export type ConsumedChallenge = {
	_tag: 'ChallengeConsumed';
	user: SessionUser;
};

/**
 * Build a synthetic {@link InvalidChallengeError} for app-level checks that
 * invalidate a challenge before Passlock is consulted (purpose mismatch,
 * malformed metadata, local process expiry, ownership mismatch).
 */
export const createInvalidChallengeError = (message: string): InvalidChallengeError => ({
	_tag: '@error/InvalidChallenge',
	message
});

/**
 * Minimal metadata schema common to every flow. The `processExpiresAt`
 * timestamp bounds the local process flow (e.g. how long the user has from
 * first submitting their signup details to finishing verification) and is
 * distinct from Passlock's native `expiresAt`, which bounds the validity of
 * the emailed code.
 */
export const BaseMetadataSchema = v.object({
	processExpiresAt: v.number()
});

export const isProcessExpired = (processExpiresAt: number): boolean =>
	Date.now() > processExpiresAt;

export const isDuplicateUser = (user: SessionUser | DuplicateUser): user is DuplicateUser =>
	'_tag' in user && user._tag === '@error/DuplicateUser';
