import {
	deleteSignupLoginCookie,
	getSignupLoginCookie,
	setSignupLoginCookie
} from '$lib/server/cookies.js';
import {
	resendMailboxChallenge,
	resendErrorResponse,
	resendRedirectResponse
} from '$lib/server/resend.js';
import { getPendingChallengeContext } from '$lib/server/mailbox/pendingChallenge.js';
import {
	createOrRefreshSignupChallenge,
	getPendingSignupChallenge
} from '$lib/server/mailbox/signupChallenge.js';
import { toLoginLocation } from '$lib/shared/queryState.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	const pendingContext = await getPendingChallengeContext({
		cookies,
		getPendingCookie: getSignupLoginCookie,
		getChallenge: getPendingSignupChallenge
	});
	if (pendingContext._tag === 'MissingPendingChallenge') {
		return resendRedirectResponse('/signup');
	}
	if (pendingContext._tag === 'InvalidPendingChallenge') {
		deleteSignupLoginCookie(cookies);
		return resendRedirectResponse('/signup');
	}

	const { challenge } = pendingContext;

	return resendMailboxChallenge({
		create: () =>
			createOrRefreshSignupChallenge({
				email: challenge.email,
				givenName: challenge.givenName,
				familyName: challenge.familyName
			}),
		setPendingCookie: (pending) => setSignupLoginCookie(cookies, pending),
		onErrorResult: (result) => {
			if (result._tag === '@error/DuplicateUser') {
				deleteSignupLoginCookie(cookies);
				return resendRedirectResponse(
					toLoginLocation({ username: result.email, reason: 'account-exists' })
				);
			}

			return resendErrorResponse();
		}
	});
};
