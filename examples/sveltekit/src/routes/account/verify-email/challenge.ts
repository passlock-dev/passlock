import { getEmailChangeCookie } from '$lib/server/challenge.js';
import { getPendingEmailChallenge } from '$lib/server/repository.js';
import type { Cookies } from '@sveltejs/kit';

export const getAccountEmailErrorLocation = (reason: 'expired' | 'taken', email?: string) => {
	const params = new URLSearchParams({ 'email-error': reason });
	if (email) params.set('email', email);
	return `/account?${params.toString()}` as const;
};

export type PendingEmailChangeChallengeContext =
	| { _tag: 'MissingPendingEmailChangeChallenge' }
	| {
			_tag: 'InvalidPendingEmailChangeChallenge';
			email?: string;
	  }
	| {
			_tag: 'PendingEmailChangeChallenge';
			pending: NonNullable<ReturnType<typeof getEmailChangeCookie>>;
			challenge: NonNullable<Awaited<ReturnType<typeof getPendingEmailChallenge>>>;
	  };

export const getPendingEmailChangeChallengeContext = async (
	cookies: Cookies,
	userId: number
): Promise<PendingEmailChangeChallengeContext> => {
	const pending = getEmailChangeCookie(cookies);
	if (!pending) {
		return { _tag: 'MissingPendingEmailChangeChallenge' };
	}

	const challenge = await getPendingEmailChallenge(pending.challengeId);
	if (!challenge) {
		return { _tag: 'InvalidPendingEmailChangeChallenge' };
	}

	if (challenge.userId !== userId) {
		return {
			_tag: 'InvalidPendingEmailChangeChallenge',
			email: challenge.email
		};
	}

	return {
		_tag: 'PendingEmailChangeChallenge',
		pending,
		challenge
	};
};
