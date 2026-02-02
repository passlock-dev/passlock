/**
 * @category Passkeys (core)
 */
export type Principal = {
  /**
   * Passkey ID.
   */
  authenticatorId: string

  /**
   * By default this will mirror the `authenticatorId` however you
   * can use the REST API or @passlock/node package to assign your
   * own internal userId to the passkey.
   */
  userId: string
}
