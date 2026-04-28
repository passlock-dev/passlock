import type { PageServerLoad } from './$types';
import { createChallengeRateLimitView } from '$lib/server/mailbox/mailboxChallenge.js';
import { createOrRefreshSignupChallenge } from '$lib/server/mailbox/signupChallenge.js';
import { sendMailboxVerificationEmail } from '$lib/server/email/index.js';
import { setSignupLoginCookie } from '$lib/server/cookies.js';
import { getSignupQueryState, toLoginLocation } from '$lib/shared/queryState.js';
import type { SignupFormMessage } from '$lib/shared/challengeRateLimit.js';

import { message, setMessage, superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { resolve } from '$app/paths';

const schema = v.object({
	email: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty('Email is required'),
		v.email('Enter a valid email address')
	),
	givenName: v.pipe(v.string(), v.trim(), v.nonEmpty('First name is required')),
	familyName: v.pipe(v.string(), v.trim(), v.nonEmpty('Last name is required'))
});

type SignupFormData = v.InferOutput<typeof schema>;

/**
 * Load the signup form that starts the emailed one-time-code flow for new
 * accounts.
 */
export const load = (async ({ locals, url }) => {
	if (locals.user) {
		redirect(302, '/');
	}

	const { email, reason } = getSignupQueryState(url);

	const form = await superValidate<SignupFormData, SignupFormMessage>({ email }, valibot(schema), {
		errors: false
	});

	if (reason === 'no-account') {
		setMessage(form, {
			type: 'notice',
			text: 'No account exists for that email. Create one to continue.'
		});
	}

	return { form };
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate<SignupFormData, SignupFormMessage>(request, valibot(schema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const result = await createOrRefreshSignupChallenge(form.data);
		if (result._tag === '@error/DuplicateUser') {
			redirect(303, toLoginLocation({ username: form.data.email, reason: 'account-exists' }));
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

		// The cookie carries the challenge id + secret; the emailed code provides
		// the second factor needed to finish signup.
		await sendMailboxVerificationEmail({
			subject: 'Your signup code',
			recipientEmail: result.challenge.email,
			body: result.message,
			code: result.code
		});
		setSignupLoginCookie(cookies, {
			challengeId: result.challenge.id,
			secret: result.secret
		});

		redirect(303, resolve('/signup/verify-code'));
	}
};
