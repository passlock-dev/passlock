/**
 * Prisma style session management
 */
import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';

export const SESSION_COOKIE_NAME = 'session';

export const MS_IN_A_DAY = 1000 * 60 * 60 * 24;
export const SESSION_ID_LENGTH = 24;
export const SESSION_SECRET_LENGTH = 24;
export const SESSION_REFRESH_INTERVAL_MS = MS_IN_A_DAY;
export const SESSION_MAX_INACTIVE_MS = 30 * MS_IN_A_DAY;
// Users must have authenticated with their passkey in the last N minutes
export const SESSION_PASSKEY_REAUTH_WINDOW_MS = 10 * 60 * 1000;

export const setSessionTokenCookie = (cookies: Cookies, token: string): void => {
	cookies.set(SESSION_COOKIE_NAME, token, {
		path: '/',
		sameSite: 'lax',
		httpOnly: true,
		secure: !dev,
		expires: new Date(Date.now() + SESSION_MAX_INACTIVE_MS)
	});
};

export const deleteSessionTokenCookie = (cookies: Cookies): void => {
	cookies.set(SESSION_COOKIE_NAME, '', {
		path: '/',
		sameSite: 'lax',
		httpOnly: true,
		secure: !dev,
		maxAge: 0
	});
};

export const parseSessionToken = (token: string): { id: string; secret: string } | null => {
	const parts = token.split('.');
	if (parts.length !== 2) return null;

	const [id, secret] = parts;
	if (!id || !secret) return null;

	return { id, secret };
};

export const isRecentAuthentication = (lastPasskeyAuthentication: number | null): boolean => {
	if (lastPasskeyAuthentication === null) return false;
	return Date.now() - lastPasskeyAuthentication < SESSION_PASSKEY_REAUTH_WINDOW_MS;
};
