import type { Actions, PageServerLoad } from './$types';

import {
	createOrRefreshLoginChallenge,
	getAccountByEmail
} from '$lib/server/repository.js';
import { sendOtcEmail } from '$lib/server/email.js';
import { setOtcCookie } from '$lib/server/oneTimeCode.js';

import { superValidate, setError } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { resolve } from '$app/paths';

const schema = v.object({
	username: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty('Email is required'),
		v.email('Enter a valid email address')
	)
});

const getAccountOrRedirect = async (username: string | null) => {
	if (!username) redirect(302, resolve('/login'));

	const account = await getAccountByEmail(username);
	if (!account) {
		const email = encodeURIComponent(username);
		redirect(303, `${resolve('/signup')}?email=${email}&reason=no-account`);
	}

	return account;
};

export const load = (async ({ locals, url }) => {
	if (locals.user) redirect(302, '/');

	const account = await getAccountOrRedirect(url.searchParams.get('username'));
	const form = await superValidate({ username: account.email }, valibot(schema));

	return { form, username: account.email };
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, valibot(schema));
		if (!form.valid) return fail(400, { form });

		const result = await createOrRefreshLoginChallenge(form.data.username);
		if (result._tag === 'AccountNotFound') {
			const email = encodeURIComponent(form.data.username);
			redirect(303, `${resolve('/signup')}?email=${email}&reason=no-account`);
		}
		if (result._tag === 'ChallengeRateLimited') {
			const seconds = Math.ceil(result.retryAfterMs / 1000);
			return setError(
				form,
				'username',
				`A code was just sent. Please wait ${seconds} seconds and try again.`
			);
		}

		await sendOtcEmail({
			email: result.challenge.email,
			firstName: result.challenge.givenName ?? 'there',
			code: result.code
		});
		setOtcCookie(cookies, result.token);

		redirect(303, resolve('/login/email/verify-code'));
	}
} satisfies Actions;
