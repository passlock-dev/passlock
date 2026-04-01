import { getEmailChangeCookie } from '$lib/server/cookies.js';
import { getPendingEmailChallenge } from '$lib/server/repository.js';
import { toAccountLocation, type AccountEmailErrorReason } from '$lib/shared/queryState.js';
import type { Cookies } from '@sveltejs/kit';

/**
 * Redirect helper used when the email verification flow needs to return the
 * user to `/account` with a user-facing status message.
 */
export const getAccountEmailErrorLocation = (reason: AccountEmailErrorReason, email?: string) =>
	toAccountLocation({ emailError: reason, email });

/**
 * Route-local challenge context for the signed-in email-change flow.
 *
 * Unlike signup/login, this flow also verifies that the pending challenge
 * still belongs to the currently authenticated user.
 */
export type PendingEmailChangeChallengeContext =
	| { _tag: 'MissingPendingEmailChangeChallenge' }
	| { _tag: 'InvalidPendingEmailChangeChallenge' }
	| {
			_tag: 'PendingEmailChangeChallenge';
			pending: NonNullable<ReturnType<typeof getEmailChangeCookie>>;
			challenge: NonNullable<Awaited<ReturnType<typeof getPendingEmailChallenge>>>;
	  };

/**
 * Recover the pending email-change challenge and ensure it belongs to the
 * signed-in user.
 */
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

	// The cookie alone is not enough; the challenge must still belong to the
	// current local user.
	if (challenge.userId !== userId) {
		return { _tag: 'InvalidPendingEmailChangeChallenge' };
	}

	return {
		_tag: 'PendingEmailChangeChallenge',
		pending,
		challenge
	};
};
