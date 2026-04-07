import { getPasslockClientConfig } from '$lib/server/passkeys.js';
import { getLoginPasskeyQueryState } from '$lib/shared/queryState.js';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPasskeysByUsername } from '$lib/server/repository';

/**
 * Load the passkey login page and optionally pre-select credentials for a
 * known email address.
 */
export const load = (async ({ locals, url }) => {
	if (locals.user) {
		redirect(302, '/');
	}

	const passlockConfig = getPasslockClientConfig();
	const { username } = getLoginPasskeyQueryState(url);

	// When the user has already identified their account, we can narrow the
	// prompt to passkeys linked to that account.
	const passkeys = username ? await getPasskeysByUsername(username) : [];
	const allowCredentials = passkeys.map(({ passkeyId }) => passkeyId);

	return {
		...passlockConfig,
		username,
		allowCredentials
	};
}) satisfies PageServerLoad;
