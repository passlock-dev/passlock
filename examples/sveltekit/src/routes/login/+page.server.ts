import type { Actions, PageServerLoad } from './$types';

import {
	createOrRefreshLoginChallenge,
	getAccountByEmail,
	getPasskeysByUserId
} from '$lib/server/repository.js';
import { sendOtcEmail } from '$lib/server/email.js';
import { setOtcCookie } from '$lib/server/oneTimeCode.js';
import { superValidate, setError } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';

const schema = v.object({
	username: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty('Email is required'),
		v.email('Enter a valid email address')
	)
});

export const load = (async ({ locals, url }) => {
	if (locals.user) {
		redirect(302, '/');
	}

	const username = url.searchParams.get('username') ?? undefined;
	const reason = url.searchParams.get('reason');

	const form = await superValidate({ username }, valibot(schema), { errors: false });
	const notice =
		reason === 'account-exists'
			? 'An account already exists for that email. Login to continue.'
			: null;

	return { form, notice };
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, valibot(schema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const account = await getAccountByEmail(form.data.username);
		if (account) {
			const passkeys = await getPasskeysByUserId(account.userId);
			if (passkeys.length > 0) {
				const username = encodeURIComponent(form.data.username);
				redirect(303, `/login/passkey?username=${username}`);
			}

			const result = await createOrRefreshLoginChallenge(account.email);
			if (result._tag === 'AccountNotFound') {
				const email = encodeURIComponent(form.data.username);
				redirect(303, `/signup?email=${email}&reason=no-account`);
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

			redirect(303, '/login/email/verify-code');
		}

		const email = encodeURIComponent(form.data.username);
		redirect(303, `/signup?email=${email}&reason=no-account`);
	}
} satisfies Actions;
