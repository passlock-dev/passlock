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
 * @returns apiKey, tenancyId and endpoint
 *
 * @throws 500 error if env variables are not set
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
 * @returns tenancyId, endpoint
 */
export const getPasslockClientConfig = () => {
	const { apiKey, ...rest } = getPasslockConfig();
	return rest;
};

export type MailboxChallengePurpose = 'login' | 'signup' | 'email-change';
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

export const createMailboxChallenge = async (input: {
	email: string;
	purpose: MailboxChallengePurpose;
	userId?: number | undefined;
}): Promise<PasslockServer.MailboxChallenge | ChallengeRateLimitedError> => {
	const result = await PasslockServer.createMailboxChallenge({
		...getPasslockConfig(),
		email: input.email,
		purpose: input.purpose,
		userId: input.userId === undefined ? undefined : String(input.userId)
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

export const verifyMailboxChallenge = async (input: { token: string; code: string }) =>
	PasslockServer.verifyMailboxChallenge({
		...getPasslockConfig(),
		...input
	});
