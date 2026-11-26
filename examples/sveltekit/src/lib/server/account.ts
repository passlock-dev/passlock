/**
 * Account management
 */

import { resolve } from '$app/paths';
import { redirect } from '@sveltejs/kit';
import { findPasskeysByUserId, type Session, type SessionUser } from './repository.js';
import { totpStore } from './totpRuntime.js';
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
	/** Existing passkey policy used by credential management. */
	reauthenticationRequired: boolean;
	/** Account actions additionally fall back to TOTP. */
	accountReauthenticationRequired: boolean;
	/** An already authorized deletion can resume on the same session. */
	accountDeletionReauthenticationRequired: boolean;
	reauthenticationMethod: 'passkey' | 'totp' | null;
	totpCredentials: { id: string; displayName: string; digits: number }[];
};

/**
 * Return the authenticated user, session, and passkey state for the current
 * request, or `null` if no session is present.
 */
export const getAccountContext = async (locals: App.Locals): Promise<AccountContext | null> => {
	const user = locals.user;
	const session = locals.session;
	if (!user || !session) return null;

	const passkeys = await findPasskeysByUserId(user.userId);
	const passkeyIds = passkeys.map(({ passkeyId }) => passkeyId);
	const hasPasskeys = passkeyIds.length > 0;
	const reauthenticationRequired =
		hasPasskeys && !isRecentAuthentication(session.passkeyAuthenticatedAt);

	const authenticators = hasPasskeys ? [] : await totpStore.list(user.userId);
	// An uncertain enrollment must not silently bypass the account's MFA policy.
	const hasTotp = authenticators.some((row) => row.status !== 'pending');
	const reauthenticationMethod = hasPasskeys ? 'passkey' : hasTotp ? 'totp' : null;
	const accountReauthenticationRequired =
		reauthenticationRequired || (hasTotp && !isRecentAuthentication(session.totpAuthenticatedAt));
	const totpCredentials = authenticators
		.filter((row) => row.status === 'active')
		.map((row) => ({ id: row.authenticatorId, displayName: row.displayName, digits: row.digits }));
	return {
		accountReauthenticationRequired,
		accountDeletionReauthenticationRequired:
			accountReauthenticationRequired && session.accountDeletionRetryAt === null,
		reauthenticationMethod,
		totpCredentials,
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
	if (!context) redirect(302, resolve('login'));

	return context;
};
