import { todos } from '$lib/routes'
import { verifyEmailSchema } from '$lib/schemas'
import { error, redirect } from '@sveltejs/kit'
import { fail, superValidate } from 'sveltekit-superforms'
import { valibot } from 'sveltekit-superforms/adapters'
import type { Actions, PageServerLoad } from './$types'

export const load = (async ({ locals, url }) => {
  const code = url.searchParams.get('code')
  if (!code) error(400, 'Expected ?code search parameter')

  return {
    user: locals.user,
    form: await superValidate({ code }, valibot(verifyEmailSchema))
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ request }) => {
    const form = await superValidate(request, valibot(verifyEmailSchema))

    if (!form.valid) {
      return fail(400, { form })
    }

    redirect(302, todos)
  }
} satisfies Actions
