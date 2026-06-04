import type { SuperFormErrors } from 'sveltekit-superforms/client';
import {
	authenticatePasskey,
	getPasskeyStatus,
	preparePasskeyAuthentication,
	type PasslockClientConfig
} from '$lib/client/passkeys';
import { resolve } from '$app/paths';

type FormErrors = SuperFormErrors<Record<string, unknown>>;

const clearFormErrors = (errors: FormErrors) => {
	errors.update((current) => ({ ...current, _errors: undefined }));
};

const setFormError = (errors: FormErrors, message: string) => {
	errors.update((current) => ({ ...current, _errors: [message] }));
};

/**
 * Ensure the current account action has a recent passkey confirmation.
 *
 * The server owns the real authorization check. This helper just performs the
 * client-side prompt when needed. The prompt uses a prepared token from
 * `/account/re-authenticate/prepare`, then posts the resulting Passlock code
 * to `/account/re-authenticate`, which refreshes the session's
 * `passkeyAuthenticatedAt` timestamp.
 *
 * If the user authenticated recently or has no passkeys, this is a no-op.
 */
export const reAuthenticateIfNecessary = async (
	input: {
		errors: FormErrors;
		validateForm: () => Promise<{ valid: boolean }>;
	},
	config: PasslockClientConfig
) => {
	clearFormErrors(input.errors);
	const error = { _tag: '@error/ReAuthenticationFailure' as const };

	// Avoid prompting for a passkey when the form would fail validation anyway.
	const validation = await input.validateForm();
	if (!validation.valid) return error;

	// Ask the server whether this session still falls inside the re-auth window.
	const passkeyStatus = await getPasskeyStatus();
	if (passkeyStatus._tag === '@error/PasskeyStatusError') {
		setFormError(input.errors, passkeyStatus.message);
		return error;
	}

	// No passkeys or a still-fresh passkey login means the action can proceed.
	if (passkeyStatus.passkeyCount === 0 || !passkeyStatus.reauthenticationRequired) {
		return {
			_tag: 'ReAuthenticationSuccess',
			passkeyCount: passkeyStatus.passkeyCount
		} as const;
	}

	const preparedAuthentication = await preparePasskeyAuthentication({
		url: resolve('/account/re-authenticate/prepare')
	});

	if (preparedAuthentication._tag === '@error/PreparePasskeyAuthenticationError') {
		setFormError(input.errors, preparedAuthentication.message);
		return error;
	}

	// Let the browser authenticate with the prepared token, then let the server
	// refresh the re-auth timestamp for the current session.
	const result = await authenticatePasskey(
		{
			authenticationToken: preparedAuthentication.authenticationToken,
			verificationRoute: resolve('/account/re-authenticate')
		},
		config
	);

	if (result._tag === 'PasslockLoginSuccess') {
		return {
			_tag: 'ReAuthenticationSuccess',
			passkeyCount: passkeyStatus.passkeyCount
		} as const;
	}

	setFormError(input.errors, result.message);
	return error;
};
