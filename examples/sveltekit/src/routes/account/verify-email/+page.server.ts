import type { Actions, PageServerLoad } from './$types';
import { consumeEmailChallenge as verifyChangeEmailChallenge } from '$lib/server/mailbox/emailChange.js';
import { sendEmailUpdated } from '$lib/server/email.js';
import { deleteEmailChangeCookie } from '$lib/server/cookies.js';
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

/**
 * Load the email-change verification page using the pending challenge cookie.
 */
export const load = (async ({ locals, cookies }) => {
	if (!locals.user) redirect(302, resolve('/login'));

	// The pending challenge cookie lets the page show which address is being
	// verified before the user has entered the code.
	const pendingContext = await getPendingEmailChangeChallengeContext(cookies, locals.user.userId);
	if (pendingContext._tag === 'MissingPendingEmailChangeChallenge') {
		redirect(303, toAccountLocation({ emailError: 'expired' }));
	}
	if (pendingContext._tag === 'InvalidPendingEmailChangeChallenge') {
		deleteEmailChangeCookie(cookies);
		redirect(303, toAccountLocation({ emailError: 'expired' }));
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

		// Supplying the code is not enough; the browser must also present the
		// stored challenge secret from the cookie.
		const pendingContext = await getPendingEmailChangeChallengeContext(cookies, user.userId);
		if (pendingContext._tag === 'MissingPendingEmailChangeChallenge') {
			redirect(303, toAccountLocation({ emailError: 'expired' }));
		}
		if (pendingContext._tag === 'InvalidPendingEmailChangeChallenge') {
			deleteEmailChangeCookie(cookies);
			redirect(303, toAccountLocation({ emailError: 'expired' }));
		}

		const { challenge, pending } = pendingContext;

		const result = await verifyChangeEmailChallenge({
			challengeId: pending.challengeId,
			secret: pending.secret,
			code: verifyForm.data.code,
			userId: user.userId
		});

		if (result._tag === 'EmailChangeSuccess') {
			deleteEmailChangeCookie(cookies);

			// Notify the old address in case the change was unexpected.
			await sendEmailUpdated({
				email: result.oldEmail,
				firstName: result.user.givenName
			});

			// The account page uses this query state to show a success message and
			// trigger a browser-side passkey metadata sync.
			redirect(303, toAccountLocation({ emailUpdated: true }));
		}

		if (result._tag === '@error/DuplicateUser') {
			deleteEmailChangeCookie(cookies);
			redirect(303, getAccountEmailErrorLocation('taken', challenge.email));
		}

		if (result._tag === '@error/InvalidChallenge') {
			deleteEmailChangeCookie(cookies);
			redirect(303, getAccountEmailErrorLocation('expired', challenge.email));
		}

		const message =
			result._tag === '@error/ChallengeExpired'
				? 'This code has expired. Request a new one.'
				: result._tag === '@error/ChallengeAttemptsExceeded'
					? 'Too many incorrect attempts. Request a new code.'
					: 'Invalid code';

		setError(verifyForm, 'code', message);

		return fail(400, { verifyForm, email: challenge.email });
	}
} satisfies Actions;
