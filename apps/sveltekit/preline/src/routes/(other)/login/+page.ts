import { loginFormSchema } from '$lib/schemas'
import { superValidate } from 'sveltekit-superforms'
import { valibot } from 'sveltekit-superforms/adapters'
import type { PageLoad } from '../../(other)/login/$types'

/* 
 * We want to pre-render the login page but we cant pre-render
 * pages with actions on them. So we use a regular +page.ts
 * for the superform setup but post the form to the /login/action 
 */

export const prerender = true

export const load: PageLoad = async () => {
  return {
    form: await superValidate(valibot(loginFormSchema))
  }
}