import type { Actions, PageServerLoad } from './$types';
import type { Cookies } from '@sveltejs/kit';

import {
	deleteSignupLoginCookie,
	getSignupLoginCookie,
	setSessionTokenCookie
} from '$lib/server/cookies.js';
import { getChallengeCodeErrorMessage } from '$lib/server/mailbox/mailboxChallenge.js';
import { getPendingChallengeContext } from '$lib/server/mailbox/pendingChallenge.js';
import {
	consumeSignupChallenge,
	getPendingSignupChallenge
} from '$lib/server/mailbox/signupChallenge.js';
import { createVerifyCodeForm, validateVerifyCodeForm } from '$lib/server/mailbox/verifyCode.js';
import { createSession } from '$lib/server/repository.js';
import { toLoginLocation } from '$lib/shared/queryState.js';
import { resolve } from '$app/paths';
import { fail, redirect } from '@sveltejs/kit';
import { setError } from 'sveltekit-superforms';

const getPendingSignupContext = (cookies: Cookies) =>
	getPendingChallengeContext({
		cookies,
		getPendingCookie: getSignupLoginCookie,
		getChallenge: getPendingSignupChallenge
	});

/**
 * Load the signup code verification page using the pending challenge
 * referenced by the cookie.
 */
export const load = (async ({ locals, cookies }) => {
	if (locals.user) redirect(302, '/');

	const pendingContext = await getPendingSignupContext(cookies);
	if (pendingContext._tag === 'MissingPendingChallenge') {
		redirect(303, resolve('/signup'));
	}
	if (pendingContext._tag === 'InvalidPendingChallenge') {
		deleteSignupLoginCookie(cookies);
		redirect(303, resolve('/signup'));
	}

	const verifyForm = await createVerifyCodeForm();

	return {
		verifyForm,
		email: pendingContext.challenge.email
	};
}) satisfies PageServerLoad;

export const actions = {
	verify: async ({ request, cookies }) => {
		const verifyForm = await validateVerifyCodeForm(request);

		if (!verifyForm.valid) return fail(400, { verifyForm });

		const pendingContext = await getPendingSignupContext(cookies);
		if (pendingContext._tag === 'MissingPendingChallenge') {
			redirect(303, resolve('/signup'));
		}
		if (pendingContext._tag === 'InvalidPendingChallenge') {
			deleteSignupLoginCookie(cookies);
			redirect(303, resolve('/signup'));
		}

		const { challenge, pending } = pendingContext;

		// The emailed code must be paired with the secret stored in the pending
		// challenge cookie.
		const result = await consumeSignupChallenge({
			challengeId: pending.challengeId,
			secret: pending.secret,
			code: verifyForm.data.code
		});

		if (result._tag === 'ChallengeConsumed') {
			deleteSignupLoginCookie(cookies);

			const { token: sessionToken } = await createSession(result.user.userId);
			setSessionTokenCookie(cookies, sessionToken);

			// New accounts land on passkey registration so the sample demonstrates
			// upgrading from email-only to passkey login.
			redirect(303, resolve('/passkeys'));
		}

		if (result._tag === '@error/DuplicateUser') {
			deleteSignupLoginCookie(cookies);
			redirect(303, toLoginLocation({ username: result.email, reason: 'account-exists' }));
		}

		if (result._tag === '@error/InvalidChallenge') {
			deleteSignupLoginCookie(cookies);
			redirect(303, resolve('/signup'));
		}

		setError(verifyForm, 'code', getChallengeCodeErrorMessage(result));
		return fail(400, { verifyForm, email: challenge.email });
	}
} satisfies Actions;
