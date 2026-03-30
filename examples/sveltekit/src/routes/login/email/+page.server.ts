import type { PageServerLoad } from './$types';

import {
	createOrRefreshLoginChallenge,
	getPendingLoginChallenge,
	getUserByEmail
} from '$lib/server/repository.js';
import { sendCodeChallengeEmail } from '$lib/server/email.js';
import { getSignupLoginCookie, setSignupLoginCookie } from '$lib/server/challenge.js';
import { createChallengeRateLimitView } from '$lib/server/passlock.js';
import {
	getLoginEmailQueryState,
	toLoginLocation,
	toSignupLocation
} from '$lib/shared/queryState.js';
import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';

const redirectToLoginRateLimited = (email: string, retryAfterSeconds: number): never => {
	const rateLimit = createChallengeRateLimitView(retryAfterSeconds);
	redirect(
		303,
		toLoginLocation({
			username: email,
			reason: 'challenge-rate-limited',
			retryAtMs: rateLimit.retryAtMs
		})
	);
};

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

	await sendCodeChallengeEmail({
		email: result.challenge.email,
		firstName: result.challenge.givenName ?? 'there',
		code: result.code
	});
	setSignupLoginCookie(cookies, {
		challengeId: result.challenge.id,
		secret: result.secret
	});

	redirect(303, resolve('/login/email/verify-code'));
};

export const load = (async ({ locals, url, cookies }) => {
	if (locals.user) redirect(302, '/');

	await sendLoginCode(getLoginEmailQueryState(url).username ?? null, cookies);
}) satisfies PageServerLoad;
