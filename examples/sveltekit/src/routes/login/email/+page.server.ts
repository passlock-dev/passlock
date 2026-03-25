import type { PageServerLoad } from './$types';

import {
	createOrRefreshLoginChallenge,
	getAccountByEmail,
	getPendingOtcChallenge
} from '$lib/server/repository.js';
import { sendOtcEmail } from '$lib/server/email.js';
import { getOtcCookie, setOtcCookie } from '$lib/server/oneTimeCode.js';
import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';

const sendLoginCode = async (username: string | null, cookies: import('@sveltejs/kit').Cookies) => {
	if (!username) redirect(302, resolve('/login'));

	const account = await getAccountByEmail(username);
	if (!account) {
		const email = encodeURIComponent(username);
		redirect(303, `${resolve('/signup')}?email=${email}&reason=no-account`);
	}

	const pendingToken = getOtcCookie(cookies);
	if (pendingToken) {
		const challenge = await getPendingOtcChallenge(pendingToken);
		if (challenge?.purpose === 'login' && challenge.email === account.email) {
			redirect(303, resolve('/login/email/verify-code'));
		}
	}

	const result = await createOrRefreshLoginChallenge(account.email);
	if (result._tag === '@error/AccountNotFound') {
		const email = encodeURIComponent(account.email);
		redirect(303, `${resolve('/signup')}?email=${email}&reason=no-account`);
	}
	if (result._tag === '@error/ChallengeRateLimited') {
		const email = encodeURIComponent(account.email);
		redirect(303, `${resolve('/login')}?username=${email}`);
	}

	await sendOtcEmail({
		email: result.challenge.email,
		firstName: result.challenge.givenName ?? 'there',
		code: result.code
	});
	setOtcCookie(cookies, result.token);

	redirect(303, resolve('/login/email/verify-code'));
};

export const load = (async ({ locals, url, cookies }) => {
	if (locals.user) redirect(302, '/');

	await sendLoginCode(url.searchParams.get('username'), cookies);
}) satisfies PageServerLoad;
