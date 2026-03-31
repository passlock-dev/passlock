import { getPasslockConfig, updatePasskeyUsernames } from '$lib/server/passkeys.js';
import { getAccountContext } from '$lib/server/account.js';
import { createPasskey } from '$lib/server/repository.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as v from 'valibot';
import {
	DeleteUserPasskeysSuccess,
	PasskeyStatusSuccess as PasskeyStatusSchema,
	RegisterPasskeySuccess,
	UpdatePasskeysSuccess
} from '$lib/shared/schemas';
import {
	assignUser,
	deleteUserPasskeys as deletePasskeysByUserId,
	exchangeCode,
	isNotFoundError
} from '@passlock/server/safe';

const errorResponse = (message: string, status: number) =>
	json({ _tag: '@error/Error' as const, message }, { status });

type PasskeyStatusResponse = v.InferOutput<typeof PasskeyStatusSchema>;

/**
 * Return the current account's passkey ids plus whether sensitive actions need
 * a fresh passkey confirmation.
 */
export const GET: RequestHandler = async (event) => {
	const context = await getAccountContext(event.locals);
	if (!context) {
		return errorResponse('Authentication required.', 401);
	}

	const response: PasskeyStatusResponse = {
		_tag: 'PasskeyStatusSuccess',
		passkeyIds: context.passkeyIds,
		reauthenticationRequired: context.reauthenticationRequired
	};

	return json(response);
};

const CreatePasskeyPayload = v.object({
	code: v.pipe(v.string(), v.trim(), v.minLength(8))
});

type RegisterPasskeySuccess = v.InferOutput<typeof RegisterPasskeySuccess>;

/**
 * Verify a browser-created passkey registration and link it to the current
 * local account.
 */
export const POST: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return errorResponse('Authentication required.', 401);
	}

	// Validate the browser-produced Passlock code before calling the SDK.
	const rawPayload = await event.request.json();
	const payload = v.safeParse(CreatePasskeyPayload, rawPayload);
	if (payload.issues) {
		return errorResponse('Invalid request. Expected code.', 400);
	}

	// Exchange the code with Passlock so the server can trust the registration.
	const principal = await exchangeCode({ ...getPasslockConfig(), ...payload.output });
	if (principal.failure) {
		return errorResponse('Unable to verify passkey', 500);
	}

	// Assigning the local user id to the Passlock credential makes later bulk
	// updates and deletes much easier.
	const passlockPasskey = await assignUser({
		...getPasslockConfig(),
		passkeyId: principal.authenticatorId,
		userId: String(event.locals.user.userId)
	});

	if (passlockPasskey.failure) {
		const status = isNotFoundError(passlockPasskey) ? 401 : 500;
		return errorResponse(passlockPasskey.message, status);
	}

	// Persist the credential locally so account pages can reason about linked
	// passkeys without querying Passlock on every request.
	const localPasskey = await createPasskey({
		userId: event.locals.user.userId,
		passkeyId: passlockPasskey.id,
		username: passlockPasskey.credential.username,
		platformName: passlockPasskey.platform?.name ?? null,
		platformIcon: passlockPasskey.platform?.icon ?? null
	});

	if (localPasskey._tag === '@error/DuplicatePasskey') {
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
 * Update the account name shown for all passkeys linked to the current user.
 *
 * This handler updates the trusted server-side sources of truth. The browser
 * then uses the returned credential payload to request a local device update.
 */
export const PATCH: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return errorResponse('Authentication required.', 401);
	}

	const rawPayload = await event.request.json();
	const payload = v.safeParse(UpdatePasskeyPayload, rawPayload);
	if (payload.issues) {
		return errorResponse('Invalid request. Expected username.', 400);
	}

	// Keep the Passlock vault and the local SQLite view of passkeys aligned.
	const vaultResult = await updatePasskeyUsernames({
		userId: event.locals.user.userId,
		...payload.output
	});

	if (vaultResult.failure) {
		return errorResponse('Unable to update passkeys', 500);
	}

	// The client uses this payload to update passkey metadata on the user's
	// device or password manager.
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
 * Remove every passkey associated with the current user from trusted
 * server-side state.
 *
 * The browser performs the follow-up device cleanup separately.
 */
export const DELETE: RequestHandler = async (event) => {
	const context = await getAccountContext(event.locals);
	if (!context) {
		return errorResponse('Authentication required.', 401);
	}

	const rawPayload = await event.request.json();
	const payload = v.safeParse(DeleteUserPasskeysPayload, rawPayload);
	if (payload.issues) {
		return errorResponse("Invalid request. Expected scope: 'user'.", 400);
	}

	if (context.reauthenticationRequired) {
		return errorResponse('Confirm your passkey before deleting passkeys.', 403);
	}

	// Account deletion reuses this endpoint to clear server-side passkeys first.
	const vaultResult = await deletePasskeysByUserId({
		...getPasslockConfig(),
		userId: String(context.user.userId)
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
