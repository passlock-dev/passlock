import type { SuperFormErrors } from 'sveltekit-superforms/client';

export type FormErrors = SuperFormErrors<Record<string, unknown>>;

// Clear form level errors
export const clearFormErrors = (errors: FormErrors) => {
	errors.update((current) => ({ ...current, _errors: undefined }));
};

// Set a form level error
export const setFormError = (errors: FormErrors, message: string) => {
	errors.update((current) => ({ ...current, _errors: [message] }));
};
