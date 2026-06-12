/**
 * Browser-side passkey helpers.
 *
 * These functions own the part of the flow that must happen in the browser:
 * asking WebAuthn-capable devices to create, present, update, or delete a
 * passkey. Anything that requires server trust, such as exchanging a Passlock
 * code for a verified principal or mutating the Passlock vault, is delegated
 * to SvelteKit endpoints.
 *
 * Each helper returns a discriminated union rather than throwing untyped
 * errors so route components can make auth decisions with simple `_tag`
 * checks.
 */

import * as PasslockBrowser from '@passlock/browser';

import {
	DeletePasskeySuccess,
	DeletePasskeyWarning,
	DeleteUserPasskeysSuccess,
	Error,
	PasskeyStatusSuccess,
	AuthorizedPasskeyAuthentication,
	AuthorizedPasskeyRegistration,
	UpdatePasskeysSuccess
} from '$lib/shared/schemas';
import { parse, variant } from 'valibot';
import { resolve } from '$app/paths';
import { fetchData } from './network';

export type PasslockClientConfig = {
	tenancyId: string;
	endpoint?: string | undefined;
};

/**
 * Ask the server to authorize passkey registration, create the passkey on the
 * current device, then hand the returned code back to the server so it can
 * verify the registration and store the local association.
 *
 * Registration is split across trust boundaries:
 * - `POST /passkeys/registration` decides whether the signed-in account may
 *   create a passkey and returns a one-time registration token.
 * - `@passlock/browser` talks to the browser's WebAuthn APIs using that token.
 * - `POST /passkeys` verifies the Passlock code and stores the passkey
 *   association in server-side state.
 */
