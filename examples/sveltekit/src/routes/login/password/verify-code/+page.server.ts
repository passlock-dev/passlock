import type { Actions, PageServerLoad } from './$types';

import {
	createOtcChallenge,
	createSession,
	deleteAllOtcChallengesByUser,
	getOtcChallengesByUser,
	getPendingOtcContext
} from '$lib/server/repository.js';
import { sendOtcEmail } from '$lib/server/email.js';
import {
	hashText,
	isEqualHash,
} from '$lib/server/hashing';
import {
	deleteOtcCookie,
	getOtcCookie,
	setOtcCookie
} from '$lib/server/oneTimeCode.js';
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

const createVerifyForm = () => superValidate(
  valibot(verifyCodeSchema), 
  { id: 'verify-code-form' }
);

const createResendForm = () => superValidate(
  { intent: 'resend-code' }, 
  valibot(resendCodeSchema), { id: 'resend-code-form' }
);

const getOtcContext = async (token: string | undefined, clearCookie: () => void) => {
	if (!token) redirect(303, resolve('/login'));

	const pending = await getPendingOtcContext(token);
	if (!pending) {
		clearCookie();
		redirect(303, resolve('/login'));
	}

	return pending;
};

export const load = (async ({ locals, cookies }) => {
	if (locals.user) redirect(302, '/');

	const token = getOtcCookie(cookies);
  const { user } = await getOtcContext(token, () => deleteOtcCookie(cookies));

	const verifyForm = await createVerifyForm();
	const resendForm = await createResendForm();

	return {
		verifyForm,
		resendForm,
		email: user.email
	};
}) satisfies PageServerLoad;

export const actions = {
	verify: async ({ request, cookies }) => {
    const resendForm = await createResendForm();

		const verifyForm = await superValidate(
      request, 
      valibot(verifyCodeSchema), 
      { id: 'verify-code-form' }
    );

		if (!verifyForm.valid) return fail(400, { verifyForm, resendForm });

		const token = getOtcCookie(cookies);
		const { user } = await getOtcContext(token, () => deleteOtcCookie(cookies));

		const activeChallenges = await getOtcChallengesByUser(user.userId);
		const suppliedCodeHash = hashText(verifyForm.data.code);
    
		const matchedChallenge = activeChallenges.find((challenge) =>
			isEqualHash(challenge.codeHash, suppliedCodeHash)
		);

		if (!matchedChallenge) {
      const message = activeChallenges.length === 0 ? 'This code has expired. Request a new one.' : 'Invalid code';
      setError(verifyForm, 'code', message);
			return fail(400, { verifyForm, resendForm, email: user.email });
		}

    // OTC validated so clear all challenges and the cookie
    // otherwise it wouldn't be a ONE time code :D
		await deleteAllOtcChallengesByUser(user.userId);
		deleteOtcCookie(cookies);

		const { token: sessionToken } = await createSession(user.userId);
		setSessionTokenCookie(cookies, sessionToken);

		redirect(303, resolve('/'));
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
		const pending = await getOtcContext(token, () => deleteOtcCookie(cookies));

		const { token: pendingToken, code } = await createOtcChallenge(pending.user.userId);
		await sendOtcEmail({
			email: pending.user.email,
			firstName: pending.user.givenName,
			code
		});

		setOtcCookie(cookies, pendingToken);
		resendForm.message = 'A new code has been sent';

		return { verifyForm, resendForm, email: pending.user.email };
	}
} satisfies Actions;
