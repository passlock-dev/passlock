import { deleteAccount } from '#lib/server/deleteAccount.js';
import type { Actions, PageServerLoad } from './$types';
import { requireAccountContext } from '#lib/server/account.js';
import { getPasslockClientConfig } from '#lib/server/passkeys.js';
import { deleteSessionTokenCookie } from '#lib/server/cookies.js';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate, setError } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { deleteAccountSchema } from './schema.js';

/**
 * Load the account deletion form and config for browser-side re-authentication.
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
		const { user, accountReauthenticationRequired: reauthenticationRequired } =
			await requireAccountContext(locals);

		const form = await superValidate(request, valibot(deleteAccountSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		if (reauthenticationRequired) {
			return setError(form, '', 'Confirm your identity before deleting your account.');
		}

		try {
			const deleted = await deleteAccount(user.userId);
			if (!deleted) return setError(form, 'intent', 'Unable to delete this account. Please retry.');
		} catch {
			return setError(form, 'intent', 'Unable to complete account deletion. Please retry.');
		}

		deleteSessionTokenCookie(cookies);
		redirect(303, '/');
	}
} satisfies Actions;
