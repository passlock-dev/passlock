import * as PasslockServer from '@passlock/server/safe';
import type { MailboxChallengeDetails, MailboxChallengeMetadata } from '@passlock/server/safe';
import { error as kitError } from '@sveltejs/kit';
import {
	CHALLENGE_RATE_LIMIT_READY_MESSAGE,
	type ChallengeRateLimitView
} from '$lib/shared/challengeRateLimit.js';
import * as v from 'valibot';
import { getPasslockConfig } from '../passlock.js';
import type { SessionUser } from '../repository.js';

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

	return result.value;
};

/**
 * Create a Passlock mailbox challenge while normalising the rate-limit and
 * forbidden handling shared by each flow.
 */
export const createPasslockMailboxChallenge = async (input: {
	email: string;
	purpose: string;
	userId?: string;
	metadata: MailboxChallengeMetadata;
	invalidateOthers?: boolean;
	skipRateLimit?: boolean;
}): Promise<PasslockServer.MailboxChallengeCreated | ChallengeRateLimitedError> => {
	const result = await PasslockServer.createMailboxChallenge({
		...getPasslockConfig(),
		...input
	});

	if (result.failure) {
		if (PasslockServer.isChallengeRateLimitedError(result)) {
			return result.error;
		}

		kitError(500, 'Unable to create one-time code challenge');
	}

	return result.value;
};

/**
 * Verify a Passlock mailbox challenge while centralising forbidden handling.
 */
export const verifyPasslockMailboxChallenge = async (input: {
	challengeId: string;
	secret: string;
	code: string;
}): Promise<
	| PasslockServer.MailboxChallengeVerified
	| InvalidChallengeError
	| InvalidChallengeCodeError
	| ChallengeExpiredError
	| ChallengeAttemptsExceededError
> => {
	const result = await PasslockServer.verifyMailboxChallenge({
		...getPasslockConfig(),
		...input
	});

	if (!result.success) {
		if (result._tag === '@error/Forbidden') {
			console.error('Unable to verify mailbox challenge', result);
			kitError(500, 'Unable to verify one-time code challenge');
		}

		return result.error;
	}

	return result.value;
};

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

type BaseMetadata = v.InferOutput<typeof BaseMetadataSchema>;

type MailboxMetadataSchema = Parameters<typeof v.safeParse>[0];

type ValidatedMailboxChallenge<TMetadata extends BaseMetadata> = {
	_tag: 'ValidatedMailboxChallenge';
	id: string;
	email: string;
	userId: string | undefined;
	metadata: TMetadata;
};

/**
 * Validate the common purpose and metadata invariants for a readable mailbox
 * challenge before a flow projects it into a route-specific type.
 */
export const validateMailboxChallenge = <TMetadata extends BaseMetadata>(
	details: PasslockServer.MailboxChallengeDetails,
	options: {
		purpose: string;
		metadataSchema: MailboxMetadataSchema;
		expiredMessage: string;
		invalidPurposeMessage?: string;
		invalidMetadataMessage?: string;
	}
): ValidatedMailboxChallenge<TMetadata> | InvalidChallengeError => {
	if (details.purpose !== options.purpose) {
		return createInvalidChallengeError(
			options.invalidPurposeMessage ?? `Challenge purpose does not match ${options.purpose} flow`
		);
	}

	const parsed = v.safeParse(options.metadataSchema, details.metadata);
	if (!parsed.success) {
		return createInvalidChallengeError(
			options.invalidMetadataMessage ?? 'Challenge metadata is malformed'
		);
	}

	const metadata = parsed.output as TMetadata;
	if (isProcessExpired(metadata.processExpiresAt)) {
		return createInvalidChallengeError(options.expiredMessage);
	}

	return {
		_tag: 'ValidatedMailboxChallenge',
		id: details.challengeId,
		email: details.email,
		userId: details.userId,
		metadata
	};
};

/**
 * Parse a challenge-bound numeric user id, returning a challenge error when
 * the binding is missing or malformed.
 */
export const parseChallengeUserId = (
	userIdRaw: string | undefined,
	invalidMessage = 'Challenge is not bound to a valid user'
): number | InvalidChallengeError => {
	const userId = userIdRaw && /^\d+$/.test(userIdRaw) ? Number(userIdRaw) : Number.NaN;
	if (!Number.isSafeInteger(userId) || userId <= 0) {
		return createInvalidChallengeError(invalidMessage);
	}

	return userId;
};

/**
 * Map expected verification failures to the shared user-facing form message.
 */
export const getChallengeCodeErrorMessage = (result: { _tag: string }) => {
	if (result._tag === '@error/ChallengeExpired') {
		return 'This code has expired. Request a new one.';
	}

	if (result._tag === '@error/ChallengeAttemptsExceeded') {
		return 'Too many incorrect attempts. Request a new code.';
	}

	return 'Invalid code';
};
