export type { PasslockOptions } from "../shared";

export type {
  RegistrationResponse,
  RegistrationError,
} from "./registration/micro";

export { registerPasskey } from "./registration/index";

export type {
  AuthenticationResponse,
  AuthenticationError,
} from "./authentication/micro";

export { authenticatePasskey } from "./authentication/index";
