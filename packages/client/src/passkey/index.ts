export type { PasslockOptions } from "../shared";

export type {
  RegistrationOptions,
  RegistrationSuccess as RegistrationResponse,
} from "./registration/micro";

export {
  registerPasskeyUnsafe,
  registerPasskey,
  isRegistrationSuccess,
} from "./registration/index";

export type {
  AuthenticationOptions,
  AuthenticationSuccess as AuthenticationResponse,
} from "./authentication/micro";

export {
  authenticatePasskeyUnsafe,
  authenticatePasskey,
  isAuthenticationSuccess,
} from "./authentication/index";

export { isPasskeySupport, isAutofillSupport } from "./support";

export { PasskeysUnsupportedError } from "./shared";
