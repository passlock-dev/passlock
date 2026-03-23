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
 * Remove a single passkey associated with the current user.
 *
 * @param event
 * @returns
 */
export const DELETE: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return errorResponse('Authentication required.', 401);
	}

	const passkeyId = v.safeParse(PasskeyIdParam, event.params.id);
	if (passkeyId.issues) {
		return errorResponse('Invalid request. Expected passkey id.', 400);
	}

  // ensure we're not deleting another user's passkey
	const associatedUser = await getUserByPasskeyId(passkeyId.output);
	if (!associatedUser || associatedUser.userId !== event.locals.user.userId) {
		return errorResponse('Passkey not found for this account.', 404);
	}

  // delete it from the Passlock vault
	const vaultResult = await deletePasskey({
		...getPasslockConfig(),
		passkeyId: passkeyId.output
	});

  // we don't want to fail fast because it's possible the passkey was already deleted
  // in which case it's not an error (see the warning below)
	if (vaultResult._tag === '@error/Forbidden') {
		return errorResponse('Unable to delete passkey', 500);
	}

	// remove the association in the local db
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
