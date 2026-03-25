import { resolve } from '$app/paths';
import { redirect } from '@sveltejs/kit';
import { getPasskeysByUserId, type Session, type SessionUser } from './repository.js';
import { isRecentAuthentication } from './session.js';

export type AccountPasskeyContext = {
	user: SessionUser;
	session: Session;
	passkeyIds: string[];
	hasPasskeys: boolean;
	reauthenticationRequired: boolean;
};

export const getAccountPasskeyContext = async (
	locals: App.Locals
): Promise<AccountPasskeyContext | null> => {
	const user = locals.user;
	const session = locals.session;

	if (!user || !session) {
		return null;
	}

	const passkeys = await getPasskeysByUserId(user.userId);
	const passkeyIds = passkeys.map(({ passkeyId }) => passkeyId);
	const hasPasskeys = passkeyIds.length > 0;
  const reauthenticationRequired = 
    hasPasskeys && !isRecentAuthentication(session.lastPasskeyAuthenticationAt)

	return {
		user,
		session,
		passkeyIds,
		hasPasskeys,
		reauthenticationRequired
	};
};

export const requireAccountPasskeyConfirmation = async (
	locals: App.Locals
): Promise<AccountPasskeyContext> => {
	const context = await getAccountPasskeyContext(locals);

	if (!context) {
		redirect(302, resolve('/login'));
	}

	return context;
};
