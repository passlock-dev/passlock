import { error } from "@sveltejs/kit"
import type { LayoutServerLoad } from "./$types";

export const load = (async ({ locals }) => {
  const user = locals.user
  if (!user) error(403, "Access denied")

  return { user }
}) satisfies LayoutServerLoad