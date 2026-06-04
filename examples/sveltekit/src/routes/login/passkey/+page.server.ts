import { getPasslockClientConfig } from '$lib/server/passkeys.js';
import { getLoginPasskeyQueryState } from '$lib/shared/queryState.js';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/**
 * Load the passkey login page. A known email address lets the browser request
 * a prepared authentication token before starting the WebAuthn ceremony.
 */
export const load = (async ({ locals, url }) => {
	if (locals.user) {
		redirect(302, '/');
	}

	const passlockConfig = getPasslockClientConfig();
	const { username } = getLoginPasskeyQueryState(url);

	return {
		...passlockConfig,
		username
	};
}) satisfies PageServerLoad;
