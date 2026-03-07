/**
 * Key identifiers. Not to be confused with the Principal available in backend code,
 * which includes much more data.
 *
 * @category Passkeys (core)
 */
export type Principal = {
  /**
   * Passkey ID.
   */
  authenticatorId: string

  /**
   * By default this will mirror the `authenticatorId` however you
   * can use the REST API or @passlock/server package to assign your
   * own internal userId to the passkey.
   */
  userId: string
}