export const registerPasskey = async (config: PasslockClientConfig) => {
	const ERROR_TAG = '@error/CreatePasskeyError' as const;

	const authorizedRegistration = await fetchData({
		url: resolve('/passkeys/registration'),
		method: 'POST',
		body: {},
		on2xx: (jsonResponse) => parse(AuthorizedPasskeyRegistration, jsonResponse),
		orElse: (jsonResponse) => {
			const { message } = parse(Error, jsonResponse);
			return { _tag: ERROR_TAG, message } as const;
		}
	});

	if (authorizedRegistration._tag === ERROR_TAG) return authorizedRegistration;

	// WebAuthn registration must happen in the browser.
	const clientResult = await PasslockBrowser.registerPasskey(
		{ registrationToken: authorizedRegistration.registrationToken },
		config
	);

	// The browser matched one of the authorized excluded credentials to a passkey
	// that is already present on this device.
	if (clientResult._tag === '@error/DuplicatePasskey') {
		const message = 'Passkey already available on this device';
		return { _tag: ERROR_TAG, message } as const;
	} else if (clientResult.failure) {
		// Another browser-side failure, such as a cancelled prompt.
		return { _tag: ERROR_TAG, message: clientResult.message } as const;
	}

	// Post to the /passkeys/+server.ts endpoint, which verifies
	// the passkey and links it to the user account.
	return fetchData({
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

export type AuthenticatePasskeyInput = {
	/**
	 * Server-authorized authentication token. The browser receives only this token;
	 * the backend decides whether the ceremony is account-scoped, discoverable,
	 * or conditional/autofill.
	 */
	authenticationToken: string;
	/**
	 * Most passkey auth attempts end by posting the Passlock code to the login
	 * endpoint. Sensitive account actions reuse the same browser prompt but send
	 * the code to `/account/re-authenticate` so the existing session can be
	 * marked as recently passkey-verified.
	 */
	verificationRoute?: string | undefined;
	/**
	 * Used with conditional mediation/autofill so the page can react to browser
	 * events such as the user selecting a credential before verification starts.
	 */
	onEvent?: (event: PasslockBrowser.AuthenticationEvent) => void;
};

export const authorizePasskeyAuthentication = async (input: { url: string; body?: object }) => {
	const ERROR_TAG = '@error/AuthorizePasskeyAuthenticationError' as const;

	return fetchData({
		url: input.url,
		method: 'POST',
		body: input.body ?? {},
		on2xx: (jsonResponse) => parse(AuthorizedPasskeyAuthentication, jsonResponse),
		orElse: (jsonResponse) => {
			const { message } = parse(Error, jsonResponse);
			return { _tag: ERROR_TAG, message } as const;
		}
	});
};

/**
 * Ask the browser to authenticate with a passkey and then post the resulting
 * Passlock code to a server endpoint that can trust the outcome.
 *
 * The browser proves possession of the credential; the server decides what
 * that proof means for the app, such as creating a session or refreshing a
 * re-authentication timestamp.
 */
export const authenticatePasskey = async (
	input: AuthenticatePasskeyInput,
	config: PasslockClientConfig
) => {
	const ERROR_TAG = '@error/PasskeyLoginError';

	const { authenticationToken, verificationRoute = '/login/passkey' } = input;

	// WebAuthn prompts can only run in the browser.
	const clientResult = await PasslockBrowser.authenticatePasskey(
		{
			authenticationToken,
			onEvent: input.onEvent
		},
		config
	);

	// Authentication never left the device, so there is nothing to verify
	// server-side.
	if (clientResult.failure) {
		return { _tag: ERROR_TAG, message: clientResult.message } as const;
	}

	// Post to the /login/passkeys/+server.ts endpoint, which verifies
	// the passkey and creates a new session. Alternatively post to the
	// /account/re-authenticate/+server.ts route which refreshes the session
	// bumping the passkeyAuthenticatedAt timestamp.
	return await fetchData({
		url: verificationRoute,
		method: 'POST',
		body: { code: clientResult.code },
		on2xx: () => ({ _tag: 'PasslockLoginSuccess' }) as const,
		orElse: (jsonResponse) => {
			const { message } = parse(Error, jsonResponse);
			return { _tag: ERROR_TAG, message } as const;
		}
	});
};

/**
 * Ask the server whether the current session must be re-authenticated before a
 * sensitive action and, if so, which passkeys belong to the account.
 */
export const getPasskeyStatus = async () => {
	const ERROR_TAG = '@error/PasskeyStatusError' as const;

	return fetchData({
		url: '/passkeys',
		method: 'GET',
		on2xx: (response) => parse(PasskeyStatusSuccess, response),
		orElse: () => {
			return {
				_tag: ERROR_TAG,
				message: 'Unable to determine whether a passkey confirmation is required.'
			} as const;
		}
	});
};

export type UpdatePasskeysInput = {
	username: string;
	givenName: string | undefined;
	familyName: string | undefined;
};

/**
 * Update the account name shown for every passkey linked to the current user.
 *
 * This sample keeps passkey metadata aligned in three places:
 * - the Passlock vault, which stores the canonical passkey records
 * - the local SQLite database, which powers account-specific UI
 * - the user's device or password manager, which shows the username and
 *   display name during sign-in
 *
 * The server updates the first two; the browser then uses the credential list
 * returned by the server to request the local update.
 */
export const updateUserPasskeys = async (input: UpdatePasskeysInput) => {
	const ERROR_TAG = '@error/UpdatePasskeyError';
	const { username, givenName, familyName } = input;
	const displayName = `${givenName} ${familyName}`.trim();

	// `PATCH /passkeys` updates the Passlock vault and the local SQLite record.
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

	// Only the credential payload contains enough information for the browser to
	// request a local device update.
	if (serverResult._tag !== 'Credentials') return serverResult;

	// This step is purely local to the browser/device, so no tenancy config is
	// required.
	const clientResult = await PasslockBrowser.updatePasskeyUsernames(serverResult.credentials);

	if (clientResult.success) return { _tag: 'UpdatePasskeySuccess' } as const;

	return { _tag: ERROR_TAG, message: 'Unable to update passkey(s)' } as const;
};

export type DeletePasskeyInput = {
	passkeyId: string;
};

/**
 * Delete a single passkey from the account.
 *
 * As with updates, deletion has both a trusted server-side part and a
 * best-effort browser-side part. The account should stop trusting the passkey
 * even if the browser cannot remove it from the local password manager.
 */
export const deletePasskey = async (input: DeletePasskeyInput) => {
	const ERROR_TAG = '@error/DeletePasskeyError';
	const PAUSED_TAG = '@warning/PasskeyDeletePaused';

	// The endpoint can return either a successful deletion payload or a warning
	// that the server-side record was already gone.
	const EndpointResponse = variant('_tag', [DeletePasskeySuccess, DeletePasskeyWarning]);

	// `DELETE /passkeys/[id]` removes the server-side association first.
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

	// If the server still trusts the credential, we must stop here.
	if (serverResult._tag === '@error/DeletePasskeyError') return serverResult;

	// The local device is already in the desired state from the server's point
	// of view, so the caller can treat this as a warning rather than a failure.
	if (serverResult._tag === '@warning/PasskeyNotFound') return serverResult;

	// Local device deletion is best-effort and browser-dependent.
	const clientResult = await PasslockBrowser.deletePasskey(serverResult.deleted);

	if (clientResult.success) return { _tag: 'DeleteSuccess' } as const;

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
 * `DELETE /passkeys` removes the trusted server-side records and returns the
 * deleted credentials for the current user. The browser then tries to remove
 * those credentials from the device. Browser limitations are reported as
 * warnings so account deletion can continue.
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

	// If this fails, the account would still trust one or more passkeys.
	if (serverResult._tag !== 'DeleteUserPasskeysSuccess') {
		return serverResult;
	}

	const clientResult = await PasslockBrowser.deleteUserPasskeys(serverResult.deleted);

	if (clientResult.success) return { _tag: 'DeleteSuccess' } as const;

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
