/**
 * Account management
 */

import { resolve } from '$app/paths';
import { redirect } from '@sveltejs/kit';
import { getPasskeysByUserId, type Session, type SessionUser } from './repository.js';
import { isRecentAuthentication } from './session.js';

/**
 * Server-side account context derived from the current session plus the user's
 * registered passkeys.
 *
 * Routes use this to decide whether the request is authenticated at all and
 * whether the user must present a passkey again before performing a sensitive
 * action such as changing profile data or deleting the account.
 */
export type AccountContext = {
	_tag: 'AccountContext';
	user: SessionUser;
	session: Session;
	passkeyIds: string[];
	hasPasskeys: boolean;
	reauthenticationRequired: boolean;
};

/**
 * Return the authenticated user, session, and passkey state for the current
 * request, or `null` if no session is present.
 */
export const getAccountContext = async (locals: App.Locals): Promise<AccountContext | null> => {
	const user = locals.user;
	const session = locals.session;
	if (!user || !session) return null;

	const passkeys = await getPasskeysByUserId(user.userId);
	const passkeyIds = passkeys.map(({ passkeyId }) => passkeyId);
	const hasPasskeys = passkeyIds.length > 0;
	const reauthenticationRequired =
		hasPasskeys && !isRecentAuthentication(session.passkeyAuthenticatedAt);

	return {
		_tag: 'AccountContext' as const,
		user,
		session,
		passkeyIds,
		hasPasskeys,
		reauthenticationRequired
	};
};

/**
 * Require an authenticated account context, redirecting anonymous requests to
 * the login page before they reach account-management logic.
 */
export const requireAccountContext = async (locals: App.Locals): Promise<AccountContext> => {
	const context = await getAccountContext(locals);
	if (!context) redirect(302, resolve('/login'));

	return context;
};
