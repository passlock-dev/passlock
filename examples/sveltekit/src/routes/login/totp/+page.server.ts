import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { TOTP_LOGIN_COOKIE_NAME, deleteTotpLoginCookie } from '#lib/server/cookies.js';
import { totpStore } from '#lib/server/totpRuntime.js';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	if (locals.user) redirect(303, resolve('/'));
	const token = cookies.get(TOTP_LOGIN_COOKIE_NAME);
	const pending = token ? await totpStore.pending(token) : null;
	if (!pending) {
		deleteTotpLoginCookie(cookies);
		redirect(303, resolve('login'));
	}
	const credentials = (await totpStore.list(pending.userId)).filter(
		(row) => row.status === 'active' && pending.authenticatorIds.includes(row.authenticatorId)
	);
	return {
		expiresAt: pending.expiresAt,
		credentials: credentials.map((row) => ({
			id: row.authenticatorId,
			displayName: row.displayName,
			digits: row.digits
		}))
	};
};
