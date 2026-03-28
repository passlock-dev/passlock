import { updatePasskeysByUserId } from '$lib/server/repository';
import { getPasslockConfig } from './passlock.js';
import * as PasslockServer from '@passlock/server/safe';

/**
 * Update the passkey usernames and display names
 * for a given user in the Passlock vault and local database
 *
 * @param input
 * @returns
 */
export const updatePasskeyUsernames = async (input: {
	userId: number;
	username: string;
	displayName?: string | undefined;
}) => {
	const vaultResult = await PasslockServer.updatePasskeyUsernames({
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

export { getPasslockConfig, getPasslockClientConfig } from './passlock.js';
