import type { PageServerLoad } from './$types';
import { createOrRefreshSignupChallenge } from '$lib/server/challenges.js';
import { sendCodeChallengeEmail } from '$lib/server/email.js';
import { setSignupLoginCookie } from '$lib/server/cookies.js';
import { createChallengeRateLimitView } from '$lib/server/passlock.js';
import { getSignupQueryState, toLoginLocation } from '$lib/shared/queryState.js';

import { superValidate } from 'sveltekit-superforms';
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

/**
 * Load the signup form that starts the emailed one-time-code flow for new
 * accounts.
 */
export const load = (async ({ locals, url }) => {
	if (locals.user) {
		redirect(302, '/');
	}

	const { email, reason } = getSignupQueryState(url);

	const form = await superValidate({ email }, valibot(schema), { errors: false });
	const notice =
		reason === 'no-account' ? 'No account exists for that email. Create one to continue.' : null;

	return { form, notice, rateLimit: null };
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, valibot(schema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const challengeOrError = await createOrRefreshSignupChallenge(form.data);
		if (challengeOrError._tag === '@error/DuplicateUser') {
			redirect(303, toLoginLocation({ username: form.data.email, reason: 'account-exists' }));
		}
		if (challengeOrError._tag === '@error/ChallengeRateLimited') {
			return fail(429, {
				form,
				rateLimit: createChallengeRateLimitView(challengeOrError.retryAfterSeconds)
			});
		}

		// The cookie carries the challenge id + secret; the emailed code provides
		// the second factor needed to finish signup.
		await sendCodeChallengeEmail({
			email: challengeOrError.challenge.email,
			firstName: challengeOrError.challenge.givenName ?? 'there',
			code: challengeOrError.code,
			html: challengeOrError.html
		});
		setSignupLoginCookie(cookies, {
			challengeId: challengeOrError.challenge.id,
			secret: challengeOrError.secret
		});

		redirect(303, resolve('/signup/verify-code'));
	}
};
