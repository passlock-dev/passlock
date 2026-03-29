import type { Actions, PageServerLoad } from './$types';

import {
	createOrRefreshLoginChallenge,
	getUserByEmail,
	getPasskeysByUserId
} from '$lib/server/repository.js';
import { sendCodeChallengeEmail } from '$lib/server/email.js';
import { setSignupLoginCookie } from '$lib/server/challenge.js';
import {
	createChallengeRateLimitView,
	restoreChallengeRateLimitView
} from '$lib/server/passlock.js';
import {
	getLoginQueryState,
	toLoginPasskeyLocation,
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

export const load = (async ({ locals, url }) => {
	if (locals.user) {
		redirect(302, '/');
	}

	const { username, reason, retryAtMs } = getLoginQueryState(url);
	const rateLimit =
		reason === 'challenge-rate-limited'
			? restoreChallengeRateLimitView(retryAtMs ?? Number.NaN)
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
			const passkeys = await getPasskeysByUserId(account.userId);
			if (passkeys.length > 0) {
				redirect(303, toLoginPasskeyLocation({ username: form.data.username }));
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

			await sendCodeChallengeEmail({
				email: result.challenge.email,
				firstName: result.challenge.givenName ?? 'there',
				code: result.code
			});
			setSignupLoginCookie(cookies, {
				challengeId: result.challenge.id,
				token: result.token
			});

			redirect(303, '/login/email/verify-code');
		}

		redirect(303, toSignupLocation({ email: form.data.username, reason: 'no-account' }));
	}
} satisfies Actions;
