import { login } from '$lib/routes'
import { lucia } from '$lib/server/auth'
import { redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions = {
  default: async ({ locals, cookies }) => {
    const session = locals.session

    if (session) {
      const sessionCookie = lucia.createBlankSessionCookie()
      cookies.set(sessionCookie.name, sessionCookie.value, {
        path: '/',
        ...sessionCookie.attributes
      })
    }

    redirect(302, login)
  }
} satisfies Actions
