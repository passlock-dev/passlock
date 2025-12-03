export type {
  RegistrationOptions,
  RegistrationSuccess,
  RegistrationError,
  DuplicatePasskeyError,
} from "./registration/micro";

export {
  registerPasskeyUnsafe,
  registerPasskey,
  isRegistrationSuccess,
} from "./registration/index";

export type {
  AuthenticationOptions,
  AuthenticationSuccess,
  AuthenticationError,
} from "./authentication/micro";

export {
  authenticatePasskeyUnsafe,
  authenticatePasskey,
  isAuthenticationSuccess,
} from "./authentication/index";

export { isPasskeySupport, isAutofillSupport } from "./support";

export { PasskeysUnsupportedError, OtherPasskeyError } from "./shared";
