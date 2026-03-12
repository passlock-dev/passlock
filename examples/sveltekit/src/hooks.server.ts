import type { Handle } from '@sveltejs/kit';
import { validateSessionToken } from '$lib/server/repository.js';
import {
	deleteSessionTokenCookie,
	SESSION_COOKIE_NAME,
	setSessionTokenCookie
} from '$lib/server/session.js';
import { dev } from '$app/environment';

export const handle: Handle = async ({ event, resolve }) => {
	if (dev) console.log(`Route: ${event.route.id}`);

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
