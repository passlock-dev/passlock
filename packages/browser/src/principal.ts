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
   * For registration, this is the user ID supplied by your backend when it
   * prepared the registration.
   */
  userId: string
}
