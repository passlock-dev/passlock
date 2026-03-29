import { getSignupLoginCookie } from '$lib/server/challenge.js';
import { getPendingSignupChallenge } from '$lib/server/repository.js';
import type { Cookies } from '@sveltejs/kit';

export type PendingSignupChallengeContext =
	| { _tag: 'MissingPendingSignupChallenge' }
	| { _tag: 'InvalidPendingSignupChallenge' }
	| {
			_tag: 'PendingSignupChallenge';
			pending: NonNullable<ReturnType<typeof getSignupLoginCookie>>;
			challenge: NonNullable<Awaited<ReturnType<typeof getPendingSignupChallenge>>>;
	  };

export const getPendingSignupChallengeContext = async (
	cookies: Cookies
): Promise<PendingSignupChallengeContext> => {
	const pending = getSignupLoginCookie(cookies);
	if (!pending) {
		return { _tag: 'MissingPendingSignupChallenge' };
	}

	const challenge = await getPendingSignupChallenge(pending.challengeId);
	if (!challenge) {
		return { _tag: 'InvalidPendingSignupChallenge' };
	}

	return {
		_tag: 'PendingSignupChallenge',
		pending,
		challenge
	};
};
