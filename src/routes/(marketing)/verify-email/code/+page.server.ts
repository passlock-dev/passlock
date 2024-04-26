import { fail, superValidate } from 'sveltekit-superforms'
import type { Actions, PageServerLoad } from './$types';
import { valibot } from 'sveltekit-superforms/adapters'
import { verifyEmailSchema } from '$lib/schemas'
import { redirect } from '@sveltejs/kit'

export const load = (async () => {
  return {
    form: await superValidate(valibot(verifyEmailSchema))
  }
}) satisfies PageServerLoad;

export const actions = {
  default: async ({ request, cookies }) => {
    const form = await superValidate(request, valibot(verifyEmailSchema))

    if (!form.valid) {
      return fail(400, { form })
    }

   console.log({ token: form.data.token })

    redirect(302, '/')
  }
} satisfies Actions