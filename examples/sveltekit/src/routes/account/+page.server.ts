import type { Actions, PageServerLoad } from './$types';
import {
	upsertEmailChallenge,
	getPasskeysByUserId,
	updateUserProfile
} from '$lib/server/repository.js';
import { sendOtcEmail } from '$lib/server/email.js';
import { setEmailChangeOtcCookie } from '$lib/server/oneTimeCode.js';
import { getPasslockClientConfig } from '$lib/server/passkeys.js';
import { isRecentAuthentication } from '$lib/server/session.js';
import { resolve } from '$app/paths';
import { fail, redirect } from '@sveltejs/kit';
import { message, setError, superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import * as v from 'valibot';

const profileSchema = v.object({
	givenName: v.pipe(v.string(), v.trim(), v.nonEmpty('First name is required')),
	familyName: v.pipe(v.string(), v.trim(), v.nonEmpty('Last name is required'))
});

const emailSchema = v.object({
	email: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty('Email is required'),
		v.email('Enter a valid email address')
	)
});

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

const redirectToAccountReauth = (search = '') => {
	// so we know where to send the user after they have re-authenticated
  const returnTo = encodeURIComponent(`/account${search}`);
	redirect(303, `${resolve('/account/re-authenticate')}?returnTo=${returnTo}`);
};

/**
 * Ensure the user re-authenticated within the last 10 minutes,
 * if not redirect to the /re-authenticate route.
 * 
 * Note: Re-authentication only occurs if the user has one or more
 * passkeys registered to their account.
 * 
 * @param locals 
 * @param options 
 * @returns 
 */
const getAuthenticatedUser = async (
	locals: App.Locals,
	options?: { state?: string }
): Promise<{ user: NonNullable<App.Locals['user']>; hasPasskeys: boolean }> => {
	const user = locals.user;
	const session = locals.session;

	if (!user || !session) {
		redirect(302, resolve('/login'));
	}

	const passkeys = await getPasskeysByUserId(user.userId);
	const hasPasskeys = passkeys.length > 0;

	if (hasPasskeys && !isRecentAuthentication(session.lastAuthenticatedAt)) {
		redirectToAccountReauth(options?.state ?? '');
	}

	return { user, hasPasskeys };
};

const getEmailStatusError = (reason: string | null) => {
	if (reason === 'taken') return 'That email address is already in use.';
	if (reason === 'expired') return 'Your email verification session expired. Start again.';
	return null;
};

export const load = (async ({ locals, url }) => {
	const { user, hasPasskeys } = await getAuthenticatedUser(locals, { state: url.search });
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
		{ email: url.searchParams.get('email') ?? undefined},
		{ errors: false }
	);

  // after the user successfully enters the email verification code
  // they are redirected back here with ?email-updated=1
  // see /verify-email/+server.ts#redirectToAccountWithError
	const emailUpdated = url.searchParams.get('email-updated') === '1';
  const emailStatusMessage = emailUpdated ? 'Email address updated.' : null;

  // if we couldn't verify the new email address 
  // the user is redirected back here with a failure code
  const emailVerificationError = url.searchParams.get('email-error');
  const emailStatusError = getEmailStatusError(emailVerificationError);

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
		const { user, hasPasskeys } = await getAuthenticatedUser(locals);
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
		const { user, hasPasskeys } = await getAuthenticatedUser(locals);

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
		if (result._tag === 'AccountNotFound') {
			redirect(303, resolve('/login'));
		}

		if (result._tag === 'DuplicateUser') {
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
		if (result._tag === 'ChallengeRateLimited') {
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
