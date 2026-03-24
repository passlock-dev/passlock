/**
 * Utilty functions to calling the Passlock API
 * from actions.
 */

import { PASSLOCK_API_KEY } from '$env/static/private';
import { PUBLIC_PASSLOCK_ENDPOINT, PUBLIC_PASSLOCK_TENANCY_ID } from '$env/static/public';
import { updatePasskeysByUserId } from '$lib/server/repository';
import { updatePasskeyUsernames } from '@passlock/server/safe';
import { error as kitError } from '@sveltejs/kit';

/**
 * @returns apiKey, tenancyId and endoint
 * @throws 500 error if env variables are not set
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
 * @returns tenancyId, endpoint
 */
export const getPasslockClientConfig = () => {
	const { apiKey, ...rest } = getPasslockConfig();
	return rest;
};

export const syncUserPasskeyUsernames = async (input: {
	userId: number;
	username: string;
	displayName?: string | undefined;
}) => {
	const vaultResult = await updatePasskeyUsernames({
		userId: String(input.userId),
		...getPasslockConfig(),
		username: input.username,
		displayName: input.displayName
	});

	if (vaultResult.failure) {
		return vaultResult;
	}

	await updatePasskeysByUserId(input.userId, { username: input.username });
	return vaultResult;
};
