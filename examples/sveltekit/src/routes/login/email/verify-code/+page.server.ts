import type { Actions, PageServerLoad } from './$types';

import {
	consumeLoginChallenge,
	createOrRefreshLoginChallenge,
	createSession,
	getPasskeysByUserId,
	getChallenge
} from '$lib/server/repository.js';
import { sendCodeChallengeEmail } from '$lib/server/email.js';
import {
	deleteSignupLoginCookie,
	getSignupLoginCookie,
	setSignupLoginCookie
} from '$lib/server/challenge.js';
import { setSessionTokenCookie } from '$lib/server/session.js';
import { fail, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { setError, superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import * as v from 'valibot';

const verifyCodeSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.regex(/^\d{6}$/, 'Enter the 6-digit code'))
});

const resendCodeSchema = v.object({
	intent: v.literal('resend-code')
});

const createVerifyForm = () =>
	superValidate(valibot(verifyCodeSchema), {
		id: 'verify-code-form'
	});

const createResendForm = () =>
	superValidate({ intent: 'resend-code' }, valibot(resendCodeSchema), {
		id: 'resend-code-form'
	});

const getPendingLoginContext = async (token: string | undefined, clearCookie: () => void) => {
	if (!token) redirect(303, resolve('/login'));

	const challenge = await getChallenge(token);
	if (!challenge || challenge.purpose !== 'login') {
		clearCookie();
		redirect(303, resolve('/login'));
	}

	return challenge;
};

export const load = (async ({ locals, cookies }) => {
	if (locals.user) redirect(302, '/');

	const token = getSignupLoginCookie(cookies);
	const { email } = await getPendingLoginContext(token, () => deleteSignupLoginCookie(cookies));

	const verifyForm = await createVerifyForm();
	const resendForm = await createResendForm();

	return {
		verifyForm,
		resendForm,
		email
	};
}) satisfies PageServerLoad;

export const actions = {
	verify: async ({ request, cookies }) => {
		const resendForm = await createResendForm();
		const verifyForm = await superValidate(request, valibot(verifyCodeSchema), {
			id: 'verify-code-form'
		});

		if (!verifyForm.valid) return fail(400, { verifyForm, resendForm });

		const token = getSignupLoginCookie(cookies);
		const challenge = await getPendingLoginContext(token, () => deleteSignupLoginCookie(cookies));

		const result = await consumeLoginChallenge({
			token: token!,
			code: verifyForm.data.code
		});

		if (result._tag === 'ChallengeConsumed') {
			deleteSignupLoginCookie(cookies);

			const { token: sessionToken } = await createSession(result.user.userId);
			setSessionTokenCookie(cookies, sessionToken);

			const passkeys = await getPasskeysByUserId(result.user.userId);
			const redirectTo = passkeys.length === 0 ? resolve('/passkeys') : resolve('/');
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
			return fail(400, { verifyForm, resendForm, email: challenge.email });
		}

		deleteSignupLoginCookie(cookies);
		redirect(303, resolve('/login'));
	},
	resend: async ({ request, cookies }) => {
		const resendForm = await superValidate(request, valibot(resendCodeSchema), {
			id: 'resend-code-form'
		});
		const verifyForm = await createVerifyForm();

		if (!resendForm.valid) {
			return fail(400, { verifyForm, resendForm });
		}

		const token = getSignupLoginCookie(cookies);
		const challenge = await getPendingLoginContext(token, () => deleteSignupLoginCookie(cookies));

		const result = await createOrRefreshLoginChallenge(challenge.email);
		if (result._tag === '@error/AccountNotFound') {
			deleteSignupLoginCookie(cookies);
			const email = encodeURIComponent(challenge.email);
			redirect(303, `${resolve('/signup')}?email=${email}&reason=no-account`);
		}
		if (result._tag === '@error/ChallengeRateLimited') {
			const seconds = Math.ceil(result.retryAfterMs / 1000);
			resendForm.message = `Please wait ${seconds} seconds before requesting another code.`;
			return { verifyForm, resendForm, email: challenge.email };
		}

		await sendCodeChallengeEmail({
			email: result.challenge.email,
			firstName: result.challenge.givenName ?? 'there',
			code: result.code
		});
		setSignupLoginCookie(cookies, result.token);
		resendForm.message = 'A new code has been sent';

		return { verifyForm, resendForm, email: result.challenge.email };
	}
} satisfies Actions;
