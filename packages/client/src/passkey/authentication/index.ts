import { pipe } from "effect";
import { runToPromise } from "../../promise";
import {
  authenticatePasskey as authenticatePasskeyM,
  type AuthenticationResponse,
} from "./micro";
import type { PasslockOptions } from "../../shared";

export const authenticatePasskey = (
  username: string,
  options: PasslockOptions,
): Promise<AuthenticationResponse> =>
  pipe(authenticatePasskeyM(username, options), runToPromise);
