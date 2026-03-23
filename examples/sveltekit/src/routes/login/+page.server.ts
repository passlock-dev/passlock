import type { Actions, PageServerLoad } from './$types';

import { getPasskeysByUserId, getUserByEmail } from '$lib/server/repository.js';
import { superValidate } from 'sveltekit-superforms';
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

export const load = (async ({ locals }) => {
	if (locals.user) {
		throw redirect(302, '/');
	}

	const form = await superValidate(valibot(schema));

	return { form };
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, valibot(schema));

		if (!form.valid) {
			// Return { form } and things will just work.
			return fail(400, { form });
		}

		const user = await getUserByEmail(form.data.username);
		if (user) {
			const passkeys = await getPasskeysByUserId(user.userId);
			if (passkeys.length > 0) {
				const username = encodeURIComponent(form.data.username);
				throw redirect(303, `/login/passkey?username=${username}`);
			}
		}

		const username = encodeURIComponent(form.data.username);
		throw redirect(303, `/login/password?username=${username}`);
	}
} satisfies Actions;
