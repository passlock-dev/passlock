import { verifyEmailSchema } from '$lib/schemas'
import { redirect } from '@sveltejs/kit'
import { fail, superValidate } from 'sveltekit-superforms'
import { valibot } from 'sveltekit-superforms/adapters'
import type { Actions, PageServerLoad } from './$types'

export const load = (async () => {
  return {
    form: await superValidate(valibot(verifyEmailSchema))
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ request }) => {
    const form = await superValidate(request, valibot(verifyEmailSchema))

    if (!form.valid) {
      return fail(400, { form })
    }

    redirect(302, '/')
  }
} satisfies Actions
