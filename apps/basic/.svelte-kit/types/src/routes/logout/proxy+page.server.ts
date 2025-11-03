// @ts-nocheck
import { sessionManager } from '$lib/server';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load = (async () => {
  return {};
}) satisfies PageServerLoad;

export const actions = {
    default: async ({ cookies, locals }: import('./$types').RequestEvent) => {
        if (locals.session) {
            await sessionManager.validateSessionToken(locals.session.token)
            sessionManager.deleteSessionTokenCookie(cookies)
        }

        redirect(302, '/login')
    }
};null as any as Actions;