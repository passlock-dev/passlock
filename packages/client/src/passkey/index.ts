export type { PasslockOptions } from "../shared";

export type {
  RegistrationOptions,
  RegistrationResponse,
} from "./registration/micro";

export { registerPasskeyUnsafe, registerPasskey } from "./registration/index";

export type {
  AuthenticationOptions,
  AuthenticationResponse,
} from "./authentication/micro";

export { authenticatePasskeyUnsafe, authenticatePasskey } from "./authentication/index";
