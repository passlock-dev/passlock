import { getPasslockClientConfig } from '$lib/server/passkeys.js';
import { getPasskeysByUserId } from '$lib/server/repository.js';
import { isRecentAuthentication } from '$lib/server/session.js';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals, url }) => {
	if (!locals.user || !locals.session) {
		redirect(302, '/login');
	}

	const requestedReturnTo = url.searchParams.get('returnTo');
	const returnTo =
		requestedReturnTo && requestedReturnTo.startsWith('/account') ? requestedReturnTo : '/account';

	if (isRecentAuthentication(locals.session.lastAuthenticatedAt)) {
		redirect(303, returnTo);
	}

	const passlockConfig = getPasslockClientConfig();
	const passkeys = await getPasskeysByUserId(locals.user.userId);
	if (passkeys.length === 0) {
		redirect(303, returnTo);
	}

	return {
		...passlockConfig,
		existingPasskeys: passkeys.map(({ passkeyId }) => passkeyId),
		returnTo
	};
}) satisfies PageServerLoad;
