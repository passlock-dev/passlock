import type { RequestHandler } from './$types';
import { TOTP_LOGIN_COOKIE_NAME, deleteTotpLoginCookie } from '#lib/server/cookies.js';
import { totpEndpoint, totpJson } from '#lib/server/totpHttp.js';
import { totpStore } from '#lib/server/totpRuntime.js';

export const POST: RequestHandler = (event) =>
	totpEndpoint(async () => {
		const token = event.cookies.get(TOTP_LOGIN_COOKIE_NAME);
		if (token) await totpStore.cancelLogin(token);
		deleteTotpLoginCookie(event.cookies);
		return totpJson({ type: 'success' });
	});
