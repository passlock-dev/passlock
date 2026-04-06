import { deleteSignupLoginCookie, setSignupLoginCookie } from '$lib/server/cookies.js';
import { sendCodeChallengeEmail } from '$lib/server/email.js';
import {
	resendRateLimitResponse,
	resendRedirectResponse,
	resendSuccessResponse
} from '$lib/server/resend.js';
import { createOrRefreshSignupChallenge } from '$lib/server/challenges.js';
import { toLoginLocation } from '$lib/shared/queryState.js';
import type { RequestHandler } from './$types';
import { getPendingSignupChallengeContext } from '../challenge.js';

export const POST: RequestHandler = async ({ cookies }) => {
	const pendingContext = await getPendingSignupChallengeContext(cookies);
	if (pendingContext._tag === 'MissingPendingSignupChallenge') {
		return resendRedirectResponse('/signup');
	}
	if (pendingContext._tag === 'InvalidPendingSignupChallenge') {
		deleteSignupLoginCookie(cookies);
		return resendRedirectResponse('/signup');
	}

	const { challenge } = pendingContext;

	const result = await createOrRefreshSignupChallenge({
		email: challenge.email,
		givenName: challenge.givenName ?? '',
		familyName: challenge.familyName ?? ''
	});

	if (result._tag === '@error/DuplicateUser') {
		deleteSignupLoginCookie(cookies);
		return resendRedirectResponse(
			toLoginLocation({ username: result.email, reason: 'account-exists' })
		);
	}

	if (result._tag === '@error/ChallengeRateLimited') {
		return resendRateLimitResponse(result.retryAfterSeconds);
	}

	await sendCodeChallengeEmail({
		email: result.challenge.email,
		firstName: result.challenge.givenName ?? 'there',
		code: result.code,
		message: result.message
	});

	setSignupLoginCookie(cookies, {
		challengeId: result.challenge.id,
		secret: result.secret
	});

	return resendSuccessResponse();
};
