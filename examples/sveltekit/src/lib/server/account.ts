import { resolve } from '$app/paths';
import { redirect } from '@sveltejs/kit';
import { getPasskeysByUserId, type Session, type SessionUser } from './repository.js';
import { isRecentAuthentication } from './session.js';

/**
 * To determine if the user needs to authenticate
 * and if so which passkey(s) should be used
 */
export type AccountContext = {
	user: SessionUser;
	session: Session;
	passkeyIds: string[];
	hasPasskeys: boolean;
	reauthenticationRequired: boolean;
};

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
		user,
		session,
		passkeyIds,
		hasPasskeys,
		reauthenticationRequired
	};
};

/**
 * Get the account context if logged in, otherwise redirect to /login
 *
 * @param locals
 * @returns
 */
export const requireAccountContext = async (locals: App.Locals): Promise<AccountContext> => {
	const context = await getAccountContext(locals);
	if (!context) redirect(302, resolve('/login'));

	return context;
};
