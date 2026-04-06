import type { Actions, PageServerLoad } from './$types';
import { createOrRefreshEmailChallenge } from '$lib/server/challenges.js';
import { updateUserNames } from '$lib/server/repository.js';
import { requireAccountContext } from '$lib/server/account.js';
import { sendCodeChallengeEmail } from '$lib/server/email.js';
import { setEmailChangeCookie } from '$lib/server/cookies.js';
import { createChallengeRateLimitView } from '$lib/server/passlock.js';
import { getPasslockClientConfig } from '$lib/server/passkeys.js';
import { getAccountQueryState, type AccountEmailErrorReason } from '$lib/shared/queryState.js';
import { EmailSchema, ProfileSchema } from '$lib/shared/schemas.js';
import { resolve } from '$app/paths';
import { fail, redirect } from '@sveltejs/kit';
import { message, setError, setMessage, superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';

const createProfileForm = (input?: { givenName?: string; familyName?: string }) =>
	superValidate(
		{
			givenName: input?.givenName,
			familyName: input?.familyName
		},
		valibot(ProfileSchema),
		{ id: 'profile-form' }
	);

const createEmailForm = (input?: { email?: string }, options?: { errors?: boolean }) =>
	superValidate({ email: input?.email }, valibot(EmailSchema), {
		id: 'email-form',
		errors: options?.errors
	});

/**
 * The user submitted the form but the authentication timestamp expired.
 * Something of an edge case as we validate on the client side, but could
 * happen if the delay between the client side check and the request hitting
 * the form action pushes the timestamp outside the allowable window.
 */
const authenticationRequired = (
	profileForm: Awaited<ReturnType<typeof createProfileForm>>,
	emailForm: Awaited<ReturnType<typeof createEmailForm>>,
	formToDisplayError: 'profile' | 'email',
	user: Awaited<ReturnType<typeof requireAccountContext>>['user'],
	hasPasskeys: boolean
) => {
	switch (formToDisplayError) {
		case 'profile':
			setError(profileForm, 'Confirm your passkey before saving account changes.');
			break;
		case 'email':
			setError(emailForm, 'Confirm your passkey before saving account changes.');
			break;
	}

	return fail(400, {
		profileForm,
		emailForm,
		currentEmail: user.email,
		hasPasskeys
	});
};

const getEmailStatusError = (reason: AccountEmailErrorReason | undefined) => {
	if (reason === 'taken') return 'That email address is already in use.';
	if (reason === 'expired') return 'Your email verification session expired. Start again.';
	return null;
};

/**
 * Load the account-management page.
 *
 * The loader prepares both forms, restores any status from the email-change
 * redirect flow, and exposes enough Passlock client config for any
 * browser-side passkey sync that needs to happen on the page.
 */
export const load = (async ({ locals, url }) => {
	const { user, hasPasskeys } = await requireAccountContext(locals);
	const passlockConfig = getPasslockClientConfig();

	const profileForm = await createProfileForm({
		givenName: user.givenName,
		familyName: user.familyName
	});
	const { email, emailUpdated, emailError } = getAccountQueryState(url);

	// If the user tries to verify their email after the code
	// has expired we redirect them back to the account page but
	// we pre-fill the email so they don't have to enter it again
	// see /verify-email/+server.ts#redirectToAccountWithError
	const emailForm = await createEmailForm(
		// this is the NEW email address
		{ email },
		{ errors: false }
	);

	// After the user successfully enters the email verification code
	// they are redirected back here with ?email-updated=1
	// see /verify-email/+server.ts (~ line 140)
	const emailStatusMessage = emailUpdated ? 'Email address updated.' : null;
	if (emailStatusMessage) setMessage(emailForm, emailStatusMessage);

	// If we couldn't verify the new email address
	// the user is redirected back here with a failure code
	const emailStatusError = getEmailStatusError(emailError);
	if (emailStatusError) setError(emailForm, emailStatusError);

	return {
		profileForm,
		emailForm,
		emailRateLimit: null,
		currentEmail: user.email,
		hasPasskeys,
		clearQueryState: emailUpdated || emailStatusError,
		syncPasskeysOnLoad: emailUpdated && hasPasskeys,
		...passlockConfig
	};
}) satisfies PageServerLoad;

export const actions = {
	profile: async ({ request, locals }) => {
		const { user, hasPasskeys, reauthenticationRequired } = await requireAccountContext(locals);

		const emailForm = await createEmailForm(undefined, { errors: false });
		const profileForm = await superValidate(request, valibot(ProfileSchema), {
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
			// The server enforces the same re-auth rule as the client helper.
			return authenticationRequired(profileForm, emailForm, 'profile', user, hasPasskeys);
		}

		const updatedUser = await updateUserNames(user.userId, {
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
		const { user, hasPasskeys, reauthenticationRequired } = await requireAccountContext(locals);

		const profileForm = await createProfileForm({
			givenName: user.givenName,
			familyName: user.familyName
		});

		const emailForm = await superValidate(request, valibot(EmailSchema), {
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
			// Changing the sign-in email is sensitive, so it requires a recent
			// passkey confirmation when the account has passkeys.
			return authenticationRequired(profileForm, emailForm, 'email', user, hasPasskeys);
		}

		// We do not change the email immediately. First we verify that the user
		// controls the replacement address by sending a code there.
		const result = await createOrRefreshEmailChallenge({
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
		if (result._tag === '@error/ChallengeRateLimited') {
			return fail(429, {
				profileForm,
				emailForm,
				emailRateLimit: createChallengeRateLimitView(result.retryAfterSeconds),
				currentEmail: user.email,
				hasPasskeys
			});
		}

		// The email contains the user-facing code; the cookie stores the secret.
		await sendCodeChallengeEmail({
			email: result.challenge.email,
			firstName: user.givenName,
			code: result.code,
			message: result.message
		});

		// Verification requires both the code and this secret-bearing cookie.
		setEmailChangeCookie(cookies, {
			challengeId: result.challenge.id,
			secret: result.secret
		});

		redirect(303, resolve('/account/verify-email'));
	}
} satisfies Actions;
