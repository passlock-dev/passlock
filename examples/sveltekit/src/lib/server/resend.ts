import { json } from '@sveltejs/kit';
import { createChallengeRateLimitView } from './mailboxChallenge.js';
import type { ResendRedirectLocation } from '$lib/shared/routes.js';

/**
 * Shared transport helpers for the route-local resend endpoints.
 * These deliberately only shape the JSON response, leaving the
 * flow-specific branching in each route.
 */
export const resendSuccessResponse = (message = 'A new code has been sent') =>
	json({ _tag: 'ResendChallengeSuccess' as const, message });

export const resendRedirectResponse = (location: ResendRedirectLocation, status = 409) =>
	json({ _tag: 'ResendChallengeRedirect' as const, location }, { status });

export const resendRateLimitResponse = (retryAfterSeconds: number) =>
	json(
		{
			_tag: 'ResendChallengeRateLimited' as const,
			rateLimit: createChallengeRateLimitView(retryAfterSeconds)
		},
		{ status: 429 }
	);

export const resendErrorResponse = (message = 'Unable to send a new code.', status = 500) =>
	json({ _tag: '@error/Error' as const, message }, { status });
