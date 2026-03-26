import { getPasslockClientConfig } from '$lib/server/passkeys.js';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPasskeysByUsername } from '$lib/server/repository';

export const load = (async ({ locals, url }) => {
	if (locals.user) {
		redirect(302, '/');
	}

	const passlockConfig = getPasslockClientConfig();
	const username = url.searchParams.get('username');
	const passkeys = username ? await getPasskeysByUsername(username) : [];
	const existingPasskeys = passkeys.map(({ passkeyId }) => passkeyId);

	return {
		...passlockConfig,
		username,
		existingPasskeys
	};
}) satisfies PageServerLoad;
