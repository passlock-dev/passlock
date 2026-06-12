import type { Actions, PageServerLoad } from './$types';

import { getUserByEmail, countPasskeysByUserId } from '$lib/server/repository.js';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { getPasslockConfig } from '$lib/server/passkeys';
import * as PasslockServer from '@passlock/server';
import {
	toLoginEmailLocation,
	toLoginPasskeyLocation,
	toSignupLocation
} from '$lib/shared/queryState.js';

const schema = v.object({
	email: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty('Email is required'),
		v.email('Enter a valid email address')
	)
});

/**
 * Load the autofill login page.
 *
 * This route authorizes an explicit discoverable authentication token with
 * conditional mediation so the passkey prompt can appear from an
 * autofill-capable username field.
 */
export const load = (async ({ locals }) => {
	if (locals.user) {
		redirect(302, '/');
	}

	const { apiKey: _apiKey, ...config } = getPasslockConfig();
	const authorizedAuthentication = await PasslockServer.authorizePasskeyAuthentication(
		{
			rpId: config.rpId,
			discoverable: true,
			mediation: 'conditional'
		},
		{ ...config, apiKey: _apiKey }
	);

	const form = await superValidate(valibot(schema));

	return {
		form,
		...config,
		authorizedAuthentication:
			authorizedAuthentication._tag === 'AuthorizedPasskeyAuthentication'
				? {
						_tag: authorizedAuthentication._tag,
						expiresAt: authorizedAuthentication.expiresAt,
						authenticationToken: authorizedAuthentication.authenticationToken
					}
				: undefined,
		authorizeError:
			authorizedAuthentication._tag === 'AuthorizedPasskeyAuthentication'
				? undefined
				: 'Unable to authorize passkey autofill.'
	};
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, valibot(schema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const account = await getUserByEmail(form.data.email);
		if (account) {
			const passkeysCount = await countPasskeysByUserId(account.userId);
			if (passkeysCount > 0) {
				// Passkey-capable accounts stay on the passkey path; others fall
				// back to the standard emailed-code route.
				redirect(303, toLoginPasskeyLocation({ username: form.data.email }));
			}

			redirect(303, toLoginEmailLocation({ username: form.data.email }));
		}

		redirect(303, toSignupLocation({ email: form.data.email, reason: 'no-account' }));
	}
} satisfies Actions;
