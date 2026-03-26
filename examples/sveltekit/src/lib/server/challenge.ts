import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';
import { randomInt } from 'node:crypto';

import { SESSION_ID_LENGTH, SESSION_SECRET_LENGTH } from './session';

// We use one cookie for the signup and login challenges
export const SIGNUP_LOGIN_PENDING_COOKIE_NAME = 'signup-login-pending';
// And another for the change email cookie
export const EMAIL_CHANGE_PENDING_COOKIE_NAME = 'email-change-pending';

export const CHALLENGE_CODE_TTL_MS = 10 * 60 * 1000;
export const CHALLENGE_FLOW_TTL_MS = 30 * 60 * 1000;
export const CHALLENGE_MAX_ATTEMPTS = 5;
export const CHALLENGE_RESEND_COOLDOWN_MS = 60 * 1000;
export const CHALLENGE_ID_LENGTH = SESSION_ID_LENGTH;
export const CHALLENGE_SECRET_LENGTH = SESSION_SECRET_LENGTH;

export const generateCode = (): string => randomInt(0, 1_000_000).toString().padStart(6, '0');

export const parseChallengeToken = (token: string): { id: string; secret: string } | null => {
	const parts = token.split('.');
	if (parts.length !== 2) return null;

	const [id, secret] = parts;
	if (!id || !secret) return null;

	return { id, secret };
};

const getCookie = (
	cookies: Cookies,
	cookieName: typeof SIGNUP_LOGIN_PENDING_COOKIE_NAME | typeof EMAIL_CHANGE_PENDING_COOKIE_NAME
) => cookies.get(cookieName);

const setCookie = (
	cookies: Cookies,
	cookieName: typeof SIGNUP_LOGIN_PENDING_COOKIE_NAME | typeof EMAIL_CHANGE_PENDING_COOKIE_NAME,
	token: string
): void => {
	cookies.set(cookieName, token, {
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

export const setSignupLoginCookie = (cookies: Cookies, token: string): void => {
	setCookie(cookies, SIGNUP_LOGIN_PENDING_COOKIE_NAME, token);
};

export const deleteSignupLoginCookie = (cookies: Cookies): void => {
	deleteCookie(cookies, SIGNUP_LOGIN_PENDING_COOKIE_NAME);
};

export const getEmailChangeCookie = (cookies: Cookies) =>
	getCookie(cookies, EMAIL_CHANGE_PENDING_COOKIE_NAME);

export const setEmailChangeCookie = (cookies: Cookies, token: string): void => {
	setCookie(cookies, EMAIL_CHANGE_PENDING_COOKIE_NAME, token);
};

export const deleteEmailChangeCookie = (cookies: Cookies): void => {
	deleteCookie(cookies, EMAIL_CHANGE_PENDING_COOKIE_NAME);
};
