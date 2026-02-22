import { getPasslockClientConfig } from '$lib/server/passlock.js';
import { getPasskeysByUserId } from '$lib/server/repository.js';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals, depends }) => {
	depends('passkeys');

	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const passlockConfig = getPasslockClientConfig();
	const existingPasskeys = await getPasskeysByUserId(locals.user.userId);

	return {
		existingPasskeys,
		user: locals.user,
		...passlockConfig
	};
}) satisfies PageServerLoad;
