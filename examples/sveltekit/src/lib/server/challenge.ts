import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';

// We use one cookie for the signup and login challenges
export const SIGNUP_LOGIN_PENDING_COOKIE_NAME = 'signup-login-pending';
// And another for the change email cookie
export const EMAIL_CHANGE_PENDING_COOKIE_NAME = 'email-change-pending';

export const CHALLENGE_FLOW_TTL_MS = 30 * 60 * 1000;

export type PendingChallengeCookie = {
	challengeId: string;
	token: string;
};

const getCookie = (
	cookies: Cookies,
	cookieName: typeof SIGNUP_LOGIN_PENDING_COOKIE_NAME | typeof EMAIL_CHANGE_PENDING_COOKIE_NAME
) => {
	const cookie = cookies.get(cookieName);
	if (!cookie) return undefined;

	try {
		const parsed = JSON.parse(cookie);
		if (
			typeof parsed !== 'object' ||
			parsed === null ||
			typeof parsed.challengeId !== 'string' ||
			typeof parsed.token !== 'string'
		) {
			return undefined;
		}

		return parsed as PendingChallengeCookie;
	} catch {
		return undefined;
	}
};

const setCookie = (
	cookies: Cookies,
	cookieName: typeof SIGNUP_LOGIN_PENDING_COOKIE_NAME | typeof EMAIL_CHANGE_PENDING_COOKIE_NAME,
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

const deleteCookie = (
	cookies: Cookies,
	cookieName: typeof SIGNUP_LOGIN_PENDING_COOKIE_NAME | typeof EMAIL_CHANGE_PENDING_COOKIE_NAME
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
	getCookie(cookies, SIGNUP_LOGIN_PENDING_COOKIE_NAME);

export const setSignupLoginCookie = (cookies: Cookies, pending: PendingChallengeCookie): void => {
	setCookie(cookies, SIGNUP_LOGIN_PENDING_COOKIE_NAME, pending);
};

export const deleteSignupLoginCookie = (cookies: Cookies): void => {
	deleteCookie(cookies, SIGNUP_LOGIN_PENDING_COOKIE_NAME);
};

export const getEmailChangeCookie = (cookies: Cookies) =>
	getCookie(cookies, EMAIL_CHANGE_PENDING_COOKIE_NAME);

export const setEmailChangeCookie = (cookies: Cookies, pending: PendingChallengeCookie): void => {
	setCookie(cookies, EMAIL_CHANGE_PENDING_COOKIE_NAME, pending);
};

export const deleteEmailChangeCookie = (cookies: Cookies): void => {
	deleteCookie(cookies, EMAIL_CHANGE_PENDING_COOKIE_NAME);
};
