/**
 * Generation of tokens and codes, hashing and verification
 */
import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';
import { randomInt } from 'node:crypto';

import {
	parseSessionToken,
	SESSION_ID_LENGTH,
	SESSION_SECRET_LENGTH
} from './session';

// OTC === ONE TIME CODE
export const OTC_VERIFICATION_PENDING_COOKIE_NAME = 'otc-pending';
export const OTC_CODE_TTL_MS = 10 * 60 * 1000;
export const OTC_CHALLENGE_TTL_MS = 30 * 60 * 1000;
export const OTC_CHALLENGE_ID_LENGTH = SESSION_ID_LENGTH;
export const OTC_CHALLENGE_SECRET_LENGTH = SESSION_SECRET_LENGTH;

export const generateCode = (): string => randomInt(0, 1_000_000).toString().padStart(6, '0');

export const parseOtcToken = parseSessionToken;

export const getOtcCookie = (cookies: Cookies) => cookies.get(OTC_VERIFICATION_PENDING_COOKIE_NAME);

export const setOtcCookie = (cookies: Cookies, token: string): void => {
	cookies.set(OTC_VERIFICATION_PENDING_COOKIE_NAME, token, {
		path: '/',
		sameSite: 'lax',
		httpOnly: true,
		secure: !dev,
		expires: new Date(Date.now() + OTC_CHALLENGE_TTL_MS)
	});
};

export const deleteOtcCookie = (cookies: Cookies): void => {
	cookies.set(OTC_VERIFICATION_PENDING_COOKIE_NAME, '', {
		path: '/',
		sameSite: 'lax',
		httpOnly: true,
		secure: !dev,
		maxAge: 0
	});
};
