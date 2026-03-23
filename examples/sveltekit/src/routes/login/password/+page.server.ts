import type { Actions, PageServerLoad } from './$types';

import { createOtcChallenge, getUserByEmail } from '$lib/server/repository.js';
import { sendOtcEmail } from '$lib/server/email.js';
import { verifyPasswordHash } from '$lib/server/password.js';
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
	),
	password: v.pipe(v.string(), v.nonEmpty('Password is required'))
});

export const load = (async ({ locals, url }) => {
	if (locals.user) redirect(302, '/');

	const username = url.searchParams.get('username');
	if (!username) redirect(302, '/login');

	const form = await superValidate(valibot(schema));

	return { form, username };
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, valibot(schema));
		if (!form.valid) return fail(400, { form });

		const user = await getUserByEmail(form.data.username);
		if (!user) return setError(form, 'password', 'Invalid email or password');

		const isValidPassword = await verifyPasswordHash(user.passwordHash, form.data.password);
		if (!isValidPassword) return setError(form, 'password', 'Invalid email or password');

		// secondary authentication
		// send a secure one time code to the users email
    // generate a high entropy token that can be bound to this device
		const { token, code } = await createOtcChallenge(user.userId);
		await sendOtcEmail({ email: user.email, firstName: user.givenName, code });

    // set the token using a HTTP only cookie
		setOtcCookie(cookies, token);

		redirect(303, resolve('/login/password/verify-code'));
	}
} satisfies Actions;
