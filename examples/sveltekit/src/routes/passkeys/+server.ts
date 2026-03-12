import {
	deletePasslockPasskey,
	assignPasslockUserId,
	getPasslockConfig
} from '$lib/server/passlock.js';
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
	isExtendedPrincipal,
	isForbiddenError,
	isNotFoundError,
	isPasskey,
	isUpdatedUserDetails,
	updatePasskeyUserDetails as updateVault
} from '@passlock/server/safe';

const CreatePasskeyPayload = v.object({
	code: v.pipe(v.string(), v.trim(), v.minLength(8))
});

type RegisterPasskeySuccess = v.InferOutput<typeof RegisterPasskeySuccess>;

/**
 * Register a passkey in the Passlock vault and link it to
 * a local user account
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
  if (!isExtendedPrincipal(principal)) {
		return json({ error: 'Unable to verify passkey' }, { status: 500 });
	}

  // not stricly necessary but makes passkey management easier 
  // if the user registers more than one passkey as we can use
  // functions like updatePasskeysByUserId for bulk operations
	const passlockPasskey = await assignUser({
		...getPasslockConfig(),
		passkeyId: principal.authenticatorId,
		userId: String(event.locals.user.userId)
	});

	if (!isPasskey(passlockPasskey)) {
		const status = isNotFoundError(passlockPasskey) ? 401 : 500;
		return json({ error: passlockPasskey.message }, { status });
	}

	const passkey = await createPasskey({
		userId: event.locals.user.userId,
		passkeyId: passlockPasskey.id,
		username: passlockPasskey.credential.username,
		platformName: passlockPasskey.platform?.name ?? null,
		platformIcon: passlockPasskey.platform?.icon ?? null
	});

	if (passkey._tag === 'DuplicatePasskey') {
		return json({ error: 'This passkey has already been linked to an account.' }, { status: 409 });
	}

	const response: RegisterPasskeySuccess = { _tag: 'RegisterPasskeySuccess' } as const;

	return json(response);
};

const UpdatePasskeyPayload = v.object({
	username: v.pipe(v.string(), v.trim()),
	displayName: v.optional(v.pipe(v.string(), v.trim()))
});

type UpdatePasskeysSuccess = v.InferOutput<typeof UpdatePasskeysSuccess>;

export const PATCH: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return json({ error: 'Authentication required.' }, { status: 401 });
	}

	const rawPayload = await event.request.json();
	const payload = v.safeParse(UpdatePasskeyPayload, rawPayload);
	if (payload.issues) {
		return json({ error: 'Invalid request. Expected username.' }, { status: 400 });
	}

	// update vault passkeys
	const vaultResult = await updateVault({
		userId: String(event.locals.user.userId),
		...getPasslockConfig(),
		...payload.output
	});

	if (!isUpdatedUserDetails(vaultResult)) {
		return json({ error: 'Unable to update passkeys' }, { status: 500 });
	}

	// update local database
	await updatePasskeysByUserId(event.locals.user.userId, payload.output);

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

export const DELETE: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return json({ error: 'Authentication required.' }, { status: 401 });
	}

	const rawPayload = await event.request.json();
	const payload = v.safeParse(DeletePasskeyPayload, rawPayload);
	if (payload.issues) {
		return json({ error: 'Invalid request. Expected passkeyId.' }, { status: 400 });
	}

	const associatedUser = await getUserByPasskeyId(payload.output.passkeyId);
	if (!associatedUser || associatedUser.userId !== event.locals.user.userId) {
		return json({ error: 'Passkey not found for this account.' }, { status: 404 });
	}

	const vaultResult = await deletePasskey({ ...getPasslockConfig(), ...payload.output });
	if (isForbiddenError(vaultResult)) {
		return json({ error: 'Unable to delete passkey' }, { status: 500 });
	}

	const dbResult = await deletePasskeyByUserId(event.locals.user.userId, payload.output.passkeyId);
	if (!dbResult) {
		return json({ error: 'Unable to delete passkey from local account.' }, { status: 404 });
	}

	const warning = isNotFoundError(vaultResult)
		? 'Passkey was already deleted from Passlock vault.'
		: null;

	const response: DeletePasskeySuccess = {
		_tag: 'DeletePasskeySuccess',
		warning
	};

	return json(response);
};
