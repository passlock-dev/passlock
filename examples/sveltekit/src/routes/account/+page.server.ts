import type { Actions, PageServerLoad } from './$types';
import { updateUserProfile } from '$lib/server/repository.js';

import { superValidate, setError, message } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { getPasslockClientConfig } from '$lib/server/passlock';

const schema = v.object({
	username: v.pipe(v.string(), v.nonEmpty('Username is required')),
	givenName: v.pipe(v.string(), v.nonEmpty('First name is required'))
});

export const load = (async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const passlockConfig = getPasslockClientConfig();

	const form = await superValidate(
		{
			username: locals.user.email,
			givenName: locals.user.givenName
		},
		valibot(schema)
	);

	return {
		form,
		...passlockConfig
	};
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(302, '/login');
		}

		const form = await superValidate(request, valibot(schema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const user = await updateUserProfile(locals.user.userId, {
			email: form.data.username,
			givenName: form.data.givenName
		});

		if (!user) {
			return setError(form, 'username', 'Unable to update this account');
		}

		if ('_tag' in user && user._tag === 'DuplicateUser') {
			return setError(form, 'username', 'Username is already in use');
		}

		return message(form, 'Account details updated');
	}
} satisfies Actions;
