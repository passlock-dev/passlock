import { updatePasskeysByUserId } from '$lib/server/repository';
import { getPasslockConfig } from './passlock.js';
import * as PasslockServer from '@passlock/server';

/**
 * Update the passkey username/display name in both trusted server-side stores:
 * the Passlock vault and this sample's local SQLite database.
 *
 * The browser still needs to exchange the returned token and perform a
 * separate local-device update afterwards.
 */
export const updatePasskeys = async (input: {
	userId: number;
	username: string;
	displayName?: string | undefined;
}) => {
	const vaultResult = await PasslockServer.updatePasskeys(
		{
			userId: String(input.userId),
			username: input.username,
			displayName: input.displayName
		},
		getPasslockConfig()
	);

	if (vaultResult.failure) {
		return vaultResult;
	}

	await updatePasskeysByUserId(input.userId, { username: input.username });
	return vaultResult;
};

export { getPasslockConfig, getPasslockClientConfig } from './passlock.js';
