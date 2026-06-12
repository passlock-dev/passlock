import { PASSLOCK_API_KEY, PASSLOCK_RP_ID } from '$env/static/private';
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
	const rpId = PASSLOCK_RP_ID || 'localhost';

	if (!apiKey || !tenancyId) {
		console.error('Passlock not configured');
		kitError(500, 'Passlock not configured');
	}

	return {
		tenancyId,
		apiKey,
		rpId,
		endpoint: endpoint || undefined
	} as const;
};

/**
 * Read the subset of Passlock config that is safe to expose to the browser.
 *
 * Client code needs the tenancy and optional endpoint so it can talk to
 * Passlock via `@passlock/browser`. It MUST NOT receive the API key.
 * It SHOULD NOT receive the RP ID, as this is selected by server-side authorization calls.
 */
export const getPasslockClientConfig = () => {
	const { apiKey: _apiKey, rpId: _rpId, ...rest } = getPasslockConfig();
	return rest;
};
