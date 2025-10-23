import { pipe } from "effect";
import { runToPromise } from "../../promise";
import {
  registerPasskey as registerPasskeyM,
  type RegistrationResponse,
} from "./micro";
import type { PasslockOptions } from "../../shared";

export const registerPasskey = async (
  username: string,
  options: PasslockOptions,
): Promise<RegistrationResponse> =>
  pipe(registerPasskeyM(username, options), runToPromise);
