import {
  Passlock as Client,
  ErrorCode,
  PasslockError,
  type PasslockProps,
  type Principal,
  type VerifyEmail
} from '@passlock/client'
import { get } from 'svelte/store'
import type { SuperForm } from 'sveltekit-superforms'
import {
  getLocalEmail,
  saveEmailLocally,
  type ResendEmail,
  type VerifyEmailData
} from '../index.js'

export type RegistrationData = {
	email: string;
	givenName?: string;
	familyName?: string;
	token?: string;
	authType: 'apple' | 'google' | 'email' | 'passkey';
	verifyEmail?: 'link' | 'code';
};

export type LoginData = {
	email?: string;
	token?: string;
	authType: 'apple' | 'google' | 'email' | 'passkey';
};

export type SuperformData<T extends Record<string, unknown>> = {
	cancel: () => void;
	formData: FormData;
	form: SuperForm<T>;
	verifyEmail?: VerifyEmail;
};

export class Passlock {
	private readonly passlock: Client;

	constructor(config: PasslockProps) {
		this.passlock = new Client(config);
	}

	readonly preConnect = async () => {
		await this.passlock.preConnect();
	};

	readonly register = async <T extends RegistrationData>(options: SuperformData<T>) => {
		const { cancel, formData, form, verifyEmail } = options;
		const { email, givenName, familyName, token, authType } = get(form.form);

		if (token && authType) {
			// a bit hacky but basically the Google button sets the fields on the superform,
			// whos data is not necessarily posted to the backend unless we use a hidden
			// form field. We're basically duplicating the role of a hidden field here by
			// adding the token and authType to the request
			formData.set('token', token);
			formData.set('authType', authType);
		} else if (!token && authType === 'passkey') {
			const principal = await this.passlock.registerPasskey({
				email,
				...(givenName ? { givenName } : {}),
				...(familyName ? { familyName } : {}),
				verifyEmail
			});

			if (PasslockError.isError(principal) && principal.code === ErrorCode.Duplicate) {
				// detail will tell the user how to login (passkey or google)
				const error = principal.detail
					? `${principal.message}. ${principal.detail}`
					: principal.message;
				form.errors.update((errors) => ({ ...errors, email: [error] }));

				cancel();
			} else if (PasslockError.isError(principal)) {
				console.error(principal.message);

				// set a form level error
				form.errors.update((errors) => {
					const _errors = [...(errors._errors ?? []), 'Sorry something went wrong'];
					return { ..._errors, _errors };
				});

				cancel();
			} else if (!Client.isUserPrincipal(principal)) {
        console.error("No user returned by Passlock");

				// set a form level error
				form.errors.update((errors) => {
					const _errors = [...(errors._errors ?? []), 'Sorry something went wrong'];
					return { ..._errors, _errors };
				});

				cancel();
      } else {
				// append the passlock token to the form request
				formData.set('authType', principal.auth_type);
				formData.set('token', principal.jti);
				if (verifyEmail) formData.set('verifyEmail', verifyEmail.method);
			}
		}
	};

	readonly login = async <T extends LoginData>(options: SuperformData<T>) => {
		const { cancel, formData, form } = options;
		const { email, token, authType } = get(form.form);

		if (token && authType) {
			formData.set('token', token);
			formData.set('authType', authType);
		} else if (!token && authType === 'passkey') {
			const principal = await this.passlock.authenticatePasskey({
				email,
				userVerification: 'discouraged'
			});

			if (PasslockError.isError(principal) && principal.code === ErrorCode.NotFound) {
				// detail will tell the user how to login (passkey or google)
				const error = principal.detail
					? `${principal.message}. ${principal.detail}`
					: principal.message;
				form.errors.update((errors) => ({ ...errors, email: [error] }));
				cancel();
			} else if (PasslockError.isError(principal)) {
				form.message.set(principal.message);
				cancel();
			} else if (! Client.isUserPrincipal(principal)) {
        console.error("No user returned from Passlock");
        form.message.set("Sorry, something went wrong");
				cancel();
      } else {
        form.form.update((old) => ({ ...old, email: principal.email }));
        // append the passlock token to the form request
        formData.set('authType', principal.auth_type);
        formData.set('token', principal.jti);
			}
		}
	};

	readonly verifyEmail = async <T extends VerifyEmailData>(options: SuperformData<T>) => {
		const { cancel, formData, form } = options;
		const { code } = get(form.form);

		if (code.length >= 6) {
			const principal = await this.passlock.verifyEmailCode({ code });

			if (PasslockError.isError(principal)) {
				form.errors.update((old) => ({ ...old, code: [principal.message] }));
				cancel();
			} else {
				formData.set('token', principal.jti);
			}
		} else {
			form.errors.update((old) => ({ ...old, code: ['Please enter your code'] }));
			cancel();
		}
	};

	readonly autoVerifyEmail = async <T extends VerifyEmailData>(form: SuperForm<T>) => {
		if (this.passlock.getSessionToken('passkey')) {
			form.submit();
		}
	};

	readonly resendEmail = async (options: ResendEmail) => {
		await this.passlock.resendVerificationEmail(options);
	};
}

export const updateForm =
	<T extends Record<string, unknown>>(form: SuperForm<T>, onComplete?: () => Promise<void>) =>
	(event: CustomEvent<Principal>) => {
		form.form.update((old) => ({
			...old,
      email: event.detail.email,
      ...(event.detail.given_name ? { givenName: event.detail.given_name } : { }),
      ...(event.detail.family_name ? { familyName: event.detail.family_name } : { }),
			token: event.detail.jti,
			authType: event.detail.auth_type
		}));

		if (typeof onComplete === 'function') {
			onComplete();
		}
	};

export { getLocalEmail, saveEmailLocally }

