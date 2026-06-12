import { getPasslockConfig } from '$lib/server/passkeys.js';
import { findPasskeysByUserId } from '$lib/server/repository.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as PasslockServer from '@passlock/server';
import { errorResponse } from '../shared';

/**
 * Authorize passkey registration for the signed-in local account before the
 * browser starts the WebAuthn ceremony.
 */
export const POST: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return errorResponse('Authentication required.', 401);
	}

	const existingPasskeys = await findPasskeysByUserId(event.locals.user.userId);
	const displayName = `${event.locals.user.givenName} ${event.locals.user.familyName}`.trim();

	const config = getPasslockConfig();

	const authorizedRegistration = await PasslockServer.authorizePasskeyRegistration(
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

	if (authorizedRegistration.failure) {
		const status = PasslockServer.isBadRequestError(authorizedRegistration) ? 400 : 500;
		return errorResponse(authorizedRegistration.message, status);
	}

	return json({
		_tag: authorizedRegistration._tag,
		expiresAt: authorizedRegistration.expiresAt,
		registrationToken: authorizedRegistration.registrationToken
	});
};
