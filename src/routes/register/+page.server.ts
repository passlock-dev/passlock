import { error, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { exchangeToken } from '$lib/server/passlock';
import { lucia } from "$lib/server/auth";
import { createUser } from '$lib/server/db';

export const actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData()

    const token = formData.get('token')
    if (token == null || typeof token === 'object') {
      error(400, "Expected token to be a string")
    }

    const principal = await exchangeToken(token)
    
    createUser(principal.user)
    const session = await lucia.createSession(principal.user.id, { })
    const sessionCookie = lucia.createSessionCookie(session.id);
		
    cookies.set(sessionCookie.name, sessionCookie.value, {
			path: "/",
			...sessionCookie.attributes
		});

    const verifyEmailMethod = formData.get('verifyEmailMethod')

    if (verifyEmailMethod) {
      redirect(302, `/verify-email?method=${verifyEmailMethod}`)
    } else {
      redirect(302, "/")
    }
	}
} satisfies Actions;