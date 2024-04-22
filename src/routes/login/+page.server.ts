import { error, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { exchangeToken } from '$lib/server/passlock';
import { lucia } from "$lib/server/auth";

export const actions = {
	default: async ({ request, cookies }) => {
		const formData =  await request.formData()

    const token = formData.get('token')
    if (token == null || typeof token === 'object') {
      error(400, "Expected token to be a string")
    }

    // Verify the Passlock token is genuine
    const principal = await exchangeToken(token)
    const session = await lucia.createSession(principal.user.id, { })
    const sessionCookie = lucia.createSessionCookie(session.id);
		
    cookies.set(sessionCookie.name, sessionCookie.value, {
			path: "/",
			...sessionCookie.attributes
		});

    redirect(302, "/")
	}
} satisfies Actions;