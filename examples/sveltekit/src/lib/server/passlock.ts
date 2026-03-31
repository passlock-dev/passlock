import { PASSLOCK_API_KEY } from '$env/static/private';
import { PUBLIC_PASSLOCK_ENDPOINT, PUBLIC_PASSLOCK_TENANCY_ID } from '$env/static/public';
import * as PasslockServer from '@passlock/server/safe';
import {
	CHALLENGE_RATE_LIMIT_READY_MESSAGE,
	getChallengeRateLimitRemainingSeconds,
	type ChallengeRateLimitView
} from '$lib/shared/challengeRateLimit.js';
import { error as kitError } from '@sveltejs/kit';

/**
 * Read the server-side Passlock configuration.
 *
 * Server handlers use this when they need the private API key to exchange
 * codes, create mailbox challenges, or mutate passkeys in the Passlock vault.
 * It intentionally throws a 500 if the sample has not been configured yet,
 * because none of the auth flows can work without these values.
 */
export const getPasslockConfig = () => {
	const apiKey = PASSLOCK_API_KEY;
	const tenancyId = PUBLIC_PASSLOCK_TENANCY_ID;
	const endpoint = PUBLIC_PASSLOCK_ENDPOINT;

	if (!apiKey || !tenancyId) {
		console.error('Passlock not configured');
		kitError(500, 'Passlock not configured');
	}

	return {
		tenancyId,
		apiKey,
		endpoint: endpoint || undefined
	} as const;
};

/**
 * Read the subset of Passlock config that is safe to expose to the browser.
 *
 * Client code needs the tenancy and optional endpoint so it can talk to
 * Passlock via `@passlock/client`, but it must never receive the API key.
 */
export const getPasslockClientConfig = () => {
	const { apiKey, ...rest } = getPasslockConfig();
	return rest;
};

export type MailboxChallengePurpose = 'login' | 'signup' | 'email-change';
export type MailboxChallengeMetadataValue =
	| string
	| number
	| boolean
	| null
	| ReadonlyArray<MailboxChallengeMetadataValue>
	| MailboxChallengeMetadata;

export interface MailboxChallengeMetadata {
	readonly [key: string]: MailboxChallengeMetadataValue;
}

export type MailboxChallenge = PasslockServer.MailboxChallenge;
export type MailboxChallengeDetails = PasslockServer.MailboxChallengeDetails;
export type ChallengeRateLimitedError = {
	_tag: '@error/ChallengeRateLimited';
	message: string;
	retryAfterSeconds: number;
};

export const isChallengeRateLimitedError = (value: unknown): value is ChallengeRateLimitedError =>
	typeof value === 'object' &&
	value !== null &&
	'_tag' in value &&
	value._tag === '@error/ChallengeRateLimited' &&
	'retryAfterSeconds' in value &&
	typeof value.retryAfterSeconds === 'number';

const normaliseRetryAfterSeconds = (retryAfterSeconds: number) =>
	Math.max(1, Math.ceil(Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : 1));

const normaliseRetryAtMs = (retryAtMs: number) =>
	Number.isFinite(retryAtMs) ? Math.ceil(retryAtMs) : Date.now();

export const createChallengeRateLimitView = (retryAfterSeconds: number): ChallengeRateLimitView => {
	const initialRemainingSeconds = normaliseRetryAfterSeconds(retryAfterSeconds);

	return {
		retryAtMs: Date.now() + initialRemainingSeconds * 1000,
		initialRemainingSeconds,
		readyMessage: CHALLENGE_RATE_LIMIT_READY_MESSAGE
	};
};

export const restoreChallengeRateLimitView = (retryAtMs: number): ChallengeRateLimitView => {
	const normalisedRetryAtMs = normaliseRetryAtMs(retryAtMs);

	return {
		retryAtMs: normalisedRetryAtMs,
		initialRemainingSeconds: getChallengeRateLimitRemainingSeconds(normalisedRetryAtMs),
		readyMessage: CHALLENGE_RATE_LIMIT_READY_MESSAGE
	};
};

/**
 * Create a Passlock mailbox challenge for one-time-code flows.
 *
 * The returned challenge includes the code and secret needed by the rest of
 * the sample. Route handlers persist only the challenge id and secret in a
 * short-lived cookie; the user receives the code separately by email.
 */
export const createMailboxChallenge = async (input: {
	email: string;
	purpose: MailboxChallengePurpose;
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
export const getMailboxChallenge = async (input: {
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
export const verifyMailboxChallenge = async (input: {
	challengeId: string;
	secret: string;
	code: string;
}) =>
	PasslockServer.verifyMailboxChallenge({
		...getPasslockConfig(),
		...input
	});
