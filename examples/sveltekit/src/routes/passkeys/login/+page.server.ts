import { getPasslockClientConfig } from '$lib/server/passlock.js';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPasskeysByUsername } from '$lib/server/repository';

export const load = (async ({ locals, url }) => {
	if (locals.user) {
		throw redirect(302, '/');
	}

	const passlockConfig = getPasslockClientConfig();
	const username = url.searchParams.get('username');
	const passkeys = username ? await getPasskeysByUsername(username) : [];
	const allowCredentials = passkeys.map(({ passkeyId }) => passkeyId);

	return {
		...passlockConfig,
		username,
		allowCredentials
	};
}) satisfies PageServerLoad;
