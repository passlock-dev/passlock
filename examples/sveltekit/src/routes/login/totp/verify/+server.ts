import type { RequestHandler } from './$types';
import {
	TOTP_LOGIN_COOKIE_NAME,
	deleteTotpLoginCookie,
	setSessionTokenCookie
} from '#lib/server/cookies.js';
import { readTotpJson, totpEndpoint, totpJson } from '#lib/server/totpHttp.js';
import { TotpFlowError } from '#lib/server/totp.js';
import { getTotpFlows } from '#lib/server/totpRuntime.js';
import { TotpSubmission } from '#lib/shared/totp.js';

export const POST: RequestHandler = (event) =>
	totpEndpoint(async () => {
		const token = event.cookies.get(TOTP_LOGIN_COOKIE_NAME);
		if (!token || event.locals.user) throw new TotpFlowError(401, 'Start a new email login.');
		const input = await readTotpJson(event.request, TotpSubmission);
		const session = await getTotpFlows().verify(token, input.authenticatorId, input.code);
		deleteTotpLoginCookie(event.cookies);
		setSessionTokenCookie(event.cookies, session.token);
		return totpJson({ type: 'loggedIn' });
	});
