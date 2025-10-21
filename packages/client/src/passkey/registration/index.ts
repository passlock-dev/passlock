import { pipe } from "effect";
import { runToPromise } from "../../promise";
import {
  registerPasskey as registerPasskeyM,
  type RegistrationOptions,
  type RegistrationResponse,
} from "./micro";

export const registerPasskey = async (
  options: RegistrationOptions,
): Promise<RegistrationResponse> =>
  pipe(options, registerPasskeyM, runToPromise);
