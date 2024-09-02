import { registrationFormSchema } from '$lib/schemas'
import { superValidate } from 'sveltekit-superforms'
import { valibot } from 'sveltekit-superforms/adapters'
import type { PageLoad } from './$types'

/*
 * We want to pre-render the home page but we cant pre-render
 * pages with actions on them. So we use a regular +page.ts for
 * the superform setup but post the form to the /register/action
 * route, which has a form action (and is not prerendered).
 */

export const prerender = true

export const load: PageLoad = async () => {
  return {
    form: await superValidate(valibot(registrationFormSchema))
  }
}
