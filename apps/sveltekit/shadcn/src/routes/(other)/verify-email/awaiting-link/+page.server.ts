import type { PageServerLoad } from './$types'

export const load = (async ({ locals }) => {
  return { user: locals.user };
}) satisfies PageServerLoad;