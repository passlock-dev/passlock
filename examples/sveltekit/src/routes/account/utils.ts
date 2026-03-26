import type { SuperFormErrors } from 'sveltekit-superforms/client';
import { authenticatePasskey, getPasskeyStatus } from '$lib/client/passkeys';

type FormErrors = SuperFormErrors<Record<string, unknown>>;

const clearFormErrors = (errors: FormErrors) => {
	errors.update((current) => ({ ...current, _errors: undefined }));
};

const setFormError = (errors: FormErrors, message: string) => {
	errors.update((current) => ({ ...current, _errors: [message] }));
};

/**
 * kick of passkey authentication if required, post the code to the
 * /account/re-authenticate route, which will bump the timestamp so
 * the form action will see the updated timestamp and allow the update.
 *
 * if the user authenticated recently or they have no passkeys this
 * function is essentially a no-op
 *
 * @param input
 * @returns
 */
export const reAuthenticateIfNecessary = async (input: {
	errors: FormErrors;
	validateForm: () => Promise<{ valid: boolean }>;
	tenancyId: string;
	endpoint?: string | undefined;
}) => {
	clearFormErrors(input.errors);
	const error = { _tag: '@error/ReAuthenticationFailure' as const };

	// if the form is invalid there's no point doing anything
	const validation = await input.validateForm();
	if (!validation.valid) return error;

	// call the /passkeys/+server.ts endpoint to fetch the user's
	// passkey count and whether they need to reauthenticate
	const passkeyStatus = await getPasskeyStatus();
	if (passkeyStatus._tag === '@error/PasskeyStatusError') {
		setFormError(input.errors, passkeyStatus.message);
		return error;
	}

	// no-op
	if (passkeyStatus.passkeyIds.length === 0 || !passkeyStatus.reauthenticationRequired) {
		return {
			_tag: 'ReAuthenticationSuccess',
			passkeyIds: passkeyStatus.passkeyIds
		} as const;
	}

	// kick off authentication, send the code to the /re-authenticate
	// route which will bump the timestamp
	const result = await authenticatePasskey({
		tenancyId: input.tenancyId,
		endpoint: input.endpoint,
		existingPasskeys: [...passkeyStatus.passkeyIds],
		userVerification: 'required',
		verificationRoute: '/account/re-authenticate'
	});

	if (result._tag === 'PasslockLoginSuccess') {
		return {
			_tag: 'ReAuthenticationSuccess',
			passkeyIds: passkeyStatus.passkeyIds
		} as const;
	}

	// authentication failed for some reason
	setFormError(input.errors, result.message);
	return error;
};
