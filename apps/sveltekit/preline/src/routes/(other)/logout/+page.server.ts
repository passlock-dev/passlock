import { login } from '$lib/routes'
import { lucia } from '$lib/server/auth'
import { redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions = {
  default: async ({ locals }) => {
    const session = locals.session

    if (session) {
      lucia.invalidateSession(session.id)
    }

    redirect(302, login)
  }
} satisfies Actions
