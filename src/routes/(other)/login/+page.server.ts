import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { exchangeToken } from '$lib/server/passlock'
import { lucia } from '$lib/server/auth'
import { superValidate } from 'sveltekit-superforms'
import { valibot } from 'sveltekit-superforms/adapters'
import { loginFormSchema } from '$lib/schemas'

export const load: PageServerLoad = async () => {
  return {
    form: await superValidate(valibot(loginFormSchema))
  }
}

export const actions = {
  default: async ({ request, cookies }) => {
    const form = await superValidate(request, valibot(loginFormSchema))

    if (!form.valid) {
      return fail(400, { form })
    }

    // Verify the Passlock token is genuine
    const principal = await exchangeToken(form.data.token)

    const session = await lucia.createSession(principal.user.id, {})

    const sessionCookie = lucia.createSessionCookie(session.id)

    cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '/',
      ...sessionCookie.attributes
    })

    redirect(302, '/app')
  }
} satisfies Actions
