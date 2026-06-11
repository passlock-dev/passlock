import { getPasslockConfig } from '$lib/server/passkeys.js';
import { countPasskeysByUserId, getUserByEmail } from '$lib/server/repository.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as PasslockServer from '@passlock/server';
import * as v from 'valibot';

const payloadSchema = v.object({
	username: v.optional(v.pipe(v.string(), v.trim(), v.email()))
});

const errorResponse = (message: string, status: number) =>
	json({ _tag: '@error/Error' as const, message }, { status });

/**
 * Authorize a known-user passkey login before the browser starts the WebAuthn
 * ceremony. Only the opaque prepared authentication token is returned to the
 * page.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (locals.user) {
		return errorResponse('Already authenticated.', 400);
	}

	const rawPayload = await request.json().catch(() => null);
	const payload = v.safeParse(payloadSchema, rawPayload);
	if (payload.issues) {
		return errorResponse('Invalid request. Expected an optional account email.', 400);
	}

	const config = getPasslockConfig();
	let prepareOptions: PasslockServer.PreparePasskeyAuthenticationOptions;

	if (payload.output.username) {
		const account = await getUserByEmail(payload.output.username);
		if (!account) {
			return errorResponse('No local user account was found for that email.', 404);
		}

		const passkeyCount = await countPasskeysByUserId(account.userId);
		if (passkeyCount === 0) {
			return errorResponse('No passkeys are linked to this account.', 400);
		}

		prepareOptions = {
			rpId: config.rpId,
			userId: String(account.userId),
			userVerification: 'preferred'
		};
	} else {
		prepareOptions = {
			rpId: config.rpId,
			discoverable: true,
			userVerification: 'preferred'
		};
	}

	const preparedAuthentication = await PasslockServer.preparePasskeyAuthentication(
		prepareOptions,
		config
	);

	if (preparedAuthentication.failure) {
		const status = PasslockServer.isBadRequestError(preparedAuthentication) ? 400 : 500;
		const message = PasslockServer.isBadRequestError(preparedAuthentication)
			? preparedAuthentication.message
			: 'Unable to prepare passkey login.';
		return errorResponse(message, status);
	}

	return json({
		_tag: preparedAuthentication._tag,
		expiresAt: preparedAuthentication.expiresAt,
		authenticationToken: preparedAuthentication.authenticationToken
	});
};
