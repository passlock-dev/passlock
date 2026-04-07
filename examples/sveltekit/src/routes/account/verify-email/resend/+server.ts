import {
	deleteEmailChangeCookie,
	getEmailChangeCookie,
	setEmailChangeCookie
} from '$lib/server/cookies.js';
import {
	createOrRefreshEmailChallenge,
	getPendingEmailChallenge
} from '$lib/server/mailbox/emailChange.js';
import { getPendingChallengeContext } from '$lib/server/mailbox/pendingChallenge.js';
import {
	resendErrorResponse,
	resendMailboxChallenge,
	resendRedirectResponse
} from '$lib/server/resend.js';
import { toAccountLocation } from '$lib/shared/queryState.js';
import type { RequestHandler } from './$types';
import { getAccountEmailErrorLocation } from '../challenge.js';

export const POST: RequestHandler = async ({ locals, cookies }) => {
	if (!locals.user) {
		return resendRedirectResponse('/login', 401);
	}

	const user = locals.user;
	const pendingContext = await getPendingChallengeContext({
		cookies,
		getPendingCookie: getEmailChangeCookie,
		getChallenge: getPendingEmailChallenge,
		validateChallenge: (challenge) => challenge.userId === user.userId
	});
	if (pendingContext._tag === 'MissingPendingChallenge') {
		return resendRedirectResponse(toAccountLocation({ emailError: 'expired' }));
	}
	if (pendingContext._tag === 'InvalidPendingChallenge') {
		deleteEmailChangeCookie(cookies);
		return resendRedirectResponse(toAccountLocation({ emailError: 'expired' }));
	}

	const { challenge } = pendingContext;

	return resendMailboxChallenge({
		create: () =>
			createOrRefreshEmailChallenge({
				userId: user.userId,
				email: challenge.email
			}),
		setPendingCookie: (pending) => setEmailChangeCookie(cookies, pending),
		onErrorResult: (result) => {
			if (result._tag === '@error/AccountNotFound') {
				deleteEmailChangeCookie(cookies);
				return resendRedirectResponse('/login', 401);
			}

			if (result._tag === '@error/DuplicateUser') {
				deleteEmailChangeCookie(cookies);
				return resendRedirectResponse(getAccountEmailErrorLocation('taken', challenge.email));
			}

			return resendErrorResponse();
		}
	});
};
