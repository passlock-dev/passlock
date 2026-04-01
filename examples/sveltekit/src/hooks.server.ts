import type { Handle } from '@sveltejs/kit';
import { validateSessionToken } from '$lib/server/repository.js';
import {
	deleteSessionTokenCookie,
	SESSION_COOKIE_NAME,
	setSessionTokenCookie
} from '$lib/server/cookies.js';

/**
 * Validate the session cookie on every request and hydrate `event.locals` with
 * the authenticated user/session when one exists.
 *
 * This keeps the rest of the app simple: loaders and actions can rely on
 * `locals.user` and `locals.session` rather than re-validating the cookie.
 */
export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE_NAME);
	if (!token) {
		event.locals.user = null;
		event.locals.session = null;

		return resolve(event);
	}

	const sessionValidation = await validateSessionToken(token);
	if (!sessionValidation) {
		deleteSessionTokenCookie(event.cookies);
		event.locals.user = null;
		event.locals.session = null;

		return resolve(event);
	}

	if (sessionValidation.fresh) {
		setSessionTokenCookie(event.cookies, token);
	}

	event.locals.user = sessionValidation.user;
	event.locals.session = sessionValidation.session;
	return resolve(event);
};
