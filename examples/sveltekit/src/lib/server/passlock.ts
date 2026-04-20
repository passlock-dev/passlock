import { PASSLOCK_API_KEY } from '$env/static/private';
import { PUBLIC_PASSLOCK_ENDPOINT, PUBLIC_PASSLOCK_TENANCY_ID } from '$env/static/public';
import { error as kitError } from '@sveltejs/kit';

/**
 * Read the server-side Passlock configuration.
 *
 * Server handlers use this when they need the private API key to exchange
 * codes, create mailbox challenges, or mutate passkeys in the Passlock vault.
 * It intentionally throws a 500 if the sample has not been configured yet,
 * because none of the auth flows can work without these values.
 */
export const getPasslockConfig = () => {
	const apiKey = PASSLOCK_API_KEY;
	const tenancyId = PUBLIC_PASSLOCK_TENANCY_ID;
	const endpoint = PUBLIC_PASSLOCK_ENDPOINT;

	if (!apiKey || !tenancyId) {
		console.error('Passlock not configured');
		kitError(500, 'Passlock not configured');
	}

	return {
		tenancyId,
		apiKey,
		endpoint: endpoint || undefined
	} as const;
};

/**
 * Read the subset of Passlock config that is safe to expose to the browser.
 *
 * Client code needs the tenancy and optional endpoint so it can talk to
 * Passlock via `@passlock/browser`, but it must never receive the API key.
 */
export const getPasslockClientConfig = () => {
	const { apiKey, ...rest } = getPasslockConfig();
	return rest;
};
