import { totpStore } from '#lib/server/totpRuntime.js';
import {
	deleteSessionTokenCookie,
	deleteTotpLoginCookie,
	setTotpLoginCookie
} from '#lib/server/cookies.js';
import type { Actions, PageServerLoad } from './$types';
import type { Cookies } from '@sveltejs/kit';

import {
	deleteSignupLoginCookie,
	getSignupLoginCookie,
	setSessionTokenCookie
} from '#lib/server/cookies.js';
import { getChallengeCodeErrorMessage } from '#lib/server/mailbox/mailboxChallenge.js';
import { getPendingChallengeContext } from '#lib/server/mailbox/pendingChallenge.js';
import {
	consumeLoginChallenge,
	getPendingLoginChallenge
} from '#lib/server/mailbox/loginChallenge.js';
import { createVerifyCodeForm, validateVerifyCodeForm } from '#lib/server/mailbox/verifyCode.js';
import { countPasskeysByUserId, invalidateSession } from '#lib/server/repository.js';
import { resolve } from '$app/paths';
import { fail, redirect } from '@sveltejs/kit';
import { setError } from 'sveltekit-superforms';

const getPendingLoginContext = (cookies: Cookies) =>
	getPendingChallengeContext({
		cookies,
		getPendingCookie: getSignupLoginCookie,
		getChallenge: getPendingLoginChallenge
	});

/**
 * Load the login code verification page using the pending challenge referenced
 * by the cookie.
 */
export const load = (async ({ locals, cookies }) => {
	if (locals.user) redirect(302, '/');

	const pendingContext = await getPendingLoginContext(cookies);
	if (pendingContext._tag === 'MissingPendingChallenge') {
		redirect(303, resolve('login'));
	}
	if (pendingContext._tag === 'InvalidPendingChallenge') {
		deleteSignupLoginCookie(cookies);
		redirect(303, resolve('login'));
	}

	const verifyForm = await createVerifyCodeForm();

	return {
		verifyForm,
		email: pendingContext.challenge.email
	};
}) satisfies PageServerLoad;

export const actions = {
	verify: async ({ request, cookies, locals }) => {
		const verifyForm = await validateVerifyCodeForm(request);

		if (!verifyForm.valid) return fail(400, { verifyForm });

		const pendingContext = await getPendingLoginContext(cookies);
		if (pendingContext._tag === 'MissingPendingChallenge') {
			redirect(303, resolve('login'));
		}
		if (pendingContext._tag === 'InvalidPendingChallenge') {
			deleteSignupLoginCookie(cookies);
			redirect(303, resolve('login'));
		}

		const { challenge, cookie: pending } = pendingContext;

		// The user-supplied code is not enough on its own. The browser must also
		// present the stored challenge secret from the HTTP-only cookie.
		const result = await consumeLoginChallenge({
			challengeId: pending.challengeId,
			secret: pending.secret,
			code: verifyForm.data.code
		});

		if (result._tag === 'ChallengeConsumed') {
			deleteSignupLoginCookie(cookies);

			// A verified email is only the first factor when this account requires TOTP.
			// The database checks policy atomically with issuing either kind of token.
			if (locals.session) await invalidateSession(locals.session.id);
			deleteSessionTokenCookie(cookies);
			deleteTotpLoginCookie(cookies);
			const login = await totpStore.beginEmailLogin(result.user.userId);
			if (login.kind === 'pending') {
				setTotpLoginCookie(cookies, login.token, login.expiresAt);
				redirect(303, resolve('login/totp'));
			}
			setSessionTokenCookie(cookies, login.token);

			// First-time email-only users are nudged to register a passkey after
			// login; existing passkey users go straight to the app.
			const passkeysCount = await countPasskeysByUserId(result.user.userId);
			const redirectTo = passkeysCount === 0 ? resolve('passkeys') : resolve('/');
			redirect(303, redirectTo);
		}

		if (result._tag === '@error/InvalidChallenge' || result._tag === '@error/AccountNotFound') {
			deleteSignupLoginCookie(cookies);
			redirect(303, resolve('login'));
		}

		setError(verifyForm, 'code', getChallengeCodeErrorMessage(result));
		return fail(400, { verifyForm, email: challenge.email });
	}
} satisfies Actions;
