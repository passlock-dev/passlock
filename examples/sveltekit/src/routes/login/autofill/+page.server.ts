import type { Actions, PageServerLoad } from './$types';

import { getUserByEmail, countPasskeysByUserId } from '$lib/server/repository.js';
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

/**
 * Load the autofill login page.
 *
 * This route demonstrates the browser-first variant of passkey login where the
 * passkey prompt can appear from an autofill-capable username field.
 */
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
			return fail(400, { form });
		}

		const account = await getUserByEmail(form.data.username);
		if (account) {
			const passkeysCount = await countPasskeysByUserId(account.userId);
			if (passkeysCount > 0) {
				// Passkey-capable accounts stay on the passkey path; others fall
				// back to the standard emailed-code route.
				redirect(303, toLoginPasskeyLocation({ username: form.data.username }));
			}

			redirect(303, toLoginEmailLocation({ username: form.data.username }));
		}

		redirect(303, toSignupLocation({ email: form.data.username, reason: 'no-account' }));
	}
} satisfies Actions;
