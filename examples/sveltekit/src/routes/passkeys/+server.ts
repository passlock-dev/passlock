import {
	getPasslockConfig
} from '$lib/server/passkeys.js';
import {
	createPasskey,
	deletePasskeyByUserId,
	getUserByPasskeyId,
	updatePasskeysByUserId
} from '$lib/server/repository.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as v from 'valibot';
import {
	DeletePasskeySuccess,
	RegisterPasskeySuccess,
	UpdatePasskeysSuccess
} from '$lib/shared/schemas';
import {
	assignUser,
	deletePasskey,
	exchangeCode,
	isNotFoundError,
	updatePasskeyUserDetails
} from '@passlock/server/safe';

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
		return json({ error: 'Authentication required.' }, { status: 401 });
	}

  // use safeParse to avoid untyped thrown errors
	const rawPayload = await event.request.json();
	const payload = v.safeParse(CreatePasskeyPayload, rawPayload);
	if (payload.issues) {
		return json({ error: 'Invalid request. Expected code.' }, { status: 400 });
	}

	// verify the passkey is authentic
	const principal = await exchangeCode({ ...getPasslockConfig(), ...payload.output });
	// could also use the _tag property as a discriminator
  if (principal.failure) {
		return json({ error: 'Unable to verify passkey' }, { status: 500 });
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
		return json({ error: passlockPasskey.message }, { status });
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
		return json({ error: 'This passkey has already been linked to an account.' }, { status: 409 });
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
		return json({ error: 'Authentication required.' }, { status: 401 });
	}

  // use safeParse to avoid untyped thrown errors
	const rawPayload = await event.request.json();
	const payload = v.safeParse(UpdatePasskeyPayload, rawPayload);
	if (payload.issues) {
		return json({ error: 'Invalid request. Expected username.' }, { status: 400 });
	}

	// update the passkeys in the Passlock vault.
  // not strictly necessary but good to keep your local db and vault
  // in sync to aid debugging, logging etc.
	const vaultResult = await updatePasskeyUserDetails({
		userId: String(event.locals.user.userId),
		...getPasslockConfig(),
		...payload.output
	});

	if (vaultResult.failure) {
		return json({ error: 'Unable to update passkeys' }, { status: 500 });
	}

	// update local database
	await updatePasskeysByUserId(event.locals.user.userId, payload.output);

  // updatePasskeyUserDetails returns a data structure that we can pass
  // to a function on the @passlock/client library to update the passkeys
  // on the users local device/passkey manager
	const response: UpdatePasskeysSuccess = {
		_tag: 'UpdatePasskeySuccess',
		credentials: vaultResult.credentials
	};

	return json(response);
};

const DeletePasskeyPayload = v.object({
	passkeyId: v.pipe(v.string(), v.trim(), v.minLength(8))
});

type DeletePasskeySuccess = v.InferOutput<typeof DeletePasskeySuccess>;

/**
 * Remove a passkey
 * 
 * @param event 
 * @returns 
 */
export const DELETE: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return json({ error: 'Authentication required.' }, { status: 401 });
	}

  // use safeParse to avoid untyped thrown errors
  const rawPayload = await event.request.json();
	const payload = v.safeParse(DeletePasskeyPayload, rawPayload);
	if (payload.issues) {
		return json({ error: 'Invalid request. Expected passkeyId.' }, { status: 400 });
	}

  // ensure we're not deleting another user's passkey
	const associatedUser = await getUserByPasskeyId(payload.output.passkeyId);
	if (!associatedUser || associatedUser.userId !== event.locals.user.userId) {
		return json({ error: 'Passkey not found for this account.' }, { status: 404 });
	}

  // delete it from the Passlock vault
	const vaultResult = await deletePasskey({ ...getPasslockConfig(), ...payload.output });
	
  // we don't want to fail fast because it's possible the passkey was already deleted
  // in which case its not an error (see the warning below)
  // note: we could also use isForbiddenError(result) here
  if (vaultResult.failure && vaultResult._tag === "@error/Forbidden") {
		return json({ error: 'Unable to delete passkey' }, { status: 500 });
	}

  // remove the association in the local db
	const dbResult = await deletePasskeyByUserId(event.locals.user.userId, payload.output.passkeyId);
	if (!dbResult) {
		return json({ error: 'Unable to delete passkey from local account.' }, { status: 404 });
	}

  // note: we could alse examine the _tag property
  // make sure you call isNotFoundError on the vaultResult.error, not vaultResult
	const warning = vaultResult.failure && isNotFoundError(vaultResult.error)
		? 'Passkey was already deleted from Passlock vault.'
		: null;

  const response: DeletePasskeySuccess = {
		_tag: 'DeletePasskeySuccess',
		warning
	};

	return json(response);
};
