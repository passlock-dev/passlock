import type { Actions, PageServerLoad } from './$types';

import { consumeLoginChallenge } from '$lib/server/challenges.js';
import { countPasskeysByUserId, createSession } from '$lib/server/repository.js';
import { deleteSignupLoginCookie, setSessionTokenCookie } from '$lib/server/cookies.js';
import { fail, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { setError, superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import * as v from 'valibot';
import { getPendingLoginChallengeContext } from './challenge.js';

const verifyCodeSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.regex(/^\d{6}$/, 'Enter the 6-digit code'))
});

const createVerifyForm = () =>
	superValidate(valibot(verifyCodeSchema), {
		id: 'verify-code-form'
	});

/**
 * Load the login code verification page using the pending challenge referenced
 * by the cookie.
 */
export const load = (async ({ locals, cookies }) => {
	if (locals.user) redirect(302, '/');

	const pendingContext = await getPendingLoginChallengeContext(cookies);
	if (pendingContext._tag === 'MissingPendingLoginChallenge') {
		redirect(303, resolve('/login'));
	}
	if (pendingContext._tag === 'InvalidPendingLoginChallenge') {
		deleteSignupLoginCookie(cookies);
		redirect(303, resolve('/login'));
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

		const pendingContext = await getPendingLoginChallengeContext(cookies);
		if (pendingContext._tag === 'MissingPendingLoginChallenge') {
			redirect(303, resolve('/login'));
		}
		if (pendingContext._tag === 'InvalidPendingLoginChallenge') {
			deleteSignupLoginCookie(cookies);
			redirect(303, resolve('/login'));
		}

		const { challenge, pending } = pendingContext;

		// The user-supplied code is not enough on its own. The browser must also
		// present the stored challenge secret from the HTTP-only cookie.
		const result = await consumeLoginChallenge({
			challengeId: pending.challengeId,
			secret: pending.secret,
			code: verifyForm.data.code
		});

		if (result._tag === 'ChallengeConsumed') {
			deleteSignupLoginCookie(cookies);

			const { token: sessionToken } = await createSession(result.user.userId);
			setSessionTokenCookie(cookies, sessionToken);

			// First-time email-only users are nudged to register a passkey after
			// login; existing passkey users go straight to the app.
			const passkeysCount = await countPasskeysByUserId(result.user.userId);
			const redirectTo = passkeysCount === 0 ? resolve('/passkeys') : resolve('/');
			redirect(303, redirectTo);
		}

		if (result._tag === '@error/ChallengeVerificationError') {
			if (
				result.code === 'CHALLENGE_EXPIRED' ||
				result.code === 'ACCOUNT_NOT_FOUND' ||
				result.code === 'PURPOSE_MISMATCH'
			) {
				deleteSignupLoginCookie(cookies);
				redirect(303, resolve('/login'));
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

		deleteSignupLoginCookie(cookies);
		redirect(303, resolve('/login'));
	}
} satisfies Actions;
