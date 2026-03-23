import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';
import { createHash, randomInt } from 'node:crypto';
import {
	hashSessionSecret,
	isSameSecretHash,
	parseSessionToken,
	SESSION_ID_LENGTH,
	SESSION_SECRET_LENGTH
} from './session';

export const PENDING_PASSWORD_LOGIN_COOKIE_NAME = 'pending-password-login';
export const PASSWORD_LOGIN_CODE_TTL_MS = 10 * 60 * 1000;
export const PASSWORD_LOGIN_CHALLENGE_TTL_MS = 30 * 60 * 1000;
export const PASSWORD_LOGIN_CHALLENGE_ID_LENGTH = SESSION_ID_LENGTH;
export const PASSWORD_LOGIN_CHALLENGE_SECRET_LENGTH = SESSION_SECRET_LENGTH;

export const generatePasswordLoginCode = (): string =>
	randomInt(0, 1_000_000).toString().padStart(6, '0');

export const hashPasswordLoginCode = (code: string): string =>
	createHash('sha256').update(code).digest('hex');

export const hashPasswordLoginSecret = (secret: string): string => hashSessionSecret(secret);

export const isSamePasswordLoginHash = (storedHash: string, suppliedHash: string): boolean =>
	isSameSecretHash(storedHash, suppliedHash);

export const parsePendingPasswordLoginToken = parseSessionToken;

export const setPendingPasswordLoginCookie = (cookies: Cookies, token: string): void => {
	cookies.set(PENDING_PASSWORD_LOGIN_COOKIE_NAME, token, {
		path: '/',
		sameSite: 'lax',
		httpOnly: true,
		secure: !dev,
		expires: new Date(Date.now() + PASSWORD_LOGIN_CHALLENGE_TTL_MS)
	});
};

export const deletePendingPasswordLoginCookie = (cookies: Cookies): void => {
	cookies.set(PENDING_PASSWORD_LOGIN_COOKIE_NAME, '', {
		path: '/',
		sameSite: 'lax',
		httpOnly: true,
		secure: !dev,
		maxAge: 0
	});
};
