import {
	authenticatePasskey,
	updatePasskey,
	deletePasskey,
	isAuthenticationSuccess,
	isDeleteError,
	isDuplicatePasskeyError,
	isRegistrationSuccess,
	registerPasskey,
	type AuthenticationEvent
} from '@passlock/client/safe';

import { UpdatePasskeysSuccess, Error, DeletePasskeySuccess } from '$lib/shared/schemas';
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

export const createPasslockPasskey = async (input: CreatePasskeyInput) => {
	const ERROR_TAG = '@error/CreatePasskeyError' as const;

	const { tenancyId, endpoint, email, displayName, existingPasskeys: excludeCredentials } = input;

	// client side registration
	const clientResult = await registerPasskey({
		endpoint,
		tenancyId,
		username: email,
		userDisplayName: displayName,
		userVerification: 'preferred',
		excludeCredentials
	});

	if (isDuplicatePasskeyError(clientResult)) {
		const message = 'Passkey already available on this device';
		return { _tag: ERROR_TAG, message } as const;
	} else if (!isRegistrationSuccess(clientResult)) {
		return { _tag: ERROR_TAG, message: clientResult.message } as const;
	}

	// server side registration
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

export type UpdatePasskeyInput = {
	username: string;
	givenName: string | undefined;
	familyName: string | undefined;
	tenancyId: string;
	endpoint: string | undefined;
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
export const updatePasskeyUsernames = async (input: UpdatePasskeyInput) => {
	const ERROR_TAG = '@error/UpdatePasskeyError';
	const { username, givenName, familyName, tenancyId, endpoint } = input;
	const displayName = `${givenName} ${familyName}`.trim();

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

	if (serverResult._tag !== 'Credentials') return serverResult;

	// client side update
	let isSuccess = true;
	for (const credentialUpdate of serverResult.credentials) {
		const { _tag } = await updatePasskey({ tenancyId, endpoint, ...credentialUpdate });
		isSuccess = isSuccess && _tag === 'UpdateSuccess';
	}

	return isSuccess
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

export const deletePasslockPasskey = async (input: DeletePasskeyInput) => {
	const ERROR_TAG = '@error/DeletePasskeyError';
	const { tenancyId: passlockTenancyId, endpoint: passlockEndpoint, passkeyId } = input;

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

	if (serverResult._tag === ERROR_TAG) return serverResult;

	const { warning } = serverResult;

	// client side delete
	const result = await deletePasskey({
		passkeyId,
		tenancyId: passlockTenancyId,
		endpoint: passlockEndpoint ?? undefined
	});

	if (!isDeleteError(result)) {
		return { _tag: 'DeleteSuccess', warning } as const;
	}

	if (result.code === 'PASSKEY_DELETION_UNSUPPORTED') {
		const message =
			'This browser cannot delete passkeys programmatically. ' +
			'The passkey was removed from your account, ' +
			'but you still need to delete it manually from your device password manager.';

		return { _tag: '@warning/PasskeyDeletePaused', message } as const;
	}

	const message = `Passkey was removed from your account but local deletion failed: ${result.message}`;

	return { _tag: ERROR_TAG, message } as const;
};

export type LoginInput = {
	tenancyId: string;
	endpoint?: string | undefined;
	allowCredentials?: Array<string> | undefined;
	autofill?: boolean;
	onEvent?: (event: AuthenticationEvent) => void;
};

export const passlockLogin = async (input: LoginInput) => {
	const ERROR_TAG = '@error/PasslockLoginError';
	const { tenancyId, endpoint, autofill, onEvent, allowCredentials } = input;

	const result = await authenticatePasskey({
		tenancyId,
		endpoint,
		allowCredentials,
		userVerification: 'preferred',
		autofill,
		onEvent
	});

	if (!isAuthenticationSuccess(result)) {
		return { _tag: ERROR_TAG, message: result.message } as const;
	}

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
