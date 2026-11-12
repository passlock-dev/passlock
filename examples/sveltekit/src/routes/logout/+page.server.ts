import { totpStore } from '#lib/server/totpRuntime.js';
import { TOTP_LOGIN_COOKIE_NAME, deleteTotpLoginCookie } from '#lib/server/cookies.js';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { invalidateSession } from '#lib/server/repository.js';
import { deleteSessionTokenCookie } from '#lib/server/cookies.js';

export const load = (async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/');
	}
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ locals, cookies }) => {
		if (locals.session) {
			await invalidateSession(locals.session.id);
		}

		const pending = cookies.get(TOTP_LOGIN_COOKIE_NAME);
		if (pending) await totpStore.cancelLogin(pending);
		deleteTotpLoginCookie(cookies);
		deleteSessionTokenCookie(cookies);
		redirect(303, '/');
	}
} satisfies Actions;
