import type { Actions } from './$types'
import { lucia } from '$lib/server/auth'
import { redirect } from '@sveltejs/kit'

export const actions = {
  default: async ({ locals }) => {
    const session = locals.session

    if (session) {
      lucia.invalidateSession(session.id)
    }

    redirect(302, '/login')
  }
} satisfies Actions
