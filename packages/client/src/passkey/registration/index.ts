import { pipe } from "effect";
import { runToPromise, runToPromiseUnsafe } from "../../promise";
import {
  registerPasskey as registerPasskeyM,
  type RegistrationOptions,
  type RegistrationResponse,
} from "./micro";
import type { NetworkError, RegistrationError } from "../../error";

export const registerPasskeyUnsafe = async (
  options: RegistrationOptions,
): Promise<RegistrationResponse> =>
  pipe(registerPasskeyM(options), runToPromiseUnsafe);

export const registerPasskey = async (
  options: RegistrationOptions,
): Promise<RegistrationResponse | RegistrationError | NetworkError> =>
  pipe(registerPasskeyM(options), runToPromise);  
