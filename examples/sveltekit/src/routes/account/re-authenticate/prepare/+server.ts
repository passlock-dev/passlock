import { getPasslockConfig } from '$lib/server/passkeys.js';
import { countPasskeysByUserId } from '$lib/server/repository.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as PasslockServer from '@passlock/server';

const errorResponse = (message: string, status: number) =>
	json({ _tag: '@error/Error' as const, message }, { status });

/**
 * Authorize account-management re-authentication for the signed-in account.
 * The server pins the account and user-verification policy, then returns only
 * the prepared authentication token to the browser.
 */
export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user || !locals.session) {
		return errorResponse('Authentication required.', 401);
	}

	const passkeyCount = await countPasskeysByUserId(locals.user.userId);
	if (passkeyCount === 0) {
		return errorResponse('No passkeys are linked to this account.', 400);
	}

	const config = getPasslockConfig();
	const preparedAuthentication = await PasslockServer.preparePasskeyAuthentication(
		{
			rpId: config.rpId,
			userId: String(locals.user.userId),
			userVerification: 'required'
		},
		config
	);

	if (preparedAuthentication.failure) {
		const status = PasslockServer.isBadRequestError(preparedAuthentication) ? 400 : 500;
		const message = PasslockServer.isBadRequestError(preparedAuthentication)
			? preparedAuthentication.message
			: 'Unable to prepare passkey confirmation.';
		return errorResponse(message, status);
	}

	return json({
		_tag: preparedAuthentication._tag,
		expiresAt: preparedAuthentication.expiresAt,
		authenticationToken: preparedAuthentication.authenticationToken
	});
};
