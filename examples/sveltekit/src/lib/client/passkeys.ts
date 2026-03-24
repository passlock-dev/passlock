/**
 * Typically handles client-side passkey management, making fetch
 * calls to the passkey endpoints for the server side stuff.
 *
 * We use a _tag property as a discriminator on the response instead of
 * throwing untyped errors.
 */

import * as PasslockClient from '@passlock/client/safe';

import {
	DeletePasskeySuccess,
	DeletePasskeyWarning,
	DeleteUserPasskeysSuccess,
	Error,
	UpdatePasskeysSuccess
} from '$lib/shared/schemas';
import { parse, variant } from 'valibot';
import { resolve } from '$app/paths';
import { fetchData } from './network';

export type CreatePasskeyInput = {
	email: string;
	displayName: string;
	tenancyId: string;
	endpoint?: string | undefined;
	existingPasskeys: Array<string>;
};

/**
 * Use @passlock/client to register a passkey on the user's local device.
 * Send the `code` to the backend for verification and account linkage by
 * making a POST request to the /passkeys/+server.ts endpoint.
 *
 * @param input
 * @returns
 */
export const registerPasskey = async (input: CreatePasskeyInput) => {
	const ERROR_TAG = '@error/CreatePasskeyError' as const;

	// excludeCredentials prevents the user registering multiple
	// passkeys for the same account on a device/ecosystem
	// see https://passlock.dev/passkeys/exclude-credentials/
	const { email: username, existingPasskeys: excludeCredentials } = input;

	// client side registration
	const clientResult = await PasslockClient.registerPasskey({
		...input,
		username,
		excludeCredentials,
		userVerification: 'preferred'
	});

	// existingPasskeys/excludeCredentials included one or more
	// credentials that already exists on this device
	if (clientResult._tag === '@error/DuplicatePasskey') {
		const message = 'Passkey already available on this device';
		return { _tag: ERROR_TAG, message } as const;
	} else if (clientResult.failure) {
		// another client side error - abort
		return { _tag: ERROR_TAG, message: clientResult.message } as const;
	}

	// clientResult.failure is false so type is narrowed to a RegistrationSuccess
	// could also use if (clientResult.success) { ... }
	const { code } = clientResult;

	// server side passkey verification and registration
	return fetchData({
		// /passkeys/+server.ts endpoint
		url: resolve('/passkeys'),
		method: 'POST',
		body: { code },
		on2xx: () => ({ _tag: 'CreatePasskeySuccess' }) as const,
		orElse: (jsonResponse) => {
			const { message } = parse(Error, jsonResponse);
			return { _tag: ERROR_TAG, message } as const;
		}
	});
};

export type AuthenticatePasskeyInput = {
	tenancyId: string;
	endpoint?: string | undefined;
	serverPath?: string | undefined;
	autofill?: boolean;
	onEvent?: (event: PasslockClient.AuthenticationEvent) => void;
	existingPasskeys?: Array<string> | undefined;
};

/**
 * Ask the browser/device to present a passkey, send the code to the
 * backend for verification and if all good log the user in and create
 * a new session
 *
 * @param input
 * @returns
 */
export const authenticatePasskey = async (input: AuthenticatePasskeyInput) => {
	const ERROR_TAG = '@error/PasslockLoginError';

	// Passlock uses the WebAuthn term 'allowCredentials'
	const { existingPasskeys: allowCredentials, serverPath = '/login/passkey' } = input;

	console.log({ allowCredentials });

	// kick of passkey auth locally
	const clientResult = await PasslockClient.authenticatePasskey({
		...input,
		userVerification: 'preferred',
		allowCredentials
	});

	// local authentication failed - abort
	if (clientResult.failure) {
		return { _tag: ERROR_TAG, message: clientResult.message } as const;
	}

	// send the code to the backend for verification, session creation etc.
	return await fetchData({
		url: serverPath,
		method: 'POST',
		body: { code: clientResult.code },
		on2xx: () => ({ _tag: 'PasslockLoginSuccess' }) as const,
		orElse: (jsonResponse) => {
			const { message } = parse(Error, jsonResponse);
			return { _tag: ERROR_TAG, message } as const;
		}
	});
};

export type UpdatePasskeysInput = {
	username: string;
	givenName: string | undefined;
	familyName: string | undefined;
};

/**
 * Update the username/display name for every passkey associated with the user.
 * Note: This only works because during the passkey registration flow we set
 * the userId on the passkey. Otherwise Passlock would generate a random userId.
 *
 *
 * This happens in 3 places:
 * 1) The passlock vault (nice to have)
 * 2) The local (SQLite) database
 * 3) The users local device/password manager
 *
 * First we call the /passkeys endpoint (+server.ts). This handles steps 1 and 2.
 * Then we call updatePasskey from @passlock/client/safe to trigger the local updates.
 *
 * @param input
 * @returns
 */
