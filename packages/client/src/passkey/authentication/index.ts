import { pipe } from "effect";
import { runToPromise, runToPromiseUnsafe } from "../../promise";
import {
  authenticatePasskey as authenticatePasskeyM,
  type AuthenticationOptions,
  type AuthenticationResponse,
} from "./micro";
import type { NetworkError, AuthenticationError } from "../../error";

export const authenticatePasskeyUnsafe = (
  options: AuthenticationOptions,
): Promise<AuthenticationResponse> =>
  pipe(authenticatePasskeyM(options), runToPromiseUnsafe);

export const authenticatePasskey = (
  options: AuthenticationOptions,
): Promise<AuthenticationResponse | AuthenticationError | NetworkError> =>
  pipe(authenticatePasskeyM(options), runToPromise);
