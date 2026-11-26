import { Passlock } from '@passlock/server';
import { getPasslockConfig } from './passlock';
import { deleteUser } from './repository';

/**
 * Delete all remote credentials together, then all local account data together.
 * These stores cannot share an ACID transaction. If local cleanup fails after
 * remote success, the idempotent remote operation lets a retry finish cleanup.
 */
export const deleteAccount = async (userId: number) => {
	const sdk = new Passlock(getPasslockConfig());
	const result = await sdk.deleteUser({ userId: String(userId) });
	if (result.failure) return result;
	return (await deleteUser(userId)) ? result : null;
};
