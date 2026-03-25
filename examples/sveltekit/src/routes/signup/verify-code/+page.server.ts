import type { Actions, PageServerLoad } from './$types';

import {
	consumeChallenge,
	createOrRefreshSignupChallenge,
	createSession,
	getPendingOtcChallenge
} from '$lib/server/repository.js';
import { sendOtcEmail } from '$lib/server/email.js';
import { deleteOtcCookie, getOtcCookie, setOtcCookie } from '$lib/server/oneTimeCode.js';
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

const getPendingSignupContext = async (token: string | undefined, clearCookie: () => void) => {
	if (!token) redirect(303, resolve('/signup'));

	const challenge = await getPendingOtcChallenge(token);
	if (!challenge || challenge.purpose !== 'signup') {
		clearCookie();
		redirect(303, resolve('/signup'));
	}

	return challenge;
};

export const load = (async ({ locals, cookies }) => {
	if (locals.user) redirect(302, '/');

	const token = getOtcCookie(cookies);
	const { email } = await getPendingSignupContext(token, () => deleteOtcCookie(cookies));

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

		const token = getOtcCookie(cookies);
		const challenge = await getPendingSignupContext(token, () => deleteOtcCookie(cookies));

		const result = await consumeChallenge({
			token: token!,
			code: verifyForm.data.code,
			purpose: 'signup'
		});

		if (result._tag === 'ChallengeConsumed') {
			deleteOtcCookie(cookies);

			const { token: sessionToken } = await createSession(result.user.userId);
			setSessionTokenCookie(cookies, sessionToken);

			redirect(303, resolve('/passkeys'));
		}

		if (result._tag === '@error/DuplicateUser') {
			deleteOtcCookie(cookies);
			const username = encodeURIComponent(result.email);
			redirect(303, `${resolve('/login')}?username=${username}&reason=account-exists`);
		}

		if (result.code === 'CHALLENGE_EXPIRED' || result.code === 'PURPOSE_MISMATCH') {
			deleteOtcCookie(cookies);
			redirect(303, resolve('/signup'));
		}

		if (result.code === 'ACCOUNT_NOT_FOUND') {
			deleteOtcCookie(cookies);
			redirect(303, resolve('/signup'));
		}

		const message =
			result.code === 'CODE_EXPIRED'
				? 'This code has expired. Request a new one.'
				: result.code === 'TOO_MANY_ATTEMPTS'
					? 'Too many incorrect attempts. Request a new code.'
					: 'Invalid code';

		setError(verifyForm, 'code', message);
		return fail(400, { verifyForm, resendForm, email: challenge.email });
	},
	resend: async ({ request, cookies }) => {
		const resendForm = await superValidate(request, valibot(resendCodeSchema), {
			id: 'resend-code-form'
		});
		const verifyForm = await createVerifyForm();

		if (!resendForm.valid) {
			return fail(400, { verifyForm, resendForm });
		}

		const token = getOtcCookie(cookies);
		const challenge = await getPendingSignupContext(token, () => deleteOtcCookie(cookies));

		const result = await createOrRefreshSignupChallenge({
			email: challenge.email,
			givenName: challenge.givenName ?? '',
			familyName: challenge.familyName ?? ''
		});
		if (result._tag === '@error/DuplicateUser') {
			deleteOtcCookie(cookies);
			const username = encodeURIComponent(result.email);
			redirect(303, `${resolve('/login')}?username=${username}&reason=account-exists`);
		}
		if (result._tag === '@error/ChallengeRateLimited') {
			const seconds = Math.ceil(result.retryAfterMs / 1000);
			resendForm.message = `Please wait ${seconds} seconds before requesting another code.`;
			return { verifyForm, resendForm, email: challenge.email };
		}

		await sendOtcEmail({
			email: result.challenge.email,
			firstName: result.challenge.givenName ?? 'there',
			code: result.code
		});
		setOtcCookie(cookies, result.token);
		resendForm.message = 'A new code has been sent';

		return { verifyForm, resendForm, email: result.challenge.email };
	}
} satisfies Actions;
