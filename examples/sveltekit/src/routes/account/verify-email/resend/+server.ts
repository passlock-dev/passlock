import { deleteEmailChangeCookie, setEmailChangeCookie } from '$lib/server/cookies.js';
import { sendCodeChallengeEmail } from '$lib/server/email.js';
import { createOrRefreshEmailChallenge } from '$lib/server/repository.js';
import {
	resendErrorResponse,
	resendRateLimitResponse,
	resendRedirectResponse,
	resendSuccessResponse
} from '$lib/server/resend.js';
import { toAccountLocation } from '$lib/shared/queryState.js';
import type { RequestHandler } from './$types';
import {
	getAccountEmailErrorLocation,
	getPendingEmailChangeChallengeContext
} from '../challenge.js';

export const POST: RequestHandler = async ({ locals, cookies }) => {
	if (!locals.user) {
		return resendRedirectResponse('/login', 401);
	}

	const user = locals.user;
	const pendingContext = await getPendingEmailChangeChallengeContext(cookies, user.userId);
	if (pendingContext._tag === 'MissingPendingEmailChangeChallenge') {
		return resendRedirectResponse(toAccountLocation({ emailError: 'expired' }));
	}
	if (pendingContext._tag === 'InvalidPendingEmailChangeChallenge') {
		deleteEmailChangeCookie(cookies);
		return resendRedirectResponse(toAccountLocation({ emailError: 'expired' }));
	}

	const { challenge } = pendingContext;

	const result = await createOrRefreshEmailChallenge({
		userId: user.userId,
		email: challenge.email
	});

	if (result._tag === '@error/AccountNotFound') {
		deleteEmailChangeCookie(cookies);
		return resendRedirectResponse('/login', 401);
	}

	if (result._tag === '@error/DuplicateUser') {
		deleteEmailChangeCookie(cookies);
		return resendRedirectResponse(getAccountEmailErrorLocation('taken', challenge.email));
	}

	if (result._tag === '@error/ChallengeRateLimited') {
		return resendRateLimitResponse(result.retryAfterSeconds);
	}

	if (result._tag !== 'CreatedChallenge') {
		return resendErrorResponse();
	}

	await sendCodeChallengeEmail({
		email: result.challenge.email,
		firstName: user.givenName,
		code: result.code
	});

	setEmailChangeCookie(cookies, {
		challengeId: result.challenge.id,
		secret: result.secret
	});

	return resendSuccessResponse();
};
