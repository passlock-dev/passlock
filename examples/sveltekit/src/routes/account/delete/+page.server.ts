import { deleteAccount } from '#lib/server/deleteAccount.js';
import type { Actions, PageServerLoad } from './$types';
import { requireAccountContext } from '#lib/server/account.js';
import { getPasslockClientConfig } from '#lib/server/passkeys.js';
import { deleteSessionTokenCookie } from '#lib/server/cookies.js';
import { recordAccountDeletionAuthorization } from '#lib/server/repository.js';
import type { UserCredentialsDeleted } from '@passlock/server';
import type { InferOutput } from 'valibot';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate, setError } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { deleteAccountSchema } from './schema.js';

type DeleteAccountInput = InferOutput<typeof deleteAccountSchema>;
const deletionForm = (input: DeleteAccountInput | Request) =>
	superValidate<DeleteAccountInput, UserCredentialsDeleted>(input, valibot(deleteAccountSchema));

/**
 * Load the account deletion form and config for browser-side re-authentication.
 */
export const load = (async ({ locals }) => {
	const { user, passkeyIds } = await requireAccountContext(locals);

	const form = await deletionForm({ intent: 'delete-account' });

	return {
		form,
		passkeyCount: passkeyIds.length,
		user,
		...getPasslockClientConfig()
	};
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ request, locals, cookies, setHeaders }) => {
		const { user, session, accountDeletionReauthenticationRequired } =
			await requireAccountContext(locals);

		const form = await deletionForm(request);
		if (!form.valid) {
			return fail(400, { form });
		}

		if (accountDeletionReauthenticationRequired) {
			return setError(form, '', 'Confirm your identity before deleting your account.');
		}

		try {
			// Save authorization before Passlock can remove the factors needed to confirm again.
			if (
				session.accountDeletionAuthorizedAt === null &&
				!(await recordAccountDeletionAuthorization(session.id, user.userId))
			) {
				return setError(form, '', 'Your session expired. Sign in again to delete your account.');
			}
			const deletion = await deleteAccount(user.userId);
			if (!deletion)
				return setError(form, 'intent', 'Unable to delete this account. Please retry.');
			form.message = deletion;
		} catch {
			return setError(form, 'intent', 'Unable to complete account deletion. Please retry.');
		}

		deleteSessionTokenCookie(cookies);
		// A native form submission has no browser handler to consume device signals.
		if (request.headers.get('x-sveltekit-action') !== 'true') redirect(303, '/');
		setHeaders({ 'Cache-Control': 'no-store' });
		return { form };
	}
} satisfies Actions;
