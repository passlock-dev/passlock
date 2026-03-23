import {
	getPasslockConfig
} from '$lib/server/passkeys.js';
import {
	createPasskey,
	updatePasskeysByUserId
} from '$lib/server/repository.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as v from 'valibot';
import {
	DeleteUserPasskeysSuccess,
	RegisterPasskeySuccess,
	UpdatePasskeysSuccess
} from '$lib/shared/schemas';
import {
	assignUser,
	deleteUserPasskeys as deletePasskeysByUserId,
	exchangeCode,
	isNotFoundError,
	updatePasskeyUsernames
} from '@passlock/server/safe';

const errorResponse = (message: string, status: number) =>
	json({ _tag: '@error/Error' as const, message }, { status });

const CreatePasskeyPayload = v.object({
	code: v.pipe(v.string(), v.trim(), v.minLength(8))
});

type RegisterPasskeySuccess = v.InferOutput<typeof RegisterPasskeySuccess>;

/**
 * 1. Verify the passkey is authentic
 * 2. Link it to a local user account
 *
 * @param event
 * @returns
 */
export const POST: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return errorResponse('Authentication required.', 401);
	}

  // use safeParse to avoid untyped thrown errors
	const rawPayload = await event.request.json();
	const payload = v.safeParse(CreatePasskeyPayload, rawPayload);
	if (payload.issues) {
		return errorResponse('Invalid request. Expected code.', 400);
	}

	// verify the passkey is authentic
	const principal = await exchangeCode({ ...getPasslockConfig(), ...payload.output });
	// could also use the _tag property as a discriminator
  if (principal.failure) {
		return errorResponse('Unable to verify passkey', 500);
	}

  // not stricly necessary but makes passkey management easier 
  // if the user registers more than one passkey
	const passlockPasskey = await assignUser({
		...getPasslockConfig(),
		passkeyId: principal.authenticatorId,
		userId: String(event.locals.user.userId)
	});

	// could also use if (!passlockPasskey.success) { ... }
	if (passlockPasskey.failure) {
		const status = isNotFoundError(passlockPasskey) ? 401 : 500;
		return errorResponse(passlockPasskey.message, status);
	}

  // assign the passkey to a local user account in the db
	const localPasskey = await createPasskey({
		userId: event.locals.user.userId,
		passkeyId: passlockPasskey.id,
		username: passlockPasskey.credential.username,
		platformName: passlockPasskey.platform?.name ?? null,
		platformIcon: passlockPasskey.platform?.icon ?? null
	});

	if (localPasskey._tag === 'DuplicatePasskey') {
		return errorResponse('This passkey has already been linked to an account.', 409);
	}

	const response: RegisterPasskeySuccess = { 
    _tag: 'RegisterPasskeySuccess' 
  };

	return json(response);
};

const UpdatePasskeyPayload = v.object({
	username: v.pipe(v.string(), v.trim()),
	displayName: v.optional(v.pipe(v.string(), v.trim()))
});

type UpdatePasskeysSuccess = v.InferOutput<typeof UpdatePasskeysSuccess>;

/**
 * Update the username/displayname for one or more passkeys associated with
 * a specific user account
 * 
 * @param event 
 * @returns 
 */
export const PATCH: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return errorResponse('Authentication required.', 401);
	}

  // use safeParse to avoid untyped thrown errors
	const rawPayload = await event.request.json();
	const payload = v.safeParse(UpdatePasskeyPayload, rawPayload);
	if (payload.issues) {
		return errorResponse('Invalid request. Expected username.', 400);
	}

	// update the passkeys in the Passlock vault.
  // not strictly necessary but good to keep your local db and vault
  // in sync to aid debugging, logging etc.
	const vaultResult = await updatePasskeyUsernames({
		userId: String(event.locals.user.userId),
		...getPasslockConfig(),
		...payload.output
	});

	if (vaultResult.failure) {
		return errorResponse('Unable to update passkeys', 500);
	}

	// update local database
	await updatePasskeysByUserId(event.locals.user.userId, payload.output);

  // updatePasskeyUsernames returns a data structure that we can pass
  // to a function on the @passlock/client library to update the passkeys
  // on the users local device/passkey manager
	const response: UpdatePasskeysSuccess = {
		_tag: 'UpdatePasskeySuccess',
		credentials: vaultResult.credentials
	};

	return json(response);
};

const DeleteUserPasskeysPayload = v.object({
	scope: v.literal('user')
});

type DeleteUserPasskeysSuccess = v.InferOutput<typeof DeleteUserPasskeysSuccess>;

/**
 * Remove every passkey associated with the current user
 * 
 * @param event 
 * @returns 
 */
export const DELETE: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return errorResponse('Authentication required.', 401);
	}

  // use safeParse to avoid untyped thrown errors
  const rawPayload = await event.request.json();
	const payload = v.safeParse(DeleteUserPasskeysPayload, rawPayload);
	if (payload.issues) {
		return errorResponse("Invalid request. Expected scope: 'user'.", 400);
	}

  // delete all user passkeys (called from the /account/delete route)
	const vaultResult = await deletePasskeysByUserId({
		...getPasslockConfig(),
		userId: String(event.locals.user.userId)
	});

	if (vaultResult.failure) {
		const status = isNotFoundError(vaultResult) ? 404 : 500;
		return errorResponse('Unable to delete passkeys', status);
	}

	const response: DeleteUserPasskeysSuccess = {
		_tag: 'DeleteUserPasskeysSuccess',
		deleted: vaultResult.deleted
	};

	return json(response);
};
