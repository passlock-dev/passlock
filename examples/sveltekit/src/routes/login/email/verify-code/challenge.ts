import { getSignupLoginCookie } from '$lib/server/challenge.js';
import { getPendingLoginChallenge } from '$lib/server/repository.js';
import type { Cookies } from '@sveltejs/kit';

export type PendingLoginChallengeContext =
	| { _tag: 'MissingPendingLoginChallenge' }
	| { _tag: 'InvalidPendingLoginChallenge' }
	| {
			_tag: 'PendingLoginChallenge';
			pending: NonNullable<ReturnType<typeof getSignupLoginCookie>>;
			challenge: NonNullable<Awaited<ReturnType<typeof getPendingLoginChallenge>>>;
	  };

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
