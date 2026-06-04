import { getPasslockConfig } from '$lib/server/passkeys.js';
import { getPasskeysByUserId } from '$lib/server/repository.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as PasslockServer from '@passlock/server';

const errorResponse = (message: string, status: number) =>
	json({ _tag: '@error/Error' as const, message }, { status });

/**
 * Authorize passkey registration for the signed-in local account before the
 * browser starts the WebAuthn ceremony.
 */
export const POST: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return errorResponse('Authentication required.', 401);
	}

	const existingPasskeys = await getPasskeysByUserId(event.locals.user.userId);
	const displayName = `${event.locals.user.givenName} ${event.locals.user.familyName}`.trim();

	const config = getPasslockConfig();

	const preparedRegistration = await PasslockServer.preparePasskeyRegistration(
		{
			rpId: config.rpId,
			userId: String(event.locals.user.userId),
			username: event.locals.user.email,
			displayName: displayName || undefined,
			excludeCredentials: existingPasskeys.map(({ passkeyId }) => passkeyId),
			userVerification: 'preferred'
		},
		config
	);

	if (preparedRegistration.failure) {
		const status = PasslockServer.isBadRequestError(preparedRegistration) ? 400 : 500;
		return errorResponse(preparedRegistration.message, status);
	}

	return json({
		_tag: preparedRegistration._tag,
		expiresAt: preparedRegistration.expiresAt,
		registrationToken: preparedRegistration.registrationToken
	});
};
