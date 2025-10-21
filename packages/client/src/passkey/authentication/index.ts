import { pipe } from "effect";
import { runToPromise } from "../../promise";
import {
  authenticatePasskey as authenticatePasskeyM,
  type AuthenticationOptions,
  type AuthenticationResponse,
} from "./micro";

export const authenticatePasskey = (
  options: AuthenticationOptions,
): Promise<AuthenticationResponse> =>
  pipe(options, authenticatePasskeyM, runToPromise);
