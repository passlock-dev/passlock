import { PASSLOCK_API_KEY } from '$env/static/private'
import { PUBLIC_PASSLOCK_ENDPOINT, PUBLIC_PASSLOCK_TENANCY_ID } from '$env/static/public'
import { TokenVerifier, isStringFormData } from '@passlock/sveltekit'
import { error } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

const tokenVerifier = new TokenVerifier({ 
  tenancyId: PUBLIC_PASSLOCK_TENANCY_ID, 
  apiKey: PASSLOCK_API_KEY, 
  endpoint: PUBLIC_PASSLOCK_ENDPOINT 
})

export const load = (async () => {
    return {};
}) satisfies PageServerLoad;

export const actions = {
  default: async ({ request }) => {
    const data = await request.formData()

    console.log(data)

    const token = data.get('token')
    if (!isStringFormData(token)) error(400, "Invalid form value type, expected string")

    const result = await tokenVerifier.exchangeToken(token)
    console.log(result)
  }
} satisfies Actions