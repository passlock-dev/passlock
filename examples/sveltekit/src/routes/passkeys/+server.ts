import {
	deletePasslockPasskey,
	exchangePasslockCode,
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
import { updatePasskeyUserDetails as updateVault } from '@passlock/server';

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

	const jsonPayload = await event.request.json();
	const { code } = v.parse(CreatePasskeyPayload, jsonPayload);

	const principal = await exchangePasslockCode(code);
	if (principal._tag !== 'ExtendedPrincipal') {
		const status = principal._tag === '@error/InvalidCode' ? 401 : 500;
		return json({ error: principal.message }, { status });
	}

	const passlockPasskey = await assignPasslockUserId({
		passkeyId: principal.authenticatorId,
		userId: event.locals.user.userId
	});

	if (passlockPasskey._tag !== 'Passkey') {
		const status = passlockPasskey._tag === '@error/NotFound' ? 401 : 500;
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

	const jsonPayload = await event.request.json();
	const { username, displayName } = v.parse(UpdatePasskeyPayload, jsonPayload);
	const userId = String(event.locals.user.userId);

	// update vault passkeys
	const vaultResult = await updateVault({
		...getPasslockConfig(),
		userId,
		username,
		displayName
	});

	// update local database
	await updatePasskeysByUserId(event.locals.user.userId, { username });

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

	const jsonPayload = await event.request.json().catch(() => null);
	const { passkeyId } = v.parse(DeletePasskeyPayload, jsonPayload);

	const linkedPasskey = await getUserByPasskeyId(passkeyId);
	if (!linkedPasskey || linkedPasskey.userId !== event.locals.user.userId) {
		return json({ error: 'Passkey not found for this account.' }, { status: 404 });
	}

	const deletedFromVault = await deletePasslockPasskey(passkeyId);
	if (deletedFromVault._tag === '@error/Forbidden') {
		return json({ error: deletedFromVault.message }, { status: 500 });
	}

	const deletedFromTable = await deletePasskeyByUserId(event.locals.user.userId, passkeyId);
	if (!deletedFromTable) {
		return json({ error: 'Unable to delete passkey from local account.' }, { status: 404 });
	}

	const response: DeletePasskeySuccess = {
		_tag: 'DeletePasskeySuccess',
		passkeyId,
		warning:
			deletedFromVault._tag === '@error/NotFound'
				? 'Passkey was already deleted from Passlock vault.'
				: null
	};

	return json(response);
};
