import type { PageServerLoad } from './$types';
import { createOrRefreshSignupChallenge } from '$lib/server/repository.js';
import { sendCodeChallengeEmail } from '$lib/server/email.js';
import { setSignupLoginCookie } from '$lib/server/challenge.js';

import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';

const schema = v.object({
	email: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty('Email is required'),
		v.email('Enter a valid email address')
	),
	givenName: v.pipe(v.string(), v.trim(), v.nonEmpty('First name is required')),
	familyName: v.pipe(v.string(), v.trim(), v.nonEmpty('Last name is required'))
});

export const load = (async ({ locals, url }) => {
	if (locals.user) {
		redirect(302, '/');
	}

	const email = url.searchParams.get('email') ?? undefined;
	const reason = url.searchParams.get('reason');

	const form = await superValidate({ email }, valibot(schema), { errors: false });
	const notice =
		reason === 'no-account' ? 'No account exists for that email. Create one to continue.' : null;

	return { form, notice };
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, valibot(schema));

		if (!form.valid) {
			// Return { form } and things will just work.
			return fail(400, { form });
		}

		const result = await createOrRefreshSignupChallenge(form.data);
		if (result._tag === '@error/DuplicateUser') {
			const username = encodeURIComponent(form.data.email);
			redirect(303, `/login?username=${username}&reason=account-exists`);
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

		redirect(303, '/signup/verify-code');
	}
};
