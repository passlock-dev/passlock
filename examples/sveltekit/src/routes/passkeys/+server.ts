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
import * as PasslockServer from '@passlock/server';
import { errorResponse } from './shared';

type PasskeyStatusResponse = v.InferOutput<typeof PasskeyStatusSchema>;

/**
 * Return the current account's passkey count plus whether sensitive actions need
 * a fresh passkey confirmation.
 */
export const GET: RequestHandler = async (event) => {
	const context = await getAccountContext(event.locals);
	if (!context) {
		return errorResponse('Authentication required.', 401);
	}

	const response: PasskeyStatusResponse = {
		_tag: 'PasskeyStatusSuccess',
		passkeyCount: context.passkeyIds.length,
		reauthenticationRequired: context.reauthenticationRequired
	};

	return json(response);
};

const CreatePasskeyPayload = v.object({
	code: v.pipe(v.string(), v.trim(), v.minLength(8))
});

type RegisterPasskeySuccess = v.InferOutput<typeof RegisterPasskeySuccess>;

/**
 * Verify a passkey registration and link it to the current local
 * account.
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
	const principal = await PasslockServer.exchangeCode(payload.output, getPasslockConfig());
	if (principal.failure) {
		return errorResponse('Unable to verify passkey', 500);
	}

	if (principal.userId !== String(event.locals.user.userId)) {
		return errorResponse('Passkey registration was authorized for a different account.', 403);
	}

	const passlockPasskey = await PasslockServer.getPasskey(
		{ passkeyId: principal.authenticatorId },
		getPasslockConfig()
	);

	if (passlockPasskey.failure) {
		const status = PasslockServer.isNotFoundError(passlockPasskey) ? 404 : 500;
		return errorResponse(passlockPasskey.message, status);
	}

	// Persist the credential locally so account pages can reason about linked
	// passkeys without querying Passlock on every request.
	const localPasskey = await createPasskey({
		userId: event.locals.user.userId,
		passkeyId: passlockPasskey.id,
		username: passlockPasskey.credential.username,
		platformName: passlockPasskey.platform?.name ?? principal.passkey?.platformName ?? null,
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
	const vaultResult = await PasslockServer.deleteUserPasskeys(
		{
			userId: String(context.user.userId)
		},
		getPasslockConfig()
	);

	if (vaultResult.failure) {
		const status = PasslockServer.isNotFoundError(vaultResult) ? 404 : 500;
		return errorResponse('Unable to delete passkeys', status);
	}

	const response: DeleteUserPasskeysSuccess = {
		_tag: 'DeleteUserPasskeysSuccess',
		deleted: vaultResult.deleted
	};

	return json(response);
};
