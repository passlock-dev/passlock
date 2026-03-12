import {
	deletePasslockPasskey,
	exchangePasslockCode,
	updatePasslockUsernames,
	assignPasslockUserId
} from '$lib/server/passlock.js';
import {
	createPasskey,
	deletePasskeyByUserId,
	getPasskeysByUserId,
	getUserByPasskeyId,
	updatePasskey
} from '$lib/server/repository.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as v from 'valibot';
import {
	DeletePasskeySuccess,
	RegisterPasskeySuccess,
	UpdatePasskeysSuccess
} from '$lib/shared/schemas';

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
	const payload = v.safeParse(CreatePasskeyPayload, jsonPayload);
	if (payload.issues) {
		return json({ error: 'Invalid request. Expected code.' }, { status: 400 });
	}

	const principal = await exchangePasslockCode(payload.output.code);
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
	username: v.pipe(v.string(), v.trim())
});

type UpdatePasskeysSuccess = v.InferOutput<typeof UpdatePasskeysSuccess>;

export const PATCH: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return json({ error: 'Authentication required.' }, { status: 401 });
	}

	const jsonPayload = await event.request.json().catch(() => null);
	const payload = v.safeParse(UpdatePasskeyPayload, jsonPayload);
	if (payload.issues) {
		return json({ error: 'Invalid request. Expected username.' }, { status: 400 });
	}
	const userId = event.locals.user.userId;
	const username = payload.output.username;
	const displayName =
		[event.locals.user.givenName, event.locals.user.familyName].filter(Boolean).join(' ') ||
		username;

	const userPasskeys = await getPasskeysByUserId(event.locals.user.userId);

	await Promise.all(
		userPasskeys.map(async (passkey) => await updatePasskey(passkey.passkeyId, { username }))
	);

	const updatedPasskeys = await updatePasslockUsernames({ userId, username, displayName });

	if (updatedPasskeys._tag !== 'UpdatedPasskeyUsernames') {
		const status = updatedPasskeys._tag === '@error/NotFound' ? 401 : 401;
		return json({ error: updatedPasskeys.message }, { status });
	}

	const response: UpdatePasskeysSuccess = {
		_tag: 'UpdatePasskeySuccess',
		credentials: updatedPasskeys.credentials
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
	const payload = v.safeParse(DeletePasskeyPayload, jsonPayload);
	if (payload.issues) {
		return json({ error: 'Invalid request. Expected passkeyId.' }, { status: 400 });
	}

	const passkeyId = payload.output.passkeyId;
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
