import { exchangePasslockCode } from '$lib/server/passlock.js';
import { createSession, getUserByPasskeyId } from '$lib/server/repository.js';
import { setSessionTokenCookie } from '$lib/server/session.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as v from 'valibot';

const payloadSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.minLength(8))
});

export const POST: RequestHandler = async ({ request, cookies }) => {
	const rawPayload = await request.json().catch(() => null);
	const payload = v.safeParse(payloadSchema, rawPayload);
	if (payload.issues) {
		return json({ error: 'Invalid request. Expected code.' }, { status: 400 });
	}

	const principal = await exchangePasslockCode(payload.output.code);
	if (principal._tag !== 'ExtendedPrincipal') {
		const status = principal._tag === '@error/InvalidCode' ? 401 : 500;
		return json({ error: principal.message }, { status });
	}

	const user = await getUserByPasskeyId(principal.authenticatorId);
	if (!user) {
		return json({ error: 'No local user account is linked to this passkey.' }, { status: 404 });
	}

	const { token } = await createSession(user.userId);
	setSessionTokenCookie(cookies, token);

	return json({ success: true });
};