export const updateUserPasskeys = async (input: UpdatePasskeysInput) => {
	const ERROR_TAG = '@error/UpdatePasskeyError';
	const { username, givenName, familyName } = input;
	const displayName = `${givenName} ${familyName}`.trim();

	// see the PATCH handler in /passkeys/+server.ts
	const serverResult = await fetchData({
		url: resolve('/passkeys'),
		method: 'PATCH',
		body: { username, displayName },
		on2xx: (jsonResponse) => {
			const { credentials } = parse(UpdatePasskeysSuccess, jsonResponse);
			return credentials.length === 0
				? ({ _tag: ERROR_TAG, message: 'No passkeys found' } as const)
				: ({ _tag: 'Credentials', credentials } as const);
		},
		orElse: (jsonResponse) => {
			const { message } = parse(Error, jsonResponse);
			return { _tag: ERROR_TAG, message } as const;
		}
	});

	// if we didnt get Credentials back from the endpoint we must
	// have an error which we send back to the caller
	if (serverResult._tag !== 'Credentials') return serverResult;

	// client side update. this is important because we need to keep
	// the passkey on the users device aligned with the the new username
	// note: we don't need a tenancyId or endpoint as the PasslockClient
	// doesn't need to call out to the Vault, it's a pure client-side operation
	const clientResult = await PasslockClient.updatePasskeyUsernames(serverResult.credentials);

	if (clientResult.success) return { _tag: 'UpdatePasskeySuccess' } as const;

	return { _tag: ERROR_TAG, message: 'Unable to update passkey(s)' } as const;
};

export type DeletePasskeyInput = {
	passkeyId: string;
};

/**
 * Delete one passkey from the Passlock vault, remove the user association in
 * the local db and remove it from the user's local device/passkey manager.
 *
 * @param input
 * @returns
 */
export const deletePasskey = async (input: DeletePasskeyInput) => {
	const ERROR_TAG = '@error/DeletePasskeyError';
	const PAUSED_TAG = '@warning/PasskeyDeletePaused';

	// server might respond with a 200 status but still issue a warning
	// use valibot's support for discriminated unions to get some nice typing
	const EndpointResponse = variant('_tag', [DeletePasskeySuccess, DeletePasskeyWarning]);

	// remove it from the passlock vault and local db
	// see the DELETE handler in /passkeys/[id]/+server.ts
	const serverResult = await fetchData({
		url: resolve(`/passkeys/${encodeURIComponent(input.passkeyId)}`),
		method: 'DELETE',
		body: {},
		on2xx: (jsonResponse) => parse(EndpointResponse, jsonResponse),
		orElse: (jsonResponse) => {
			const { message } = parse(Error, jsonResponse);
			return { _tag: ERROR_TAG, message } as const;
		}
	});

	// server side delete failed - abort
	if (serverResult._tag === '@error/DeletePasskeyError') return serverResult;

	// even if the server side delete was ok, we might receive
	// a warning because the passkey was already deleted
	if (serverResult._tag === '@warning/PasskeyNotFound') return serverResult;

	// client side delete, again we don't need a tenancyId or endpoint
	const clientResult = await PasslockClient.deletePasskey(serverResult.deleted);

	// passkey was deleted from the user's device
	if (clientResult.success) return { _tag: 'DeleteSuccess' } as const;

	// if success is false the type is narrowed to a DeleteError
	// which includes a code indicating the specific error
	if (clientResult.code === 'PASSKEY_DELETION_UNSUPPORTED') {
		const message =
			'This browser cannot delete passkeys programmatically. ' +
			'The passkey was removed from your account, ' +
			'but you still need to delete it manually from your device password manager.';

		return { _tag: PAUSED_TAG, message } as const;
	}

	const message = `Passkey was removed from your account but local deletion failed: ${clientResult.message}`;
	return { _tag: ERROR_TAG, message } as const;
};

/**
 * Delete every passkey associated with the current account.
 *
 * The /passkeys/+server.ts endpoint removes the server-side records and returns the
 * deleted credentials for the current user. We then ask the browser/password manager
 * to remove the credentials from the device. Local deletion issues are treated as
 * warnings so the account deletion flow can continue.
 *
 * @param
 * @returns
 */
export const deleteAccountPasskeys = async () => {
	const ERROR_TAG = '@error/DeletePasskeyError';
	const PAUSED_TAG = '@warning/PasskeyDeletePaused';

	const serverResult = await fetchData({
		url: resolve('/passkeys'),
		method: 'DELETE',
		body: { scope: 'user' },
		on2xx: (jsonResponse) => parse(DeleteUserPasskeysSuccess, jsonResponse),
		orElse: (jsonResponse) => {
			const { message } = parse(Error, jsonResponse);
			return { _tag: ERROR_TAG, message } as const;
		}
	});

	// something went wrong on the backend
	if (serverResult._tag !== 'DeleteUserPasskeysSuccess') {
		return serverResult;
	}

	const clientResult = await PasslockClient.deleteUserPasskeys(serverResult.deleted);

	if (clientResult.success) return { _tag: 'DeleteSuccess' } as const;

	// if success is false the type is narrowed to a DeleteError
	// which includes a code indicating the specific error
	if (clientResult.code === 'PASSKEY_DELETION_UNSUPPORTED') {
		return {
			_tag: PAUSED_TAG,
			message:
				'Passkeys were removed from your account, but this browser cannot delete them ' +
				'programmatically. Remove them manually from your device password manager after ' +
				'the account is deleted.'
		} as const;
	} else {
		const message = `Passkeys were removed from your account but local deletion failed: ${clientResult.message}`;
		return { _tag: ERROR_TAG, message } as const;
	}
};
