import { getSignupLoginCookie } from '$lib/server/cookies.js';
import { getPendingLoginChallenge } from '$lib/server/challenges.js';
import type { Cookies } from '@sveltejs/kit';

/**
 * Route-local challenge context for the login code verification page.
 *
 * The loader/action distinguishes between:
 * - no pending cookie at all
 * - a cookie that points at a missing or expired challenge
 * - a still-valid challenge that the user may verify
 */
export type PendingLoginChallengeContext =
	| { _tag: 'MissingPendingLoginChallenge' }
	| { _tag: 'InvalidPendingLoginChallenge' }
	| {
			_tag: 'PendingLoginChallenge';
			pending: NonNullable<ReturnType<typeof getSignupLoginCookie>>;
			challenge: NonNullable<Awaited<ReturnType<typeof getPendingLoginChallenge>>>;
	  };

/**
 * Recover the current login challenge from the cookie and the Passlock-backed
 * challenge store.
 */
export const getPendingLoginChallengeContext = async (
	cookies: Cookies
): Promise<PendingLoginChallengeContext> => {
	const pending = getSignupLoginCookie(cookies);
	if (!pending) {
		return { _tag: 'MissingPendingLoginChallenge' };
	}

	const challenge = await getPendingLoginChallenge(pending.challengeId);
	if (!challenge) {
		return { _tag: 'InvalidPendingLoginChallenge' };
	}

	return {
		_tag: 'PendingLoginChallenge',
		pending,
		challenge
	};
};
