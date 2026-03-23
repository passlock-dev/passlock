import type { PageServerLoad } from './$types';
import { createSession, createUser, getPasskeysByUserId } from '$lib/server/repository.js';
import { hashPassword } from '$lib/server/password.js';
import { setSessionTokenCookie } from '$lib/server/session.js';

import { superValidate, setError } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { resolve } from '$app/paths';

const schema = v.object({
	email: v.string(),
	givenName: v.pipe(v.string(), v.trim(), v.nonEmpty('First name is required')),
	familyName: v.pipe(v.string(), v.trim(), v.nonEmpty('Last name is required')),
	password: v.string()
});

export const load = (async ({ locals }) => {
	if (locals.user) {
		redirect(302, '/');
	}

	const form = await superValidate(valibot(schema));
	return { form };
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, valibot(schema));

		if (!form.valid) {
			// Return { form } and things will just work.
			return fail(400, { form });
		}

		const email = form.data.email;
		const givenName = form.data.givenName;
		const familyName = form.data.familyName;

		const passwordHash = await hashPassword(form.data.password);
		const user = await createUser({ email, givenName, familyName, passwordHash });

		if (user._tag === 'DuplicateUser') {
			return setError(form, 'email', 'Account already exists');
		}

		const { token } = await createSession(user.userId);
		setSessionTokenCookie(cookies, token);

		const passkeys = await getPasskeysByUserId(user.userId);
		const redirectTo = passkeys.length === 0 ? resolve('/passkeys') : resolve('/');
		redirect(303, redirectTo);
	}
};
