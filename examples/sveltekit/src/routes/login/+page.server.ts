import type { Actions, PageServerLoad } from './$types';

import { createChallengeRateLimitView } from '$lib/server/mailbox/mailboxChallenge.js';
import { createOrRefreshLoginChallenge } from '$lib/server/mailbox/loginChallenge.js';
import { getUserByEmail, countPasskeysByUserId } from '$lib/server/repository.js';
import { sendCodeChallengeEmail } from '$lib/server/email.js';
import { setSignupLoginCookie } from '$lib/server/cookies.js';
import {
	getLoginQueryState,
	toLoginPasskeyLocation as toPasskeyLogin,
	toSignupLocation
} from '$lib/shared/queryState.js';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';

const schema = v.object({
	username: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty('Email is required'),
		v.email('Enter a valid email address')
	)
});

/**
 * Load the first-step login form.
 *
 * This route identifies which authentication path to take for the supplied
 * email address: passkey-first when the account already has passkeys, or
 * emailed one-time code otherwise.
 */
export const load = (async ({ locals, url }) => {
	if (locals.user) {
		redirect(302, '/');
	}

	const { username, reason, retryAfterSeconds } = getLoginQueryState(url);
	const rateLimit =
		reason === 'challenge-rate-limited'
			? createChallengeRateLimitView(retryAfterSeconds ?? Number.NaN)
			: null;

	const form = await superValidate({ username }, valibot(schema), { errors: false });

	const notice =
		reason === 'account-exists'
			? 'An account already exists for that email. Login to continue.'
			: null;

	return { form, notice, rateLimit };
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, valibot(schema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const account = await getUserByEmail(form.data.username);
		if (account) {
			// If we already know the account has passkeys, skip directly to the
			// passkey prompt so the user does not wait for an email code.
			const passkeyCount = await countPasskeysByUserId(account.userId);
			if (passkeyCount > 0) {
				redirect(303, toPasskeyLogin({ username: form.data.username }));
			}

			const result = await createOrRefreshLoginChallenge(account.email);
			if (result._tag === '@error/AccountNotFound') {
				redirect(303, toSignupLocation({ email: form.data.username, reason: 'no-account' }));
			}
			if (result._tag === '@error/ChallengeRateLimited') {
				return fail(429, {
					form,
					rateLimit: createChallengeRateLimitView(result.retryAfterSeconds)
				});
			}

			// The cookie stores the challenge id + secret; the email contains the
			// code, so both are required to finish the flow.
			await sendCodeChallengeEmail({
				email: result.challenge.email,
				firstName: result.challenge.givenName ?? 'there',
				code: result.code,
				message: result.message
			});
			setSignupLoginCookie(cookies, {
				challengeId: result.challenge.id,
				secret: result.secret
			});

			redirect(303, '/login/email/verify-code');
		}

		redirect(303, toSignupLocation({ email: form.data.username, reason: 'no-account' }));
	}
} satisfies Actions;
