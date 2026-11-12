import type { SuperFormErrors } from 'sveltekit-superforms/client';

/** Validate before prompting, then recheck freshness without losing the user's form input. */
export const reAuthenticateIfNecessary = async (
	input: {
		errors: SuperFormErrors<Record<string, unknown>>;
		validateForm: () => Promise<{ valid: boolean }>;
	},
	confirm: () => Promise<boolean>
) => {
	input.errors.update((current) => ({ ...current, _errors: undefined }));
	const error = { _tag: '@error/ReAuthenticationFailure' as const };
	const validation = await input.validateForm();
	if (!validation.valid) return error;
	if (await confirm()) return { _tag: 'ReAuthenticationSuccess' as const };
	input.errors.update((current) => ({
		...current,
		_errors: ['Confirm your identity to continue. If your session expired, sign in again.']
	}));
	return error;
};
