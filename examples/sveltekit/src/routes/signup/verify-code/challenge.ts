import { getSignupLoginCookie } from '$lib/server/cookies.js';
import { getPendingSignupChallenge } from '$lib/server/mailbox/signupChallenge.js';
import type { Cookies } from '@sveltejs/kit';

/**
 * Route-local challenge context for the signup code verification page.
 */
export type PendingSignupChallengeContext =
	| { _tag: '@error/MissingPendingSignupChallenge' }
	| { _tag: '@error/InvalidPendingSignupChallenge' }
	| {
			_tag: 'PendingSignupChallenge';
			pending: NonNullable<ReturnType<typeof getSignupLoginCookie>>;
			challenge: NonNullable<Awaited<ReturnType<typeof getPendingSignupChallenge>>>;
	  };

/**
 * Recover the signup challenge referenced by the pending challenge cookie.
 */
export const getPendingSignupChallengeContext = async (
	cookies: Cookies
): Promise<PendingSignupChallengeContext> => {
	const pending = getSignupLoginCookie(cookies);
	if (!pending) {
		return { _tag: '@error/MissingPendingSignupChallenge' };
	}

	const challenge = await getPendingSignupChallenge(pending.challengeId);
	if (!challenge) {
		return { _tag: '@error/InvalidPendingSignupChallenge' };
	}

	return {
		_tag: 'PendingSignupChallenge',
		pending,
		challenge
	};
};
