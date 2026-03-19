import * as Passlock from '@passlock/client/safe';

import {
	DeletePasskeySuccess,
	DeleteUserPasskeysSuccess,
	Error,
	UpdatePasskeysSuccess
} from '$lib/shared/schemas';
import { parse } from 'valibot';
import { resolve } from '$app/paths';
import { postData } from './network';

export type CreatePasskeyInput = {
	email: string;
	displayName: string;
	tenancyId: string;
	endpoint?: string | undefined;
	existingPasskeys: Array<string>;
};

/**
 * Use @passlock/client/safe to register a passkey on the user's local device.
 * Send the `code` to the backend for verification and account linkage by making a POST request
 * to the /passkeys/+server.ts endpoint.
 * 
 * @param input 
 * @returns 
 */
export const registerPasskey = async (input: CreatePasskeyInput) => {
	const ERROR_TAG = '@error/CreatePasskeyError' as const;

  // excludeCredentials prevents the user registering multiple
  // passkeys for the same account on the same device/ecosystem
  // see https://passlock.dev/passkeys/exclude-credentials/
	const { tenancyId, endpoint, email: username, displayName, existingPasskeys: excludeCredentials } = input;

	// client side registration
	const clientResult = await Passlock.registerPasskey({
		endpoint,
		tenancyId,
		username,
		displayName,
		excludeCredentials,
		userVerification: 'preferred',
	});

  // could also use the _tag as a discriminator e.g. 
  // if (clientResult.failure && clientResult._tag === "@error/DuplicatePasskey")
	if (clientResult.failure && Passlock.isDuplicatePasskeyError(clientResult)) {
		const message = 'Passkey already available on this device';
		return { _tag: ERROR_TAG, message } as const;
	} else if (clientResult.failure) {
		return { _tag: ERROR_TAG, message: clientResult.message } as const;
	}

	// server side passkey verification and registration
	return postData({
		url: resolve('/passkeys'),
		method: 'POST',
		body: { code: clientResult.code },
		on2xx: () => ({ _tag: 'CreatePasskeySuccess' }) as const,
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
export const updatePasskeyUsernames = async (input: UpdatePasskeysInput) => {
	const ERROR_TAG = '@error/UpdatePasskeyError';
	const { username, givenName, familyName } = input;
	const displayName = `${givenName} ${familyName}`.trim();

  // make a PATCH request to the /passkeys/+server.ts endpoint
	const serverResult = await postData({
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

  // return the error
	if (serverResult._tag !== 'Credentials') return serverResult;

  // client side update
  const result = await Passlock.updatePasskeyUsernames(serverResult.credentials)

	return result.success
		? ({ _tag: 'UpdatePasskeySuccess' } as const)
		: ({
				_tag: ERROR_TAG,
				message: 'Unable to update passkey(s)'
			} as const);
};

export type DeletePasskeyInput = {
	passkeyId: string;
	tenancyId: string;
	endpoint: string | undefined;
};

/**
 * Delete the passkey from the Passlock vault, remove the user association in
 * the local db and remove it from the user's local device/passkey manager.
 * 
 * @param input 
 * @returns 
 */
export const deletePasskey = async (input: DeletePasskeyInput) => {
	const ERROR_TAG = '@error/DeletePasskeyError';
	const { tenancyId: passlockTenancyId, endpoint: passlockEndpoint, passkeyId } = input;

  // remove it from the passlock vault and local db
	const serverResult = await postData({
		url: resolve('/passkeys'),
		method: 'DELETE',
		body: { passkeyId },
		on2xx: (jsonResponse) => parse(DeletePasskeySuccess, jsonResponse),
		orElse: (jsonResponse) => {
			const { message } = parse(Error, jsonResponse);
			return { _tag: ERROR_TAG, message } as const;
		}
	});

  // return the error
	if (serverResult._tag === ERROR_TAG) return serverResult;

  // warning will be that the passkey was already deleted/doesn't exist
	const { warning } = serverResult;

	// client side delete
	const result = await Passlock.deletePasskey({
		passkeyId,
		tenancyId: passlockTenancyId,
		endpoint: passlockEndpoint
	});

	if (result.success) {
		return { _tag: 'DeleteSuccess', warning } as const;
	}

  // some devices don't support programmatic passkey removal
	if (result.code === 'PASSKEY_DELETION_UNSUPPORTED') {
		const message =
			'This browser cannot delete passkeys programmatically. ' +
			'The passkey was removed from your account, ' +
			'but you still need to delete it manually from your device password manager.';

		return { _tag: '@warning/PasskeyDeletePaused', message } as const;
	} else {
    const message = `Passkey was removed from your account but local deletion failed: ${result.message}`;
    return { _tag: ERROR_TAG, message } as const;
  }
};

export type DeleteAccountPasskeysInput = {
	passkeyCount: number;
};

/**
 * Delete every passkey associated with the current account.
 *
 * The /passkeys endpoint removes the server-side records and returns the
 * deleted credentials. We then ask the browser/password manager to remove
 * the local copies too. Local deletion issues are treated as warnings so the
 * account deletion flow can continue.
 *
 * @param input
 * @returns
 */
export const deleteAccountPasskeys = async (input: DeleteAccountPasskeysInput) => {
	const ERROR_TAG = '@error/DeleteAccountPasskeysError';
	const WARNING_TAG = '@warning/DeleteAccountPasskeysPaused';

	if (input.passkeyCount === 0) {
		return { _tag: 'DeleteSuccess' } as const;
	}

	const serverResult = await postData({
		url: resolve('/passkeys'),
		method: 'DELETE',
		body: { scope: 'user' },
		on2xx: (jsonResponse) => parse(DeleteUserPasskeysSuccess, jsonResponse),
		orElse: (jsonResponse) => {
			const { message } = parse(Error, jsonResponse);
			return { _tag: ERROR_TAG, message } as const;
		}
	});

	if (serverResult._tag === ERROR_TAG) {
		return serverResult;
	}

	const result = await Passlock.deleteUserPasskeys(serverResult.deleted);
	if (result.success) {
		return { _tag: 'DeleteSuccess' } as const;
	}

	if (result.code === 'PASSKEY_DELETION_UNSUPPORTED') {
		return {
			_tag: WARNING_TAG,
			message:
				'Passkeys were removed from your account, but this browser cannot delete them ' +
				'programmatically. Remove them manually from your device password manager after ' +
				'the account is deleted.'
		} as const;
	}

	return {
		_tag: WARNING_TAG,
		message: `Passkeys were removed from your account but local deletion failed: ${result.message}`
	} as const;
};

export type AuthenticatePasskeyInput = {
	tenancyId: string;
	endpoint?: string | undefined;
	allowCredentials?: Array<string> | undefined;
	autofill?: boolean;
	onEvent?: (event: Passlock.AuthenticationEvent) => void;
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
	const { tenancyId, endpoint, autofill, onEvent, allowCredentials } = input;

  // kick of passkey auth locally
	const result = await Passlock.authenticatePasskey({
		tenancyId,
		endpoint,
		allowCredentials,
		userVerification: 'preferred',
		autofill,
		onEvent
	});

	if (result.failure) {
		return { _tag: ERROR_TAG, message: result.message } as const;
	}

  // send the code to the backend for verification
  // create a new session if successful
	return await postData({
		url: resolve('/passkeys/login'),
		method: 'POST',
		body: { code: result.code },
		on2xx: () => ({ _tag: 'PasslockLoginSuccess' }) as const,
		orElse: (jsonResponse) => {
			const { message } = parse(Error, jsonResponse);
			return { _tag: ERROR_TAG, message } as const;
		}
	});
};
