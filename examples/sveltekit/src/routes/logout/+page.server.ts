import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { invalidateSession } from '$lib/server/repository.js';
import { deleteSessionTokenCookie } from '$lib/server/session.js';

export const load = (async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/');
	}
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ locals, cookies }) => {
		if (locals.session) {
			await invalidateSession(locals.session.id);
		}

		deleteSessionTokenCookie(cookies);
		throw redirect(303, '/');
	}
} satisfies Actions;
