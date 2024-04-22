import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

const parseMethod = (url: URL): 'link' | 'code' | null => {
  const method = url.searchParams.get('method')

  if (method === 'link') return 'link'
  if (method === 'code') return 'code'

  return null
}

/**
 * A single page which handles 3 scenarios:
 * 
 * 1. We've emailed the user a verification link
 * 2. We've emailed the user a code
 * 3. They clicked the link in the mail
 */
export const load = (({ url }) => {
  // If we redirected from the registration page 
  // the method query parameter will be link or code
  const method = parseMethod(url)

  // If the the user clicked the verification link
  // the 'code' query parameter will be set
  const code = url.searchParams.get('code')

  if (!method && !code) { 
    error(400, "Expected a verification code or method to be provided")
  }
  
  return { method, code }
}) satisfies PageLoad