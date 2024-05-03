import { PASSLOCK_API_KEY } from '$env/static/private'
import {
  PUBLIC_PASSLOCK_ENDPOINT,
  PUBLIC_PASSLOCK_TENANCY_ID
} from '$env/static/public'
import { error } from '@sveltejs/kit'

// see https://docs.passlock.dev/docs/api/client#principal
export type Principal = {
  token: string
  user: {
    id: string
    givenName: string
    familyName: string
    email: string
    emailVerified: boolean
  }
  authStatement: {
    authType: 'email' | 'passkey'
    userVerified: boolean
    authTimestamp: Date
  }
  expiresAt: Date
}

/**
 * Call the Passlock REST API to exchange the token for a principal.
 *
 * Coming Soon - local JWT based verification (avoiding the network trip).
 *
 * @param token
 * @returns
 */
export const exchangeToken = async (token: string): Promise<Principal> => {
  const url = `${PUBLIC_PASSLOCK_ENDPOINT}/${PUBLIC_PASSLOCK_TENANCY_ID}/token/${token}`

  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${PASSLOCK_API_KEY}`
  }

  const response = await fetch(url, { headers })

  if (!response.ok) {
    const errorMessage = await response.json()
    console.error(errorMessage)

    error(500, 'Unable to exchange token')
  }

  const principal = await response.json()

  return principal as Principal
}
