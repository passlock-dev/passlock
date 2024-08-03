// +page.server.ts
import { registrationFormSchema } from '$lib/schemas'
import { superValidate } from 'sveltekit-superforms'
import { valibot } from 'sveltekit-superforms/adapters'
import type { PageLoad } from './$types'

export const load: PageLoad = async () => {
  return {
    form: await superValidate(valibot(registrationFormSchema))
  }
}