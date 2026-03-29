import type { Actions, PageServerLoad } from './$types';
import { consumeEmailChallenge as verifyChangeEmailChallenge } from '$lib/server/repository.js';
import { sendEmailUpdated } from '$lib/server/email.js';
import { deleteEmailChangeCookie } from '$lib/server/challenge.js';
import { resolve } from '$app/paths';
import { fail, redirect } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import * as v from 'valibot';
import { toAccountLocation } from '$lib/shared/queryState.js';
import {
	getAccountEmailErrorLocation,
	getPendingEmailChangeChallengeContext
} from './challenge.js';

const verifyCodeSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.regex(/^\d{6}$/, 'Enter the 6-digit code'))
});

const createVerifyForm = () =>
	superValidate(valibot(verifyCodeSchema), {
		id: 'verify-code-form'
	});

export const load = (async ({ locals, cookies }) => {
	if (!locals.user) redirect(302, resolve('/login'));

	// the token allows us to display the email address in question
	// before the user has entered the code
	const pendingContext = await getPendingEmailChangeChallengeContext(cookies, locals.user.userId);
	if (pendingContext._tag === 'MissingPendingEmailChangeChallenge') {
		redirect(303, resolve('/account'));
	}
	if (pendingContext._tag === 'InvalidPendingEmailChangeChallenge') {
		deleteEmailChangeCookie(cookies);
		redirect(303, resolve('/account'));
	}

	const verifyForm = await createVerifyForm();

	return {
		verifyForm,
		email: pendingContext.challenge.email
	};
}) satisfies PageServerLoad;

export const actions = {
	verify: async ({ request, locals, cookies }) => {
		if (!locals.user) redirect(302, resolve('/login'));

		const user = locals.user;

		const verifyForm = await superValidate(request, valibot(verifyCodeSchema), {
			id: 'verify-code-form'
		});

		if (!verifyForm.valid) return fail(400, { verifyForm });

		// supplying the code is not enough, the user must also
		// present the token (stored as a cookie)
		const pendingContext = await getPendingEmailChangeChallengeContext(cookies, user.userId);
		if (pendingContext._tag === 'MissingPendingEmailChangeChallenge') {
			redirect(303, resolve('/account'));
		}
		if (pendingContext._tag === 'InvalidPendingEmailChangeChallenge') {
			deleteEmailChangeCookie(cookies);
			redirect(303, resolve('/account'));
		}

		const { challenge, pending } = pendingContext;

		const result = await verifyChangeEmailChallenge({
			challengeId: pending.challengeId,
			token: pending.token,
			code: verifyForm.data.code,
			userId: user.userId
		});

		if (result._tag === 'EmailChangeSuccess') {
			deleteEmailChangeCookie(cookies);

			// send an email to the old address telling
			// them that the email was changed.
			await sendEmailUpdated({
				email: result.oldEmail,
				firstName: result.user.givenName
			});

			// ?email-updated=1 will do two things:
			// 1) display a confirmation message
			// 2) trigger a client side passkey update/refresh to align
			//    the passkeys in the user's passkey manager with the
			//    updated email/username
			redirect(303, toAccountLocation({ emailUpdated: true }));
		}

		if (result._tag === '@error/DuplicateUser') {
			deleteEmailChangeCookie(cookies);
			redirect(303, getAccountEmailErrorLocation('taken', challenge.email));
		}

		if (result._tag !== '@error/ChallengeVerificationError') {
			throw new Error('Unexpected email change verification result');
		}

		const error = result;
		if (
			error.code === 'CHALLENGE_EXPIRED' ||
			error.code === 'ACCOUNT_NOT_FOUND' ||
			error.code === 'PURPOSE_MISMATCH' ||
			error.code === 'UNAUTHORIZED'
		) {
			deleteEmailChangeCookie(cookies);
			redirect(303, getAccountEmailErrorLocation('expired', challenge.email));
		}

		const message =
			error.code === 'CODE_EXPIRED'
				? 'This code has expired. Request a new one.'
				: error.code === 'TOO_MANY_ATTEMPTS'
					? 'Too many incorrect attempts. Request a new code.'
					: 'Invalid code';

		setError(verifyForm, 'code', message);

		return fail(400, { verifyForm, email: challenge.email });
	}
} satisfies Actions;
