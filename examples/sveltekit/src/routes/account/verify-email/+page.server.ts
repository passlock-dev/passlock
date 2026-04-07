import type { Actions, PageServerLoad } from './$types';
import type { Cookies } from '@sveltejs/kit';
import {
	consumeEmailChallenge as verifyChangeEmailChallenge,
	getPendingEmailChallenge
} from '$lib/server/mailbox/emailChange.js';
import { sendEmailUpdated } from '$lib/server/email.js';
import { deleteEmailChangeCookie, getEmailChangeCookie } from '$lib/server/cookies.js';
import { getChallengeCodeErrorMessage } from '$lib/server/mailbox/mailboxChallenge.js';
import { getPendingChallengeContext } from '$lib/server/mailbox/pendingChallenge.js';
import { createVerifyCodeForm, validateVerifyCodeForm } from '$lib/server/mailbox/verifyCode.js';
import { resolve } from '$app/paths';
import { fail, redirect } from '@sveltejs/kit';
import { setError } from 'sveltekit-superforms';
import { toAccountLocation } from '$lib/shared/queryState.js';
import { getAccountEmailErrorLocation } from './challenge.js';

const getPendingEmailChangeContext = (cookies: Cookies, userId: number) =>
	getPendingChallengeContext({
		cookies,
		getPendingCookie: getEmailChangeCookie,
		getChallenge: getPendingEmailChallenge,
		validateChallenge: (challenge) => challenge.userId === userId
	});

/**
 * Load the email-change verification page using the pending challenge cookie.
 */
export const load = (async ({ locals, cookies }) => {
	if (!locals.user) redirect(302, resolve('/login'));

	// The pending challenge cookie lets the page show which address is being
	// verified before the user has entered the code.
	const pendingContext = await getPendingEmailChangeContext(cookies, locals.user.userId);
	if (pendingContext._tag === 'MissingPendingChallenge') {
		redirect(303, toAccountLocation({ emailError: 'expired' }));
	}
	if (pendingContext._tag === 'InvalidPendingChallenge') {
		deleteEmailChangeCookie(cookies);
		redirect(303, toAccountLocation({ emailError: 'expired' }));
	}

	const verifyForm = await createVerifyCodeForm();

	return {
		verifyForm,
		email: pendingContext.challenge.email
	};
}) satisfies PageServerLoad;

export const actions = {
	verify: async ({ request, locals, cookies }) => {
		if (!locals.user) redirect(302, resolve('/login'));

		const user = locals.user;

		const verifyForm = await validateVerifyCodeForm(request);

		if (!verifyForm.valid) return fail(400, { verifyForm });

		// Supplying the code is not enough; the browser must also present the
		// stored challenge secret from the cookie.
		const pendingContext = await getPendingEmailChangeContext(cookies, user.userId);
		if (pendingContext._tag === 'MissingPendingChallenge') {
			redirect(303, toAccountLocation({ emailError: 'expired' }));
		}
		if (pendingContext._tag === 'InvalidPendingChallenge') {
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

		setError(verifyForm, 'code', getChallengeCodeErrorMessage(result));

		return fail(400, { verifyForm, email: challenge.email });
	}
} satisfies Actions;
