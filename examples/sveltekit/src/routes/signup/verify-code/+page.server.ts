import type { Actions, PageServerLoad } from './$types';

import { consumeSignupChallenge } from '$lib/server/mailboxChallenge.js';
import { createSession } from '$lib/server/repository.js';
import { deleteSignupLoginCookie, setSessionTokenCookie } from '$lib/server/cookies.js';
import { fail, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { toLoginLocation } from '$lib/shared/queryState.js';
import { setError, superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import * as v from 'valibot';
import { getPendingSignupChallengeContext } from './challenge.js';

const verifyCodeSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.regex(/^\d{6}$/, 'Enter the 6-digit code'))
});

const createVerifyForm = () =>
	superValidate(valibot(verifyCodeSchema), {
		id: 'verify-code-form'
	});

/**
 * Load the signup code verification page using the pending challenge
 * referenced by the cookie.
 */
export const load = (async ({ locals, cookies }) => {
	if (locals.user) redirect(302, '/');

	const pendingContext = await getPendingSignupChallengeContext(cookies);
	if (pendingContext._tag === 'MissingPendingSignupChallenge') {
		redirect(303, resolve('/signup'));
	}
	if (pendingContext._tag === 'InvalidPendingSignupChallenge') {
		deleteSignupLoginCookie(cookies);
		redirect(303, resolve('/signup'));
	}

	const verifyForm = await createVerifyForm();

	return {
		verifyForm,
		email: pendingContext.challenge.email
	};
}) satisfies PageServerLoad;

export const actions = {
	verify: async ({ request, cookies }) => {
		const verifyForm = await superValidate(request, valibot(verifyCodeSchema), {
			id: 'verify-code-form'
		});

		if (!verifyForm.valid) return fail(400, { verifyForm });

		const pendingContext = await getPendingSignupChallengeContext(cookies);
		if (pendingContext._tag === 'MissingPendingSignupChallenge') {
			redirect(303, resolve('/signup'));
		}
		if (pendingContext._tag === 'InvalidPendingSignupChallenge') {
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

		if (result.code === 'CHALLENGE_EXPIRED' || result.code === 'PURPOSE_MISMATCH') {
			deleteSignupLoginCookie(cookies);
			redirect(303, resolve('/signup'));
		}

		if (result.code === 'ACCOUNT_NOT_FOUND') {
			deleteSignupLoginCookie(cookies);
			redirect(303, resolve('/signup'));
		}

		const message =
			result.code === 'CODE_EXPIRED'
				? 'This code has expired. Request a new one.'
				: result.code === 'TOO_MANY_ATTEMPTS'
					? 'Too many incorrect attempts. Request a new code.'
					: 'Invalid code';

		setError(verifyForm, 'code', message);
		return fail(400, { verifyForm, email: challenge.email });
	}
} satisfies Actions;
