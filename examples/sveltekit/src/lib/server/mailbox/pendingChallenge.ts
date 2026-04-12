import type { Cookies } from '@sveltejs/kit';
import type { PendingChallengeCookie } from '../cookies.js';

/**
 * Shared pending-cookie context used by the verify-code pages and resend
 * endpoints. Each flow supplies its own cookie reader, challenge loader, and
 * optional ownership check.
 */
export type PendingChallengeContext<TChallenge> =
	| { _tag: 'MissingPendingChallenge' }
	| { _tag: 'InvalidPendingChallenge' }
	| {
			_tag: 'PendingChallenge';
			pending: PendingChallengeCookie;
			challenge: TChallenge;
	  };

export const getPendingChallengeContext = async <TChallenge>(options: {
	cookies: Cookies;
	getPendingCookie: (cookies: Cookies) => PendingChallengeCookie | undefined;
	getChallenge: (challengeId: string) => Promise<TChallenge | null>;
	validateChallenge?: (challenge: TChallenge) => boolean | Promise<boolean>;
}): Promise<PendingChallengeContext<TChallenge>> => {
	const pending = options.getPendingCookie(options.cookies);
	if (!pending) {
		return { _tag: 'MissingPendingChallenge' };
	}

	const challenge = await options.getChallenge(pending.challengeId);
	if (!challenge) {
		return { _tag: 'InvalidPendingChallenge' };
	}

	if (options.validateChallenge && !(await options.validateChallenge(challenge))) {
		return { _tag: 'InvalidPendingChallenge' };
	}

	return {
		_tag: 'PendingChallenge',
		pending,
		challenge
	};
};
