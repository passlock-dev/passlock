import type { Actions, PageServerLoad } from './$types';
import { deleteUserAccount, getPasskeysByUserId } from '$lib/server/repository.js';
import { deleteSessionTokenCookie } from '$lib/server/session.js';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate, setError } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import * as v from 'valibot';

const schema = v.object({
	intent: v.literal('delete-account')
});

export const load = (async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const form = await superValidate({ intent: 'delete-account' }, valibot(schema));
	const passkeys = await getPasskeysByUserId(locals.user.userId);

	return {
		form,
		passkeyCount: passkeys.length,
		user: locals.user
	};
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ request, locals, cookies }) => {
		if (!locals.user) {
			redirect(302, '/login');
		}

		const form = await superValidate(request, valibot(schema));
		if (!form.valid) {
			return fail(400, { form });
		}

		const deleted = await deleteUserAccount(locals.user.userId);
		if (!deleted) {
			return setError(form, 'intent', 'Unable to delete this account');
		}

		deleteSessionTokenCookie(cookies);
		redirect(303, '/');
	}
} satisfies Actions;
