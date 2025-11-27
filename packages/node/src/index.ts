export type { ApiOptions, AuthorizedApiOptions } from "./shared.js";

export {
  type Principal,
  isPrincipal,
  exchangeCode,
  exchangeCodeUnsafe,
  verifyIdToken,
  verifyIdTokenUnsafe,
} from "./principal/index.js";

export {
  type AssignUserRequest,
  type AssignedUser,
  assignUserUnsafe,
} from "./authenticator/index.js";
