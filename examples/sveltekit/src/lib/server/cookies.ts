import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';
import { SESSION_MAX_INACTIVE_MS } from './session';

/**
 * Helpers for the short-lived cookies that keep one-time-code flows tied to a
 * specific browser session.
 *
 * The cookie stores the Passlock challenge id and secret. The user receives
 * the code separately by email, so both pieces are required to complete the
 * flow.
 */

// Signup and login share the same cookie because they are mutually exclusive
// unauthenticated flows.
export const SIGNUP_LOGIN_CHALLENGE_COOKIE_NAME = dev ? 'demo.signup-login-challenge' : '__Host-signup-login-challenge';

// Email changes use a separate cookie because they happen while signed in.
export const EMAIL_CHANGE_CHALLENGE_COOKIE_NAME = dev ? 'demo.email-change-pending' : '__Host-email-change-pending';

export const SESSION_COOKIE_NAME = dev ? 'demo.session' : '__Host-session';

export const CHALLENGE_FLOW_TTL_MS = 30 * 60 * 1000;

export type PendingChallengeCookie = {
	challengeId: string;
	secret: string;
};

const getChallengeCookie = (
	cookies: Cookies,
	cookieName: typeof SIGNUP_LOGIN_CHALLENGE_COOKIE_NAME | typeof EMAIL_CHANGE_CHALLENGE_COOKIE_NAME
) => {
	const cookie = cookies.get(cookieName);
	if (!cookie) return undefined;

	try {
		const parsed = JSON.parse(cookie);
		if (
			typeof parsed !== 'object' ||
			parsed === null ||
			typeof parsed.challengeId !== 'string' ||
			typeof parsed.secret !== 'string'
		) {
			return undefined;
		}

		return parsed as PendingChallengeCookie;
	} catch {
		return undefined;
	}
};

const setChallengeCookie = (
	cookies: Cookies,
	cookieName: typeof SIGNUP_LOGIN_CHALLENGE_COOKIE_NAME | typeof EMAIL_CHANGE_CHALLENGE_COOKIE_NAME,
	pending: PendingChallengeCookie
): void => {
	cookies.set(cookieName, JSON.stringify(pending), {
		path: '/',
		sameSite: 'lax',
		httpOnly: true,
		secure: !dev,
		expires: new Date(Date.now() + CHALLENGE_FLOW_TTL_MS)
	});
};

const deleteChallengeCookie = (
	cookies: Cookies,
	cookieName: typeof SIGNUP_LOGIN_CHALLENGE_COOKIE_NAME | typeof EMAIL_CHANGE_CHALLENGE_COOKIE_NAME
): void => {
	cookies.set(cookieName, '', {
		path: '/',
		sameSite: 'lax',
		httpOnly: true,
		secure: !dev,
		maxAge: 0
	});
};

export const getSignupLoginCookie = (cookies: Cookies) =>
	getChallengeCookie(cookies, SIGNUP_LOGIN_CHALLENGE_COOKIE_NAME);

/**
 * Store the challenge id and secret for an in-progress signup or login flow.
 */
export const setSignupLoginCookie = (cookies: Cookies, pending: PendingChallengeCookie): void => {
	setChallengeCookie(cookies, SIGNUP_LOGIN_CHALLENGE_COOKIE_NAME, pending);
};

export const deleteSignupLoginCookie = (cookies: Cookies): void => {
	deleteChallengeCookie(cookies, SIGNUP_LOGIN_CHALLENGE_COOKIE_NAME);
};

export const getEmailChangeCookie = (cookies: Cookies) =>
	getChallengeCookie(cookies, EMAIL_CHANGE_CHALLENGE_COOKIE_NAME);

/**
 * Store the challenge id and secret for an in-progress email change flow.
 */
export const setEmailChangeCookie = (cookies: Cookies, pending: PendingChallengeCookie): void => {
	setChallengeCookie(cookies, EMAIL_CHANGE_CHALLENGE_COOKIE_NAME, pending);
};

export const deleteEmailChangeCookie = (cookies: Cookies): void => {
	deleteChallengeCookie(cookies, EMAIL_CHANGE_CHALLENGE_COOKIE_NAME);
};

/* Sessions */

/**
 * Persist the opaque session token in an HTTP-only cookie.
 */
export const setSessionTokenCookie = (cookies: Cookies, token: string): void => {
	cookies.set(SESSION_COOKIE_NAME, token, {
		path: '/',
		sameSite: 'lax',
		httpOnly: true,
		secure: !dev,
		expires: new Date(Date.now() + SESSION_MAX_INACTIVE_MS)
	});
};

/**
 * Clear the session cookie during logout or when server-side validation fails.
 */
export const deleteSessionTokenCookie = (cookies: Cookies): void => {
	cookies.set(SESSION_COOKIE_NAME, '', {
		path: '/',
		sameSite: 'lax',
		httpOnly: true,
		secure: !dev,
		maxAge: 0
	});
};
