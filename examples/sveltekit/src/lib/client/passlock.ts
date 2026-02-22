import {
	authenticatePasskey,
	deletePasskey,
	isAuthenticationSuccess,
	isDeleteError,
	isDuplicatePasskeyError,
	isRegistrationSuccess,
	registerPasskey,
	type AuthenticationEvent
} from '@passlock/client/safe';

import { updatePasskey as updateLocalPasskey } from '@passlock/client/safe';
import { UpdatePasskeysSuccess, Error, DeletePasskeySuccess } from '$lib/shared/schemas';
import { parse } from 'valibot';
import { resolve } from '$app/paths';

export type CreatePasskeyInput = {
	tenancyId: string;
	endpoint: string | undefined;
	email: string;
	existingPasskeyIds: Array<string>;
};

type PostDataInput<A, E> = {
	url: string;
	body: object;
	method: 'POST' | 'PATCH' | 'DELETE';
	on2xx: (response: unknown) => A;
	orElse: (response: unknown) => E;
};

const postData = async <A, E>({ url, method, body, on2xx, orElse }: PostDataInput<A, E>) => {
	const response = await fetch(url, {
		method,
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify(body)
	});

	const jsonResponse = await response.json();

	return response.ok ? on2xx(jsonResponse) : orElse(jsonResponse);
};

export const createPasslockPasskey = async (input: CreatePasskeyInput) => {
	const ERROR_TAG = '@error/CreatePasskeyError' as const;

	const { tenancyId, endpoint, email, existingPasskeyIds: excludeCredentials } = input;

	// client side registration
	const clientResult = await registerPasskey({
		endpoint,
		tenancyId,
		username: email,
		userDisplayName: email,
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
	tenancyId: string;
	endpoint: string | undefined;
};

export const updatePasslockUsernames = async (input: UpdatePasskeyInput) => {
	const ERROR_TAG = '@error/UpdatePasskeyError';
	const { username, tenancyId: passlockTenancyId, endpoint: passlockEndpoint } = input;

	const serverResult = await postData({
		url: resolve('/passkeys'),
		method: 'PATCH',
		body: { username },
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

	const { credentials } = serverResult;

	// TODO return only one userId from server
	// client side delete
	let isSuccess = true;
	for (const credentialUpdate of credentials) {
		const { _tag } = await updateLocalPasskey({
			tenancyId: passlockTenancyId,
			endpoint: passlockEndpoint ?? undefined,
			...credentialUpdate
		});
		isSuccess = isSuccess && _tag === 'UpdateSuccess';
	}

	return isSuccess
		? ({
				_tag: ERROR_TAG,
				message: 'Unable to update passkey(s)'
			} as const)
		: ({ _tag: 'UpdatePasskeySuccess' } as const);
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

	if (result._tag === 'DeleteSuccess') {
		return { _tag: 'DeleteSuccess', warning } as const;
	}

	if (isDeleteError(result) && result.code === 'PASSKEY_DELETION_UNSUPPORTED') {
		const message =
			'This browser cannot delete passkeys programmatically. ' +
			'The passkey was removed from your account, ' +
			'but you still need to delete it manually from your device password manager.';

		return { _tag: '@warning/PasskeyDeletePaused', message } as const;
	}

	if (isDeleteError(result)) {
		const message = `Passkey was removed from your account but local deletion failed: ${result.message}`;

		return { _tag: ERROR_TAG, message } as const;
	}

	const message =
		'Passkey was removed from your account, but local deletion failed on this device.';

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
