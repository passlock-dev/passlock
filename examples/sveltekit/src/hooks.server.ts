import { isSameOriginMutation, isTotpPath } from '#lib/server/requestSecurity.js';
import { json } from '@sveltejs/kit';
import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';
import { validateSessionToken } from '#lib/server/repository.js';
import {
	deleteSessionTokenCookie,
	SESSION_COOKIE_NAME,
	setSessionTokenCookie
} from '#lib/server/cookies.js';

/**
 * Validate the session cookie on every request and hydrate `event.locals` with
 * the authenticated user/session when one exists.
 *
 * This keeps the rest of the app simple: loaders and actions can rely on
 * `locals.user` and `locals.session` rather than re-validating the cookie.
 */
const hydrateSession: Handle = async ({ event, resolve }) => {
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

/** Reject cross-site state changes before parsing bodies or using session credentials. */
export const handle: Handle = async (input) => {
	if (!isSameOriginMutation(input.event.request, input.event.url))
		return json(
			{ type: 'error', message: 'Same-origin request required.' },
			{ status: 403, headers: { 'Cache-Control': 'no-store' } }
		);
	const response = await hydrateSession(input);
	if (!isTotpPath(input.event.url.pathname)) return response;
	const headers = new Headers(response.headers);
	headers.set('Cache-Control', 'no-store');
	headers.set('Referrer-Policy', 'no-referrer');
	headers.set(
		'Content-Security-Policy',
		"img-src 'self' data:; form-action 'self'; frame-ancestors 'none'; base-uri 'self'"
	);
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
};

export const handleError: HandleServerError = ({ event, error }) => {
	// SDK and database failures on these routes must not log submitted codes or setup material.
	if (!isTotpPath(event.url.pathname)) console.error(error);
	return { message: 'The request could not be completed. Please try again later.' };
};
