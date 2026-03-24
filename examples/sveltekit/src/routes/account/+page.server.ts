import type { Actions, PageServerLoad } from './$types';
import {
	createOrRefreshEmailChangeChallenge,
	getPasskeysByUserId,
	updateUserProfile
} from '$lib/server/repository.js';
import { sendOtcEmail } from '$lib/server/email.js';
import { setEmailChangeOtcCookie } from '$lib/server/oneTimeCode.js';
import { getPasslockClientConfig } from '$lib/server/passkeys.js';
import { isRecentPasskeyReauthentication } from '$lib/server/session.js';
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
	const returnTo = encodeURIComponent(`/account${search}`);
	redirect(303, `${resolve('/account/re-authenticate')}?returnTo=${returnTo}`);
};

const requireAccountAccess = async (
	locals: App.Locals,
	options?: { search?: string }
): Promise<{ user: NonNullable<App.Locals['user']>; hasPasskeys: boolean }> => {
	const user = locals.user;
	const session = locals.session;

	if (!user || !session) {
		redirect(302, resolve('/login'));
	}

	const passkeys = await getPasskeysByUserId(user.userId);
	const hasPasskeys = passkeys.length > 0;

	if (hasPasskeys && !isRecentPasskeyReauthentication(session.lastPasskeyVerifiedAt)) {
		redirectToAccountReauth(options?.search ?? '');
	}

	return { user, hasPasskeys };
};

const getEmailStatusError = (reason: string | null) => {
	if (reason === 'taken') return 'That email address is already in use.';
	if (reason === 'expired') return 'Your email verification session expired. Start again.';
	return null;
};

export const load = (async ({ locals, url }) => {
	const { user, hasPasskeys } = await requireAccountAccess(locals, { search: url.search });
	const passlockConfig = getPasslockClientConfig();

	const profileForm = await createProfileForm({
		givenName: user.givenName,
		familyName: user.familyName
	});
	const emailForm = await createEmailForm(
		{ email: url.searchParams.get('email') ?? '' },
		{ errors: false }
	);

	const emailUpdated = url.searchParams.get('email-updated') === '1';

	return {
		profileForm,
		emailForm,
		email: user.email,
		hasPasskeys,
		emailUpdated,
		emailStatusMessage: emailUpdated ? 'Email address updated.' : null,
		emailStatusError: getEmailStatusError(url.searchParams.get('email-error')),
		syncPasskeysOnLoad: emailUpdated && hasPasskeys,
		...passlockConfig
	};
}) satisfies PageServerLoad;

export const actions = {
	profile: async ({ request, locals }) => {
		const { user, hasPasskeys } = await requireAccountAccess(locals);
		const emailForm = await createEmailForm(undefined, { errors: false });
		const profileForm = await superValidate(request, valibot(profileSchema), {
			id: 'profile-form'
		});

		if (!profileForm.valid) {
			return fail(400, {
				profileForm,
				emailForm,
				email: user.email,
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
				email: user.email,
				hasPasskeys
			});
		}

		return message(profileForm, 'Account details updated');
	},
	email: async ({ request, locals, cookies }) => {
		const { user, hasPasskeys } = await requireAccountAccess(locals);
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
				email: user.email,
				hasPasskeys
			});
		}

		if (emailForm.data.email === user.email) {
			setError(emailForm, 'email', 'Enter a different email address.');
			return fail(400, {
				profileForm,
				emailForm,
				email: user.email,
				hasPasskeys
			});
		}

		const result = await createOrRefreshEmailChangeChallenge({
			userId: user.userId,
			email: emailForm.data.email
		});

		if (result._tag === 'AccountNotFound') {
			redirect(303, resolve('/login'));
		}

		if (result._tag === 'DuplicateUser') {
			setError(emailForm, 'email', 'That email address is already in use.');
			return fail(400, {
				profileForm,
				emailForm,
				email: user.email,
				hasPasskeys
			});
		}

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
				email: user.email,
				hasPasskeys
			});
		}

		await sendOtcEmail({
			email: result.challenge.email,
			firstName: user.givenName,
			code: result.code
		});
		setEmailChangeOtcCookie(cookies, result.token);

		redirect(303, resolve('/account/verify-email'));
	}
} satisfies Actions;
