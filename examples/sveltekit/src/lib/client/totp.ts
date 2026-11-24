import { resolve } from '$app/paths';
import * as v from 'valibot';
import { TotpResponse } from '#lib/shared/totp.js';
import {
	authenticatePasskey,
	authorizePasskeyAuthentication,
	getPasskeyStatus,
	type PasslockClientConfig
} from './passkeys';

/** Calls only this application's same-origin backend; never sends API credentials to the browser. */
export const requestTotp = async (url: string, body: object = {}): Promise<TotpResponse> => {
	try {
		const response = await fetch(url, {
			method: 'POST',
			credentials: 'same-origin',
			cache: 'no-store',
			redirect: 'error',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		});
		const parsed = v.safeParse(TotpResponse, await response.json());
		if (
			parsed.success &&
			(response.ok ? parsed.output.type !== 'error' : parsed.output.type === 'error')
		)
			return parsed.output;
	} catch {
		/* Never surface fetch diagnostics containing codes or setup payloads. */
	}
	return {
		type: 'error',
		message:
			'The request could not be completed. Check enrollment status or start a fresh login; do not assume the code was accepted.'
	};
};

/** The server repeats this authorization check; this helper only drives the passkey prompt. */
export const confirmTotpAccess = async (config: PasslockClientConfig): Promise<string | null> => {
	try {
		const status = await getPasskeyStatus();
		if (status._tag === '@error/PasskeyStatusError')
			return 'Unable to check your passkey. Try signing in again.';
		if (!status.reauthenticationRequired) return null;
		const authorization = await authorizePasskeyAuthentication({
			url: resolve('account/re-authenticate/authorize')
		});
		if (authorization._tag === '@error/AuthorizePasskeyAuthenticationError')
			return 'Unable to confirm your passkey.';
		const result = await authenticatePasskey(
			{
				authenticationToken: authorization.authenticationToken,
				verificationRoute: resolve('account/re-authenticate')
			},
			config
		);
		if (result._tag === '@error/OrphanedPasskey') return result.message;
		return result._tag === 'PasslockLoginSuccess'
			? null
			: 'Confirm your passkey before changing authenticators.';
	} catch {
		return 'Unable to confirm your passkey. Try signing in again.';
	}
};
