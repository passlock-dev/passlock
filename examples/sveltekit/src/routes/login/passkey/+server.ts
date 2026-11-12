import { totpStore } from '#lib/server/totpRuntime.js';
import { TOTP_LOGIN_COOKIE_NAME, deleteTotpLoginCookie } from '#lib/server/cookies.js';
import { getPasslockConfig } from '#lib/server/passkeys.js';
import { createSession, getUserByPasskeyId } from '#lib/server/repository.js';
import { setSessionTokenCookie } from '#lib/server/cookies.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as v from 'valibot';
import { Passlock } from '@passlock/server';

const payloadSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.minLength(8))
});

/**
 * Exchange a browser-produced Passlock code for a verified passkey login and
 * create the local session for the owning account.
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
	const rawPayload = await request.json().catch(() => null);
	const payload = v.safeParse(payloadSchema, rawPayload);
	if (payload.issues) {
		return json({ error: 'Invalid request. Expected code.' }, { status: 400 });
	}

	const principal = await new Passlock(getPasslockConfig()).exchangeCode({
		code: payload.output.code
	});

	if (principal._tag !== 'ExtendedPrincipal') {
		const status = principal._tag === '@error/InvalidCode' ? 401 : 500;
		return json({ error: principal.message }, { status });
	}

	// The Passlock authenticator id is the bridge from WebAuthn identity to the
	// local account stored in SQLite.
	const user = await getUserByPasskeyId(principal.authenticatorId);
	if (!user) {
		return json({ error: 'No local user account is linked to this passkey.' }, { status: 404 });
	}

	if (
		principal.userId !== String(user.userId) ||
		!principal.passkey?.verified ||
		!principal.passkey.userVerified
	) {
		return json(
			{ error: 'A verified passkey belonging to this account is required.' },
			{ status: 403 }
		);
	}

	// A verified owned passkey is the sample's independent recovery path.
	const pending = cookies.get(TOTP_LOGIN_COOKIE_NAME);
	if (pending) await totpStore.cancelLogin(pending);
	deleteTotpLoginCookie(cookies);

	// Mark the new session as passkey-verified so sensitive actions can proceed
	// without an immediate second prompt.
	const { token } = await createSession(user.userId, { passkeyVerified: true });
	setSessionTokenCookie(cookies, token);

	return json({ success: true });
};
