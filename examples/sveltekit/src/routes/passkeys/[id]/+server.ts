import { getPasslockConfig } from '$lib/server/passkeys.js';
import { deletePasskeyByUserId, getUserByPasskeyId } from '$lib/server/repository.js';
import { DeletePasskeySuccess, DeletePasskeyWarning } from '$lib/shared/schemas';
import { deletePasskey, isNotFoundError } from '@passlock/server/safe';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as v from 'valibot';

const errorResponse = (message: string, status: number) =>
	json({ _tag: '@error/Error' as const, message }, { status });

const PasskeyIdParam = v.pipe(v.string(), v.trim(), v.minLength(8));

type DeletePasskeySuccess = v.InferOutput<typeof DeletePasskeySuccess>;
type DeletePasskeyWarning = v.InferOutput<typeof DeletePasskeyWarning>;

/**
 * Remove a single passkey associated with the current user from the trusted
 * server-side stores.
 *
 * The browser deletes the local device copy separately after this endpoint
 * succeeds.
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
	// trusting it.
	const vaultResult = await deletePasskey({
		...getPasslockConfig(),
		passkeyId: passkeyId.output
	});

	// Do not fail hard when Passlock says the credential is already gone. The
	// local record may still need cleanup.
	if (vaultResult._tag === '@error/Forbidden') {
		return errorResponse('Unable to delete passkey', 500);
	}

	// Remove the local account-to-passkey association as the app's final source
	// of truth.
	const dbResult = await deletePasskeyByUserId(event.locals.user.userId, passkeyId.output);
	if (!dbResult) {
		return errorResponse('Unable to delete passkey from local account.', 404);
	}

	if (isNotFoundError(vaultResult)) {
		const message = 'Passkey was already deleted from Passlock vault.';
		const response: DeletePasskeyWarning = {
			_tag: '@warning/PasskeyNotFound',
			message
		};
		return json(response);
	}

	const response: DeletePasskeySuccess = {
		_tag: 'DeletePasskeySuccess',
		deleted: vaultResult.deleted
	};

	return json(response);
};
