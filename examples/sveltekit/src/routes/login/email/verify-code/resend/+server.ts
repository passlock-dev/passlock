import {
	deleteSignupLoginCookie,
	getSignupLoginCookie,
	setSignupLoginCookie
} from '$lib/server/cookies.js';
import {
	resendMailboxChallenge,
	resendRedirectResponse,
	resendErrorResponse
} from '$lib/server/resend.js';
import { getPendingChallengeContext } from '$lib/server/mailbox/pendingChallenge.js';
import {
	createOrRefreshLoginChallenge,
	getPendingLoginChallenge
} from '$lib/server/mailbox/loginChallenge.js';
import { toSignupLocation } from '$lib/shared/queryState.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	const pendingContext = await getPendingChallengeContext({
		cookies,
		getPendingCookie: getSignupLoginCookie,
		getChallenge: getPendingLoginChallenge
	});
	if (pendingContext._tag === 'MissingPendingChallenge') {
		return resendRedirectResponse('/login');
	}
	if (pendingContext._tag === 'InvalidPendingChallenge') {
		deleteSignupLoginCookie(cookies);
		return resendRedirectResponse('/login');
	}

	const { challenge } = pendingContext;

	return resendMailboxChallenge({
		create: () => createOrRefreshLoginChallenge(challenge.email),
		setPendingCookie: (pending) => setSignupLoginCookie(cookies, pending),
		onErrorResult: (result) => {
			if (result._tag === '@error/AccountNotFound') {
				deleteSignupLoginCookie(cookies);
				return resendRedirectResponse(
					toSignupLocation({ email: challenge.email, reason: 'no-account' }),
					404
				);
			}

			return resendErrorResponse();
		}
	});
};
