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
