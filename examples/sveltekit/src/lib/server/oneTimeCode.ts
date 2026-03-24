/**
 * Generation of tokens and codes, hashing and verification
 */
import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';
import { randomInt } from 'node:crypto';

import { parseSessionToken, SESSION_ID_LENGTH, SESSION_SECRET_LENGTH } from './session';

// OTC === ONE TIME CODE
export const OTC_VERIFICATION_PENDING_COOKIE_NAME = 'otc-pending';
export const EMAIL_CHANGE_VERIFICATION_PENDING_COOKIE_NAME = 'email-change-pending';
export const OTC_CODE_TTL_MS = 10 * 60 * 1000;
export const OTC_CHALLENGE_TTL_MS = 30 * 60 * 1000;
export const OTC_MAX_ATTEMPTS = 5;
export const OTC_RESEND_COOLDOWN_MS = 60 * 1000;
export const OTC_CHALLENGE_ID_LENGTH = SESSION_ID_LENGTH;
export const OTC_CHALLENGE_SECRET_LENGTH = SESSION_SECRET_LENGTH;

export const generateCode = (): string => randomInt(0, 1_000_000).toString().padStart(6, '0');

export const parseOtcToken = (
	token: string
): { sessionId: string; sessionSecret: string } | null => {
	const parts = token.split('.');
	if (parts.length !== 2) return null;

	const [sessionId, sessionSecret] = parts;
	if (!sessionId || !sessionSecret) return null;

	return { sessionId, sessionSecret };
};

const getPendingCookie = (cookies: Cookies, cookieName: string) => cookies.get(cookieName);

const setPendingCookie = (cookies: Cookies, cookieName: string, token: string): void => {
	cookies.set(cookieName, token, {
		path: '/',
		sameSite: 'lax',
		httpOnly: true,
		secure: !dev,
		expires: new Date(Date.now() + OTC_CHALLENGE_TTL_MS)
	});
};

const deletePendingCookie = (cookies: Cookies, cookieName: string): void => {
	cookies.set(cookieName, '', {
		path: '/',
		sameSite: 'lax',
		httpOnly: true,
		secure: !dev,
		maxAge: 0
	});
};

export const getOtcCookie = (cookies: Cookies) =>
	getPendingCookie(cookies, OTC_VERIFICATION_PENDING_COOKIE_NAME);

export const setOtcCookie = (cookies: Cookies, token: string): void => {
	setPendingCookie(cookies, OTC_VERIFICATION_PENDING_COOKIE_NAME, token);
};

export const deleteOtcCookie = (cookies: Cookies): void => {
	deletePendingCookie(cookies, OTC_VERIFICATION_PENDING_COOKIE_NAME);
};

export const getEmailChangeOtcCookie = (cookies: Cookies) =>
	getPendingCookie(cookies, EMAIL_CHANGE_VERIFICATION_PENDING_COOKIE_NAME);

export const setEmailChangeOtcCookie = (cookies: Cookies, token: string): void => {
	setPendingCookie(cookies, EMAIL_CHANGE_VERIFICATION_PENDING_COOKIE_NAME, token);
};

export const deleteEmailChangeOtcCookie = (cookies: Cookies): void => {
	deletePendingCookie(cookies, EMAIL_CHANGE_VERIFICATION_PENDING_COOKIE_NAME);
};
