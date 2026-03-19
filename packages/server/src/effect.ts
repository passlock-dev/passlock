/**
 * Effect-first exports for `@passlock/server`.
 *
 * This entrypoint exposes the original `Effect`-returning functions together
 * with the public schemas used by the package.
 *
 * @module effect
 */

export type {
  AssignUserOptions,
  ListPasskeyOptions,
} from "./passkey/passkey.js"
export {
  assignUser,
  deletePasskey,
  getPasskey,
  listPasskeys,
} from "./passkey/passkey.js"
export type {} from "./principal/principal.js"
export {
  exchangeCode,
  VerificationError,
  verifyIdToken,
} from "./principal/principal.js"
export * from "./schemas/index.js"
export type {
  AuthenticatedOptions,
  PasslockOptions,
} from "./shared.js"
