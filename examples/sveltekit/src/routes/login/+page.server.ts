import type { Actions, PageServerLoad } from './$types';

import { createChallengeRateLimitView } from '$lib/server/mailbox/mailboxChallenge.js';
import { createOrRefreshLoginChallenge } from '$lib/server/mailbox/loginChallenge.js';
import { getUserByEmail, countPasskeysByUserId } from '$lib/server/repository.js';
import { sendMailboxVerificationEmail } from '$lib/server/email';
import { setSignupLoginCookie } from '$lib/server/cookies.js';
import {
	getLoginQueryState,
	toLoginPasskeyLocation as toPasskeyLogin,
	toSignupLocation
} from '$lib/shared/queryState.js';
import type { LoginFormMessage } from '$lib/shared/challengeRateLimit.js';
import { message, setMessage, superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';

const schema = v.object({
	email: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty('Email is required'),
		v.email('Enter a valid email address')
	)
});

type LoginFormData = v.InferOutput<typeof schema>;

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

	const { username: email, reason, retryAfterSeconds } = getLoginQueryState(url);

	const form = await superValidate<LoginFormData, LoginFormMessage>({ email }, valibot(schema), {
		errors: false
	});

	if (reason === 'challenge-rate-limited') {
		setMessage(form, {
			type: 'rateLimited',
			rateLimit: createChallengeRateLimitView(retryAfterSeconds ?? Number.NaN)
		});
	} else if (reason === 'account-exists') {
		setMessage(form, {
			type: 'notice',
			text: 'An account already exists for that email. Login to continue.'
		});
	}

	return { form };
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate<LoginFormData, LoginFormMessage>(request, valibot(schema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const account = await getUserByEmail(form.data.email);
		if (account) {
			// If we already know the account has passkeys, skip directly to the
			// passkey prompt so the user does not wait for an email code.
			const passkeyCount = await countPasskeysByUserId(account.userId);
			if (passkeyCount > 0) {
				redirect(303, toPasskeyLogin({ username: form.data.email }));
			}

			const result = await createOrRefreshLoginChallenge(account.email);
			if (result._tag === '@error/AccountNotFound') {
				redirect(303, toSignupLocation({ email: form.data.email, reason: 'no-account' }));
			}
			if (result._tag === '@error/ChallengeRateLimited') {
				return message(
					form,
					{
						type: 'rateLimited',
						rateLimit: createChallengeRateLimitView(result.retryAfterSeconds)
					},
					{ status: 429 }
				);
			}

			// The cookie stores the challenge id + secret; the email contains the
			// code, so both are required to finish the flow.
			await sendMailboxVerificationEmail({
				subject: 'Your login code',
				recipientEmail: result.challenge.email,
				body: result.message,
				code: result.code
			});
			setSignupLoginCookie(cookies, {
				challengeId: result.challenge.id,
				secret: result.secret
			});

			redirect(303, '/login/email/verify-code');
		}

		redirect(303, toSignupLocation({ email: form.data.email, reason: 'no-account' }));
	}
} satisfies Actions;
