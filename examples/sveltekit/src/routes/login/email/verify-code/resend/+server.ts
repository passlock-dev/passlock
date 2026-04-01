import { deleteSignupLoginCookie, setSignupLoginCookie } from '$lib/server/cookies.js';
import { sendCodeChallengeEmail } from '$lib/server/email.js';
import {
	resendRateLimitResponse,
	resendRedirectResponse,
	resendSuccessResponse
} from '$lib/server/resend.js';
import { createOrRefreshLoginChallenge } from '$lib/server/repository.js';
import { toSignupLocation } from '$lib/shared/queryState.js';
import type { RequestHandler } from './$types';
import { getPendingLoginChallengeContext } from '../challenge.js';

export const POST: RequestHandler = async ({ cookies }) => {
	const pendingContext = await getPendingLoginChallengeContext(cookies);
	if (pendingContext._tag === 'MissingPendingLoginChallenge') {
		return resendRedirectResponse('/login');
	}
	if (pendingContext._tag === 'InvalidPendingLoginChallenge') {
		deleteSignupLoginCookie(cookies);
		return resendRedirectResponse('/login');
	}

	const { challenge } = pendingContext;

	const result = await createOrRefreshLoginChallenge(challenge.email);

	if (result._tag === '@error/AccountNotFound') {
		deleteSignupLoginCookie(cookies);
		return resendRedirectResponse(
			toSignupLocation({ email: challenge.email, reason: 'no-account' }),
			404
		);
	}

	if (result._tag === '@error/ChallengeRateLimited') {
		return resendRateLimitResponse(result.retryAfterSeconds);
	}

	await sendCodeChallengeEmail({
		email: result.challenge.email,
		firstName: result.challenge.givenName ?? 'there',
		code: result.code
	});

	setSignupLoginCookie(cookies, {
		challengeId: result.challenge.id,
		secret: result.secret
	});

	return resendSuccessResponse();
};
