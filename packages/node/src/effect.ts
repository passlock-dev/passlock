export type {
  AssignUserRequest,
  DeleteAuthenticatorOptions,
  GetAuthenticatorOptions,
  ListPasskeyOptions,
} from "./passkey.js"
export type { ExchangeCodeOptions, VerifyTokenOptions } from "./principal.js"
export type { AuthenticatedTenancyOptions, TenancyOptions } from "./shared.js"
export {
  assignUser,
  deletePasskey,
  getPasskey,
  listPasskeys,
} from "./passkey.js"
export { exchangeCode, VerificationFailure, verifyIdToken } from "./principal.js"
export * from "./schemas/index.js"
