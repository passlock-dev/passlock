/**
 * Utilty functions to calling the Passlock API
 * from actions.
 */

import { PASSLOCK_API_KEY } from '$env/static/private';
import { PUBLIC_PASSLOCK_ENDPOINT, PUBLIC_PASSLOCK_TENANCY_ID } from '$env/static/public';
import {
	deletePasskey,
	updatePasskeyUsernames,
	exchangeCode,
	assignUser
} from '@passlock/server/safe';
import { error } from 'console';

/**
 * @returns apiKey, tenancyId and endoint
 * @throws 500 error if env variables are not set
 */
const getPasslockConfig = () => {
	const apiKey = PASSLOCK_API_KEY;
	const tenancyId = PUBLIC_PASSLOCK_TENANCY_ID;
	const endpoint = PUBLIC_PASSLOCK_ENDPOINT;

	if (!apiKey || !tenancyId) {
		console.error('Passlock not configured');
		error(500);
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

export const exchangePasslockCode = async (code: string) => {
	const config = getPasslockConfig();

	return await exchangeCode({ ...config, code });
};

/**
 * Sets the passkey's userId in the Passlock vault,
 * @param  
 * @returns 
 */
export const assignPasslockUserId = async ({
	passkeyId,
	userId
}: {
	passkeyId: string;
	userId: number;
}) => {
	const config = getPasslockConfig();

	return await assignUser({
		passkeyId,
		userId: String(userId),
		...config
	});
};

export const updatePasslockUsernames = async ({
	userId,
	username
}: {
	userId: number;
	username: string;
}) => {
	const config = getPasslockConfig();

	return await updatePasskeyUsernames({
		userId: String(userId),
		username,
		...config
	});
};

export const deletePasslockPasskey = async (passkeyId: string) => {
	const config = getPasslockConfig();

	return await deletePasskey({ passkeyId, ...config });
};
