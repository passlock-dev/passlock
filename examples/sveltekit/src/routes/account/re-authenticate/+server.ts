import { getPasslockConfig } from '$lib/server/passkeys.js';
import {
  countPasskeysByUserId,
	getUserByPasskeyId,
	refreshPasskeyAuthenticatedAt
} from '$lib/server/repository.js';
import { json } from '@sveltejs/kit';
import { exchangeCode } from '@passlock/server/safe';
import type { RequestHandler } from './$types';
import * as v from 'valibot';

const payloadSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.minLength(8))
});

const errorResponse = (message: string, status: number) =>
	json({ _tag: '@error/Error' as const, message }, { status });

/**
 * Verify a passkey against the current account and refresh the session's
 * passkey re-authentication timestamp.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !locals.session) {
		return errorResponse('Authentication required.', 401);
	}

	const passkeysCount = await countPasskeysByUserId(locals.user.userId);
	if (passkeysCount === 0) {
		return errorResponse('No passkeys are linked to this account.', 400);
	}

	const rawPayload = await request.json().catch(() => null);
	const payload = v.safeParse(payloadSchema, rawPayload);
	if (payload.issues) {
		return errorResponse('Invalid request. Expected code.', 400);
	}

	const principal = await exchangeCode({
		...getPasslockConfig(),
		code: payload.output.code
	});

	if (principal.failure) {
		const status = principal._tag === '@error/InvalidCode' ? 401 : 500;
		return errorResponse(principal.message, status);
	}

	// Re-authentication is only valid when the presented passkey still belongs
	// to the signed-in account.
	const user = await getUserByPasskeyId(principal.authenticatorId);
	if (!user || user.userId !== locals.user.userId) {
		return errorResponse('That passkey does not belong to this account.', 403);
	}

	// Later account actions read this timestamp to decide whether another prompt
	// is required.
	await refreshPasskeyAuthenticatedAt(locals.session.id);

	return json({ success: true });
};
