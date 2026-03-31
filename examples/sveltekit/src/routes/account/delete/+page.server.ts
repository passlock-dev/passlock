import type { Actions, PageServerLoad } from './$types';
import { requireAccountContext } from '$lib/server/account.js';
import { deleteUser } from '$lib/server/repository.js';
import { getPasslockClientConfig } from '$lib/server/passkeys.js';
import { deleteSessionTokenCookie } from '$lib/server/session.js';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate, setError } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { deleteAccountSchema } from './schema.js';

/**
 * Load the account deletion form and the Passlock config needed for any
 * browser-side passkey cleanup.
 */
export const load = (async ({ locals }) => {
	const { user, passkeyIds } = await requireAccountContext(locals);

	const form = await superValidate({ intent: 'delete-account' }, valibot(deleteAccountSchema));

	return {
		form,
		passkeyCount: passkeyIds.length,
		user,
		...getPasslockClientConfig()
	};
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ request, locals, cookies }) => {
		const { user, hasPasskeys, reauthenticationRequired } = await requireAccountContext(locals);

		const form = await superValidate(request, valibot(deleteAccountSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		if (reauthenticationRequired && hasPasskeys) {
			return setError(form, '', 'Confirm your passkey before deleting your account.');
		}

		// Passlock and local passkey cleanup happen before or alongside this form
		// submission; the action itself just removes the local account.
		const deleted = await deleteUser(user.userId);
		if (!deleted) return setError(form, 'intent', 'Unable to delete this account');

		deleteSessionTokenCookie(cookies);
		redirect(303, '/');
	}
} satisfies Actions;
