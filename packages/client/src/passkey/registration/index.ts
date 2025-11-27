import { pipe } from "effect";
import { runToPromise, runToPromiseUnsafe } from "../../promise";
import {
  registerPasskey as registerPasskeyM,
  type RegistrationErrors,
  type RegistrationOptions,
  type RegistrationSuccess,
} from "./micro";

/**
 * Register a passkey on the local device and store the
 * associated public key in your Passlock vault.
 * @param options
 * @returns
 */
export const registerPasskeyUnsafe = async (
  options: RegistrationOptions,
): Promise<RegistrationSuccess> =>
  pipe(registerPasskeyM(options), runToPromiseUnsafe);

/**
 * Register a passkey on the local device and store the
 * associated public key in your Passlock vault.
 * @param options
 * @returns
 */
export const registerPasskey = async (
  options: RegistrationOptions,
): Promise<RegistrationSuccess | RegistrationErrors> =>
  pipe(registerPasskeyM(options), runToPromise);

export { isRegistrationSuccess } from "./micro";
