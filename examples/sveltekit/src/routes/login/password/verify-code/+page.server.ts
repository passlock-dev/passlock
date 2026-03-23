import type { Actions, PageServerLoad } from './$types';

import {
	createOtcChallenge,
	createSession,
	deletePasswordLoginChallengesByUserId,
	getActivePasswordLoginChallengesByUserId,
	getPasskeysByUserId,
	getPendingOtcContext
} from '$lib/server/repository.js';
import { sendOtcEmail } from '$lib/server/email.js';
import {
	deletePendingPasswordLoginCookie,
	hashPasswordLoginCode,
	isSamePasswordLoginHash,
	PENDING_PASSWORD_LOGIN_COOKIE_NAME,
	setPendingPasswordLoginCookie
} from '$lib/server/password-login.js';
import { setSessionTokenCookie } from '$lib/server/session.js';
import { fail, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import * as v from 'valibot';

const verifyCodeSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.regex(/^\d{6}$/, 'Enter the 6-digit code'))
});

const resendCodeSchema = v.object({
	intent: v.literal('resend-code')
});

const createVerifyForm = () =>
	superValidate(valibot(verifyCodeSchema), { id: 'verify-code-form' });

const createResendForm = () =>
	superValidate({ intent: 'resend-code' }, valibot(resendCodeSchema), { id: 'resend-code-form' });

const getPendingContextOrRedirect = async (token: string | undefined, clearCookie: () => void) => {
	if (!token) {
		throw redirect(303, resolve('/login'));
	}

	const pending = await getPendingOtcContext(token);
	if (!pending) {
		clearCookie();
		throw redirect(303, resolve('/login'));
	}

	return pending;
};

export const load = (async ({ locals, cookies }) => {
	if (locals.user) {
		throw redirect(302, '/');
	}

	const token = cookies.get(PENDING_PASSWORD_LOGIN_COOKIE_NAME);
	const pending = await getPendingContextOrRedirect(token, () =>
		deletePendingPasswordLoginCookie(cookies)
	);

	const verifyForm = await createVerifyForm();
	const resendForm = await createResendForm();

	return {
		verifyForm,
		resendForm,
		email: pending.user.email
	};
}) satisfies PageServerLoad;

export const actions = {
	verify: async ({ request, cookies }) => {
		const verifyForm = await superValidate(request, valibot(verifyCodeSchema), {
			id: 'verify-code-form'
		});
		const resendForm = await createResendForm();

		if (!verifyForm.valid) {
			return fail(400, { verifyForm, resendForm });
		}

		const token = cookies.get(PENDING_PASSWORD_LOGIN_COOKIE_NAME);
		const pending = await getPendingContextOrRedirect(token, () =>
			deletePendingPasswordLoginCookie(cookies)
		);

		const activeChallenges = await getActivePasswordLoginChallengesByUserId(pending.user.userId);
		const suppliedCodeHash = hashPasswordLoginCode(verifyForm.data.code);
		const matchedChallenge = activeChallenges.find((challenge) =>
			isSamePasswordLoginHash(challenge.codeHash, suppliedCodeHash)
		);

		if (!matchedChallenge) {
			verifyForm.valid = false;
			verifyForm.errors.code = [
				activeChallenges.length === 0 ? 'This code has expired. Request a new one.' : 'Invalid code'
			];
			return fail(400, { verifyForm, resendForm, email: pending.user.email });
		}

		await deletePasswordLoginChallengesByUserId(pending.user.userId);
		deletePendingPasswordLoginCookie(cookies);

		const { token: sessionToken } = await createSession(pending.user.userId);
		setSessionTokenCookie(cookies, sessionToken);

		const passkeys = await getPasskeysByUserId(pending.user.userId);
		const redirectTo = passkeys.length === 0 ? resolve('/passkeys') : resolve('/');
		throw redirect(303, redirectTo);
	},
	resend: async ({ request, cookies }) => {
		const resendForm = await superValidate(request, valibot(resendCodeSchema), {
			id: 'resend-code-form'
		});
		const verifyForm = await createVerifyForm();

		if (!resendForm.valid) {
			return fail(400, { verifyForm, resendForm });
		}

		const token = cookies.get(PENDING_PASSWORD_LOGIN_COOKIE_NAME);
		const pending = await getPendingContextOrRedirect(token, () =>
			deletePendingPasswordLoginCookie(cookies)
		);

		const { token: pendingToken, code } = await createOtcChallenge(pending.user.userId);
		await sendOtcEmail({
			email: pending.user.email,
			firstName: pending.user.givenName,
			code
		});

		setPendingPasswordLoginCookie(cookies, pendingToken);
		resendForm.message = 'A new code has been sent';

		return { verifyForm, resendForm, email: pending.user.email };
	}
} satisfies Actions;
