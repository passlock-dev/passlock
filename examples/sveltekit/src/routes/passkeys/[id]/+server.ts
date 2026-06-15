import { getPasslockConfig } from '$lib/server/passkeys.js';
import { deletePasskeyByUserId, getUserByPasskeyId } from '$lib/server/repository.js';
import { DeletePasskeySuccess } from '$lib/shared/schemas';
import * as PasslockServer from '@passlock/server';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as v from 'valibot';
import { errorResponse } from '../shared';

const PasskeyIdParam = v.pipe(v.string(), v.trim(), v.minLength(8));

type DeletePasskeySuccess = v.InferOutput<typeof DeletePasskeySuccess>;

/**
 * Remove a single passkey associated with the current user from the trusted
 * server-side stores and prepare browser cleanup instructions.
 */
export const DELETE: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return errorResponse('Authentication required.', 401);
	}

	const passkeyId = v.safeParse(PasskeyIdParam, event.params.id);
	if (passkeyId.issues) {
		return errorResponse('Invalid request. Expected passkey id.', 400);
	}

	// Guard against deleting a passkey that belongs to another account.
	const associatedUser = await getUserByPasskeyId(passkeyId.output);
	if (!associatedUser || associatedUser.userId !== event.locals.user.userId) {
		return errorResponse('Passkey not found for this account.', 404);
	}

	// Remove the credential from the Passlock vault first so the account stops
	// trusting it, and snapshot browser cleanup data into a prepared token.
	const vaultResult = await PasslockServer.deletePasskeys(
		{
			passkeyIds: [passkeyId.output]
		},
		getPasslockConfig()
	);

	if (vaultResult.failure) {
		return errorResponse('Unable to delete passkey', 500);
	}

	// Remove the local account-to-passkey association as the app's final source
	// of truth.
	const dbResult = await deletePasskeyByUserId(event.locals.user.userId, passkeyId.output);
	if (!dbResult) {
		return errorResponse('Unable to delete passkey from local account.', 404);
	}

	const response: DeletePasskeySuccess = {
		_tag: 'PreparedPasskeyDeletion',
		deletePasskeysToken: vaultResult.deletePasskeysToken,
		expiresAt: vaultResult.expiresAt,
		warnings: vaultResult.warnings
	};

	return json(response);
};
