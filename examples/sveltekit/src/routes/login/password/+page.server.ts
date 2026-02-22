import type { Actions, PageServerLoad } from './$types';

import { createSession, getPasskeysByUserId, getUserByEmail } from '$lib/server/repository.js';
import { verifyPasswordHash } from '$lib/server/password.js';
import { setSessionTokenCookie } from '$lib/server/session.js';

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
	),
	password: v.pipe(v.string(), v.nonEmpty('Password is required'))
});

export const load = (async ({ locals, url }) => {
	if (locals.user) {
		throw redirect(302, '/');
	}

	const username = url.searchParams.get('username');
	if (!username) {
		throw redirect(302, '/login');
	}

	const form = await superValidate(valibot(schema));

	return { form, username };
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, valibot(schema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const user = await getUserByEmail(form.data.username);
		if (!user) {
			return setError(form, 'password', 'Invalid email or password');
		}

		const validPassword = await verifyPasswordHash(user.passwordHash, form.data.password);
		if (!validPassword) {
			return setError(form, 'password', 'Invalid email or password');
		}

		const { token } = await createSession(user.userId);
		setSessionTokenCookie(cookies, token);

		const passkeys = await getPasskeysByUserId(user.userId);
		const redirectTo = passkeys.length === 0 ? resolve('/passkeys') : resolve('/');
		throw redirect(303, redirectTo);
	}
} satisfies Actions;
