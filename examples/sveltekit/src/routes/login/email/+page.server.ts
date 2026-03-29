import type { PageServerLoad } from './$types';

import {
	createOrRefreshLoginChallenge,
	getPendingLoginChallenge,
	getUserByEmail
} from '$lib/server/repository.js';
import { sendCodeChallengeEmail } from '$lib/server/email.js';
import { getSignupLoginCookie, setSignupLoginCookie } from '$lib/server/challenge.js';
import { createChallengeRateLimitView } from '$lib/server/passlock.js';
import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';

const redirectToLoginRateLimited = (email: string, retryAfterSeconds: number): never => {
	const rateLimit = createChallengeRateLimitView(retryAfterSeconds);
	const params = new URLSearchParams({
		username: email,
		reason: 'challenge-rate-limited',
		retryAtMs: String(rateLimit.retryAtMs)
	});

	redirect(303, `${resolve('/login')}?${params.toString()}`);
};

const sendLoginCode = async (username: string | null, cookies: import('@sveltejs/kit').Cookies) => {
	if (!username) redirect(302, resolve('/login'));

	const account = await getUserByEmail(username);
	if (!account) {
		const email = encodeURIComponent(username);
		redirect(303, `${resolve('/signup')}?email=${email}&reason=no-account`);
	}

	const pendingToken = getSignupLoginCookie(cookies);
	if (pendingToken) {
		const challenge = await getPendingLoginChallenge(pendingToken.challengeId);
		if (challenge?.email === account.email) {
			redirect(303, resolve('/login/email/verify-code'));
		}
	}

	const result = await createOrRefreshLoginChallenge(account.email);
	if (result._tag === '@error/AccountNotFound') {
		const email = encodeURIComponent(account.email);
		redirect(303, `${resolve('/signup')}?email=${email}&reason=no-account`);
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
		token: result.token
	});

	redirect(303, resolve('/login/email/verify-code'));
};

export const load = (async ({ locals, url, cookies }) => {
	if (locals.user) redirect(302, '/');

	await sendLoginCode(url.searchParams.get('username'), cookies);
}) satisfies PageServerLoad;
