export type { ApiOptions, AuthorizedApiOptions } from "./shared.js";

export * from "./schemas/errors.js";

export {
  type ExchangeCodeOptions,
  type Principal,
  type IdToken,
  type VerifyTokenOptions,
  isPrincipal,
  exchangeCode,
  exchangeCodeUnsafe,
  verifyIdToken,
  verifyIdTokenUnsafe,
} from "./principal/index.js";

export {
  type AssignUserRequest,
  type DeleteAuthenticatorOptions,
  type GetAuthenticatorOptions,
  type Passkey,
  assignUser,
  assignUserUnsafe,
  isPasskey,
  getPasskey as getAuthenticator,
  getPasskeyUnsafe as getAuthenticatorUnsafe,
  deletePasskey as deleteAuthenticator,
  deletePasskeyUnsafe as deleteAuthenticatorUnsafe,
} from "./passkey/index.js";
