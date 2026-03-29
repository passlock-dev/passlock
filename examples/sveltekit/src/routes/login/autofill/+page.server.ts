import type { Actions, PageServerLoad } from './$types';

import { getUserByEmail, getPasskeysByUserId } from '$lib/server/repository.js';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { getPasslockClientConfig } from '$lib/server/passkeys';
import {
	toLoginEmailLocation,
	toLoginPasskeyLocation,
	toSignupLocation
} from '$lib/shared/queryState.js';

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
		redirect(302, '/');
	}

	const config = getPasslockClientConfig();

	const form = await superValidate(valibot(schema));

	return { form, ...config };
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, valibot(schema));

		if (!form.valid) {
			// Return { form } and things will just work.
			return fail(400, { form });
		}

		const account = await getUserByEmail(form.data.username);
		if (account) {
			const passkeys = await getPasskeysByUserId(account.userId);
			if (passkeys.length > 0) {
				redirect(303, toLoginPasskeyLocation({ username: form.data.username }));
			}

			redirect(303, toLoginEmailLocation({ username: form.data.username }));
		}

		redirect(303, toSignupLocation({ email: form.data.username, reason: 'no-account' }));
	}
} satisfies Actions;
