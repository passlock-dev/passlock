import { fail, superValidate } from 'sveltekit-superforms'
import type { Actions, PageServerLoad } from './$types';
import { valibot } from 'sveltekit-superforms/adapters'
import { verifyEmailSchema } from '$lib/schemas'
import { error, redirect } from '@sveltejs/kit'

export const load = (async ({ url }) => {
  const code = url.searchParams.get('code')
  if (!code) error(400, "Expected ?code search parameter")

  return {
    form: await superValidate({ code }, valibot(verifyEmailSchema))
  }
}) satisfies PageServerLoad;

export const actions = {
  default: async ({ request, cookies }) => {
    const form = await superValidate(request, valibot(verifyEmailSchema))

    if (!form.valid) {
      return fail(400, { form })
    }

    redirect(302, '/')
  }
} satisfies Actions