/**
 * Passlock identifiers associated with a registered or authenticated passkey.
 *
 * This is not the richer backend-side `Principal` shape exposed by server code.
 *
 * @category Passkeys (core)
 */
export type Principal = {
  /**
   * Passlock passkey ID (authenticator ID).
   */
  authenticatorId: string

  /**
   * User identifier associated with the passkey.
   *
   * By default this mirrors `authenticatorId`, but you can use the REST API
   * or `@passlock/server` to assign your own internal user ID.
   */
  userId: string
}
