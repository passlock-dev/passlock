// @ts-nocheck
import { error } from '@sveltejs/kit';

import { 
  getToken, 
  isUserPrincipal,
  PasslockError, 
  TokenVerifier, 
} from '@passlock/sveltekit';

import { 
  PUBLIC_PASSLOCK_TENANCY_ID, 
  PUBLIC_PASSLOCK_ENDPOINT 
} from '$env/static/public'

import { PASSLOCK_API_KEY } from '$env/static/private'

import type { Actions, PageServerLoad } from './$types';
import { sessionManager } from '$lib/server';
import { redirect } from '@sveltejs/kit';

const tokenVerifier = new TokenVerifier({
  tenancyId: PUBLIC_PASSLOCK_TENANCY_ID,
  apiKey: PASSLOCK_API_KEY,
  endpoint: PUBLIC_PASSLOCK_ENDPOINT
})

export const load = (async () => {
  return {};
}) satisfies PageServerLoad;

export const actions = {
  default: async ({ request, cookies }: import('./$types').RequestEvent) => {
    const token = await getToken(request)
    if (!token) error(500, "Sorry something went wrong")

    const result = await tokenVerifier.exchangeToken(token)

    if (PasslockError.isError(result)) error(400, result.message)
    if (! isUserPrincipal(result)) error(400, 'Expected a user')

    const user = await sessionManager.createUser({ 
      id: result.sub,
      email: result.email, 
      givenName: result.givenName, 
      familyName: result.familyName 
    })      

    const session = await sessionManager.createSession({ userId: user.id })
    sessionManager.setSessionTokenCookie(cookies, session.token)      
    
    redirect(302, '/')
  }
};null as any as Actions;