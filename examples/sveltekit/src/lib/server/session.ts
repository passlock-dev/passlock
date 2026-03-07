/**
 * Prisma style session management
 */
import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';
import { createHash, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE_NAME = 'session';

const DAY_IN_MS = 1000 * 60 * 60 * 24;
export const SESSION_ID_LENGTH = 24;
export const SESSION_SECRET_LENGTH = 24;
export const SESSION_REFRESH_INTERVAL_MS = DAY_IN_MS;
export const SESSION_MAX_INACTIVE_MS = 30 * DAY_IN_MS;

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

export const hashSessionSecret = (sessionSecret: string): string => {
	return createHash('sha256').update(sessionSecret).digest('hex');
};

export const parseSessionToken = (
	token: string
): { sessionId: string; sessionSecret: string } | null => {
	const parts = token.split('.');
	if (parts.length !== 2) return null;

	const [sessionId, sessionSecret] = parts;
	if (!sessionId || !sessionSecret) return null;

	return { sessionId, sessionSecret };
};

export const isSameSecretHash = (storedHash: string, suppliedHash: string): boolean => {
	const storedHashBuffer = Buffer.from(storedHash, 'hex');
	const suppliedHashBuffer = Buffer.from(suppliedHash, 'hex');

	if (storedHashBuffer.length !== suppliedHashBuffer.length) return false;
	return timingSafeEqual(storedHashBuffer, suppliedHashBuffer);
};
