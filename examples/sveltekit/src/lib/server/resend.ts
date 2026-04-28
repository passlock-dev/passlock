import { json } from '@sveltejs/kit';
import { createChallengeRateLimitView } from './mailbox/mailboxChallenge';
import { sendMailboxVerificationEmail } from './email/index.js';
import type { PendingChallengeCookie } from './cookies.js';
import type { ResendRedirectLocation } from '$lib/shared/routes.js';

type CreatedChallengeLike = {
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

type ChallengeRateLimitedLike = {
	_tag: '@error/ChallengeRateLimited';
	retryAfterSeconds: number;
};

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

/**
 * Shared resend lifecycle once a flow has recovered a valid pending
 * challenge. Flow-specific redirect decisions stay in the caller via
 * `onErrorResult`.
 */
export const resendMailboxChallenge = async <TError extends { _tag: string }>(options: {
	create: () => Promise<CreatedChallengeLike | ChallengeRateLimitedLike | TError>;
	setPendingCookie: (pending: PendingChallengeCookie) => void;
	onErrorResult: (result: TError) => Response | Promise<Response>;
}): Promise<Response> => {
	const result = await options.create();

	if (result._tag === '@error/ChallengeRateLimited') {
		const rateLimited = result as ChallengeRateLimitedLike;
		return resendRateLimitResponse(rateLimited.retryAfterSeconds);
	}

	if (result._tag !== 'CreatedChallenge') {
		return options.onErrorResult(result as TError);
	}

	const created = result as CreatedChallengeLike;

	await sendMailboxVerificationEmail({
		subject: 'Your verification code',
		recipientEmail: created.challenge.email,
		body: created.message,
		code: created.code
	});

	options.setPendingCookie({
		challengeId: created.challenge.id,
		secret: created.secret
	});

	return resendSuccessResponse();
};
