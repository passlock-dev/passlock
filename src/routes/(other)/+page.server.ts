// +page.server.ts
import { superValidate } from 'sveltekit-superforms'
import { valibot } from 'sveltekit-superforms/adapters'
import type { PageServerLoad } from './$types'
import { registrationFormSchema } from '$lib/schemas'

import { fail, redirect } from '@sveltejs/kit'
import type { Actions } from './$types'
import { exchangeToken } from '$lib/server/passlock'
import { lucia } from '$lib/server/auth'
import { createUser } from '$lib/server/db'

export const load: PageServerLoad = async () => {
  return {
    form: await superValidate(valibot(registrationFormSchema))
  }
}

export const actions = {
  default: async ({ request, cookies }) => {
    const form = await superValidate(request, valibot(registrationFormSchema))

    if (!form.valid) {
      return fail(400, { form })
    }

    const principal = await exchangeToken(form.data.token)
    const user = createUser(principal.user)
    const session = await lucia.createSession(user.id, {})
    const sessionCookie = lucia.createSessionCookie(session.id)

    cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '/',
      ...sessionCookie.attributes
    })

    const authType = form.data.authType
    const verifyEmail = form.data.verifyEmail

    if (authType === 'passkey' && verifyEmail === 'code') {
      redirect(302, `/verify-email/code`)
    } else if (authType === 'passkey' && verifyEmail === 'link') {
      redirect(302, `/verify-email/awaiting-link`)
    } else {
      redirect(302, '/app')
    }
  }
} satisfies Actions
