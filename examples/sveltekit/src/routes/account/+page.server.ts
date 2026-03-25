import type { Actions, PageServerLoad } from './$types';
import { upsertEmailChallenge, updateUserProfile } from '$lib/server/repository.js';
import { requireAccountPasskeyConfirmation } from '$lib/server/account.js';
import { sendOtcEmail } from '$lib/server/email.js';
import { setEmailChangeOtcCookie } from '$lib/server/oneTimeCode.js';
import { getPasslockClientConfig } from '$lib/server/passkeys.js';
import { emailSchema, profileSchema } from './schemas.js';
import { resolve } from '$app/paths';
import { fail, redirect } from '@sveltejs/kit';
import { message, setError, setMessage, superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';

const createProfileForm = (input?: { givenName?: string; familyName?: string }) =>
	superValidate(
		{
			givenName: input?.givenName ?? '',
			familyName: input?.familyName ?? ''
		},
		valibot(profileSchema),
		{ id: 'profile-form' }
	);

const createEmailForm = (input?: { email?: string }, options?: { errors?: boolean }) =>
	superValidate({ email: input?.email ?? '' }, valibot(emailSchema), {
		id: 'email-form',
		errors: options?.errors
	});

const failProfileReauthenticationRequired = (
	profileForm: Awaited<ReturnType<typeof createProfileForm>>,
	emailForm: Awaited<ReturnType<typeof createEmailForm>>,
	user: Awaited<ReturnType<typeof requireAccountPasskeyConfirmation>>['user'],
	hasPasskeys: boolean
) => {
	setError(profileForm, '', 'Confirm your passkey before saving account changes.');

	return fail(400, {
		profileForm,
		emailForm,
		currentEmail: user.email,
		hasPasskeys
	});
};

const failEmailReauthenticationRequired = (
	profileForm: Awaited<ReturnType<typeof createProfileForm>>,
	emailForm: Awaited<ReturnType<typeof createEmailForm>>,
	user: Awaited<ReturnType<typeof requireAccountPasskeyConfirmation>>['user'],
	hasPasskeys: boolean
) => {
	setError(emailForm, '', 'Confirm your passkey before saving account changes.');

	return fail(400, {
		profileForm,
		emailForm,
		currentEmail: user.email,
		hasPasskeys
	});
};

const getEmailStatusError = (reason: string | null) => {
	if (reason === 'taken') return 'That email address is already in use.';
	if (reason === 'expired') return 'Your email verification session expired. Start again.';
	return null;
};

export const load = (async ({ locals, url }) => {
	const { user, hasPasskeys } = await requireAccountPasskeyConfirmation(locals);
	const passlockConfig = getPasslockClientConfig();

	const profileForm = await createProfileForm({
		givenName: user.givenName,
		familyName: user.familyName
	});

	// if the user tries to verify their email after the code
	// has expired we redirect them back to the account page but
	// we pre-fill the email so they don't have to enter it again
	// see /verify-email/+server.ts#redirectToAccountWithError
	const emailForm = await createEmailForm(
		// this is the NEW email address
		{ email: url.searchParams.get('email') ?? undefined },
		{ errors: false }
	);

	// after the user successfully enters the email verification code
	// they are redirected back here with ?email-updated=1
	// see /verify-email/+server.ts#redirectToAccountWithError
	const emailUpdated = url.searchParams.get('email-updated') === '1';
	const emailStatusMessage = emailUpdated ? 'Email address updated.' : null;
  if (emailStatusMessage) {
    setMessage(emailForm, emailStatusMessage)
  }

	// if we couldn't verify the new email address
	// the user is redirected back here with a failure code
	const emailVerificationError = url.searchParams.get('email-error');
	const emailStatusError = getEmailStatusError(emailVerificationError);
  if (emailStatusError) {
    setError(emailForm, emailStatusError)
  }

	return {
		profileForm,
		emailForm,
		currentEmail: user.email,
		hasPasskeys,
		emailUpdated,
		emailStatusMessage,
		emailStatusError,
		syncPasskeysOnLoad: emailUpdated && hasPasskeys,
		...passlockConfig
	};
}) satisfies PageServerLoad;

export const actions = {
	profile: async ({ request, locals }) => {
		const { user, hasPasskeys, reauthenticationRequired } =
			await requireAccountPasskeyConfirmation(locals);

		const emailForm = await createEmailForm(undefined, { errors: false });
		const profileForm = await superValidate(request, valibot(profileSchema), {
			id: 'profile-form'
		});

		if (!profileForm.valid) {
			return fail(400, {
				profileForm,
				emailForm,
				currentEmail: user.email,
				hasPasskeys
			});
		}

		if (reauthenticationRequired) {
			// user didn't authenticate with the passkey in the last 10 mins
			return failProfileReauthenticationRequired(profileForm, emailForm, user, hasPasskeys);
		}

		const updatedUser = await updateUserProfile(user.userId, {
			givenName: profileForm.data.givenName,
			familyName: profileForm.data.familyName
		});

		if (!updatedUser) {
			setError(profileForm, 'givenName', 'Unable to update this account');
			return fail(400, {
				profileForm,
				emailForm,
				currentEmail: user.email,
				hasPasskeys
			});
		}

		return message(profileForm, 'Account details updated');
	},
	email: async ({ request, locals, cookies }) => {
		const { user, hasPasskeys, reauthenticationRequired } =
			await requireAccountPasskeyConfirmation(locals);

		const profileForm = await createProfileForm({
			givenName: user.givenName,
			familyName: user.familyName
		});

		const emailForm = await superValidate(request, valibot(emailSchema), {
			id: 'email-form'
		});

		if (!emailForm.valid) {
			return fail(400, {
				profileForm,
				emailForm,
				currentEmail: user.email,
				hasPasskeys
			});
		}

		if (emailForm.data.email === user.email) {
			setError(emailForm, 'email', 'Enter a different email address.');
			return fail(400, {
				profileForm,
				emailForm,
				currentEmail: user.email,
				hasPasskeys
			});
		}

		if (reauthenticationRequired) {
			// user didn't authenticate with the passkey in the last 10 mins
			return failEmailReauthenticationRequired(profileForm, emailForm, user, hasPasskeys);
		}

		// we dont actually update the email at this point
		// instead we generate a new verification code to
		// send to the new new email
		const result = await upsertEmailChallenge({
			userId: user.userId,
			email: emailForm.data.email
		});

		// shouldn't normally happen but could occur
		// if the user has two tabs/windows open and decided
		// to close their account then submit the change email form
		if (result._tag === '@error/AccountNotFound') {
			redirect(303, resolve('/login'));
		}

		if (result._tag === '@error/DuplicateUser') {
			setError(emailForm, 'email', 'That email address is already in use.');
			return fail(400, {
				profileForm,
				emailForm,
				currentEmail: user.email,
				hasPasskeys
			});
		}

		// we dont want to fire off emails every time the user hits
		// the submit button
		if (result._tag === '@error/ChallengeRateLimited') {
			const seconds = Math.ceil(result.retryAfterMs / 1000);

			setError(
				emailForm,
				'email',
				`A code was just sent. Please wait ${seconds} seconds and try again.`
			);

			return fail(400, {
				profileForm,
				emailForm,
				currentEmail: user.email,
				hasPasskeys
			});
		}

		// send the verification code to the new email
		await sendOtcEmail({
			email: result.challenge.email,
			firstName: user.givenName,
			code: result.code
		});

		// verification requires the 6 digit code and the token
		setEmailChangeOtcCookie(cookies, result.token);

		redirect(303, resolve('/account/verify-email'));
	}
} satisfies Actions;
