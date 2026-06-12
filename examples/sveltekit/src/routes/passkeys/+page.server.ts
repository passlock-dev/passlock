import { getPasslockClientConfig } from '$lib/server/passkeys.js';
import { findPasskeysByUserId } from '$lib/server/repository.js';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/**
 * Load the passkey-management page for the signed-in user.
 */
export const load = (async ({ locals, depends }) => {
	depends('passkeys');

	if (!locals.user) {
		redirect(302, '/login');
	}

	const passlockConfig = getPasslockClientConfig();
	const existingPasskeys = await findPasskeysByUserId(locals.user.userId);

	return {
		existingPasskeys,
		user: locals.user,
		...passlockConfig
	};
}) satisfies PageServerLoad;
