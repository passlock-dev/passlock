import type { PageServerLoad } from './$types';

import {
	createOrRefreshLoginChallenge,
	getPendingLoginChallenge
} from '$lib/server/mailbox/loginChallenge.js';
import { getUserByEmail } from '$lib/server/repository.js';
import { sendCodeChallengeEmail } from '$lib/server/email.js';
import { getSignupLoginCookie, setSignupLoginCookie } from '$lib/server/cookies.js';
import {
	getLoginEmailQueryState,
	toLoginLocation,
	toSignupLocation
} from '$lib/shared/queryState.js';
import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';

const redirectToLoginRateLimited = (email: string, retryAfterSeconds: number): never => {
	redirect(
		303,
		toLoginLocation({
			username: email,
			reason: 'challenge-rate-limited',
			retryAfterSeconds
		})
	);
};

/**
 * Start the email-code login path for a known account.
 *
 * This route exists so other routes can redirect straight to "send the email
 * code for this username" without forcing the user to re-enter their email on
 * `/login`.
 */
const sendLoginCode = async (username: string | null, cookies: import('@sveltejs/kit').Cookies) => {
	if (!username) redirect(302, resolve('/login'));

	const account = await getUserByEmail(username);
	if (!account) {
		redirect(303, toSignupLocation({ email: username, reason: 'no-account' }));
	}

	const pendingChallenge = getSignupLoginCookie(cookies);
	if (pendingChallenge) {
		const challenge = await getPendingLoginChallenge(pendingChallenge.challengeId);
		if (challenge?.email === account.email) {
			// Reuse the in-progress challenge instead of generating another email.
			redirect(303, resolve('/login/email/verify-code'));
		}
	}

	const result = await createOrRefreshLoginChallenge(account.email);
	if (result._tag === '@error/AccountNotFound') {
		redirect(303, toSignupLocation({ email: account.email, reason: 'no-account' }));
	}
	if (result._tag === '@error/ChallengeRateLimited') {
		redirectToLoginRateLimited(account.email, result.retryAfterSeconds);
	}
	if (result._tag !== 'CreatedChallenge') {
		throw new Error('Unexpected login challenge result');
	}

	// Store the secret server-side in a cookie; send the code via email.
	await sendCodeChallengeEmail({
		email: result.challenge.email,
		firstName: result.challenge.givenName ?? 'there',
		code: result.code,
		message: result.message
	});
	setSignupLoginCookie(cookies, {
		challengeId: result.challenge.id,
		secret: result.secret
	});

	redirect(303, resolve('/login/email/verify-code'));
};

/**
 * Loader-only route that immediately kicks off email-code login and redirects
 * to the verification page.
 */
export const load = (async ({ locals, url, cookies }) => {
	if (locals.user) redirect(302, '/');

	await sendLoginCode(getLoginEmailQueryState(url).username ?? null, cookies);
}) satisfies PageServerLoad;
