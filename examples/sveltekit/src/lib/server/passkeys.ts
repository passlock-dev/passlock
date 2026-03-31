import { updatePasskeysByUserId } from '$lib/server/repository';
import { getPasslockConfig } from './passlock.js';
import * as PasslockServer from '@passlock/server/safe';

/**
 * Update the passkey username/display name in both trusted server-side stores:
 * the Passlock vault and this sample's local SQLite database.
 *
 * The browser still needs to perform a separate local-device update
 * afterwards.
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
