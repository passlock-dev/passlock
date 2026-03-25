import type { Actions, PageServerLoad } from './$types';
import {
	consumeEmailChangeChallenge as verifyChangeEmailChallenge,
	upsertEmailChallenge,
	getPasskeysByUserId,
	getPendingOtcChallenge
} from '$lib/server/repository.js';
import { sendEmailUpdated, sendOtcEmail } from '$lib/server/email.js';
import {
	deleteEmailChangeOtcCookie,
	getEmailChangeOtcCookie,
	setEmailChangeOtcCookie
} from '$lib/server/oneTimeCode.js';
import { resolve } from '$app/paths';
import { fail, redirect } from '@sveltejs/kit';
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

/**
 * Redirect the user back to the account page but set a couple
 * of query params which read by the load function.
 *
 * @param reason
 * @param email
 */
const redirectToAccountWithError = (reason: 'expired' | 'taken', email?: string): never => {
	const params = new URLSearchParams({ 'email-error': reason });
	if (email) params.set('email', email);
  redirect(303, `${resolve('/account')}?${params.toString()}`);
};

/**
 * Fetch the challenge (including code) 
 * associated with this change email request
 * 
 * @param token 
 * @param userId 
 * @param clearCookie 
 * @returns 
 */
const getChangeEmailChallenge = async (
	token: string | undefined,
	userId: number,
	clearCookie: () => void
) => {
	if (!token) redirect(303, resolve('/account'));

	const challenge = await getPendingOtcChallenge(token);
	if (
		!challenge ||
		challenge.purpose !== 'email-change' ||
		challenge.userId !== userId
	) {
		clearCookie();
		redirect(303, resolve('/account'));
	}

	return challenge;
};

export const load = (async ({ locals, cookies }) => {
	if (!locals.user) redirect(302, resolve('/login'));

	// the token allows us to display the email address in question
	// before the user has entered the code
	const token = getEmailChangeOtcCookie(cookies);
	const { email } = await getChangeEmailChallenge(token, locals.user.userId, () =>
		deleteEmailChangeOtcCookie(cookies)
	);

	const verifyForm = await createVerifyForm();
	const resendForm = await createResendForm();

	return {
		verifyForm,
		resendForm,
		email
	};
}) satisfies PageServerLoad;

export const actions = {
	verify: async ({ request, locals, cookies }) => {
		if (!locals.user) redirect(302, resolve('/login'));

		const user = locals.user;

		const resendForm = await createResendForm();
		const verifyForm = await superValidate(request, valibot(verifyCodeSchema), {
			id: 'verify-code-form'
		});

		if (!verifyForm.valid) return fail(400, { verifyForm, resendForm });

		// supplying the code is not enough, the user must also
		// present the token (stored as a cookie)
		const token = getEmailChangeOtcCookie(cookies);
		const challenge = await getChangeEmailChallenge(token, user.userId, () =>
			deleteEmailChangeOtcCookie(cookies)
		);

		const result = await verifyChangeEmailChallenge({
			token: token!,
			code: verifyForm.data.code,
			userId: user.userId
		});

		if (result._tag === 'EmailChangeSuccess') {
			deleteEmailChangeOtcCookie(cookies);

			// send an email to the old address telling
			// them that the email was changed.
			await sendEmailUpdated({
				email: result.oldEmail,
				firstName: result.user.givenName
			});

			// ?email-updated=1 will do two things:
			// 1) display a confirmation message
			// 2) trigger a client side passkey update/refresh to align
			//    the passkeys in the user's passkey manager with the
			//    updated email/username
			redirect(303, `${resolve('/account')}?email-updated=1`);
		}

		if (result._tag === '@error/DuplicateUser') {
			deleteEmailChangeOtcCookie(cookies);
			redirectToAccountWithError('taken', challenge.email);
		}

		if (result._tag !== '@error/ChallengeVerificationError') {
			throw new Error('Unexpected email change verification result');
		}

		const error = result;
		if (
			error.code === 'CHALLENGE_EXPIRED' ||
			error.code === 'ACCOUNT_NOT_FOUND' ||
			error.code === 'PURPOSE_MISMATCH' ||
			error.code === 'UNAUTHORIZED'
		) {
			deleteEmailChangeOtcCookie(cookies);
			redirectToAccountWithError('expired', challenge.email);
		}

		const message =
			error.code === 'CODE_EXPIRED'
				? 'This code has expired. Request a new one.'
				: error.code === 'TOO_MANY_ATTEMPTS'
					? 'Too many incorrect attempts. Request a new code.'
					: 'Invalid code';

		setError(verifyForm, 'code', message);

		return fail(400, { verifyForm, resendForm, email: challenge.email });
	},
	resend: async ({ request, locals, cookies }) => {
		if (!locals.user) redirect(302, resolve('/login'));
		const user = locals.user;

		const resendForm = await superValidate(request, valibot(resendCodeSchema), {
			id: 'resend-code-form'
		});

		const verifyForm = await createVerifyForm();

		if (!resendForm.valid) return fail(400, { verifyForm, resendForm });

		const token = getEmailChangeOtcCookie(cookies);
		const challenge = await getChangeEmailChallenge(token, user.userId, () =>
			deleteEmailChangeOtcCookie(cookies)
		);

		const result = await upsertEmailChallenge({
			userId: user.userId,
			email: challenge.email
		});

		if (result._tag === '@error/AccountNotFound') {
			deleteEmailChangeOtcCookie(cookies);
			redirect(303, resolve('/login'));
		}

		if (result._tag === '@error/DuplicateUser') {
			deleteEmailChangeOtcCookie(cookies);
			redirectToAccountWithError('taken', challenge.email);
		}

		if (result._tag === '@error/ChallengeRateLimited') {
			const seconds = Math.ceil(result.retryAfterMs / 1000);
			resendForm.message = `Please wait ${seconds} seconds before requesting another code.`;
			return { verifyForm, resendForm, email: challenge.email };
		}

		if (result._tag !== 'CreatedOtcChallenge') {
			throw new Error('Unexpected email change challenge result');
		}

		await sendOtcEmail({
			email: result.challenge.email,
			firstName: user.givenName,
			code: result.code
		});
		setEmailChangeOtcCookie(cookies, result.token);
		resendForm.message = 'A new code has been sent';

		return { verifyForm, resendForm, email: result.challenge.email };
	}
} satisfies Actions;
