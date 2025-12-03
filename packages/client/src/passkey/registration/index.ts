import { Micro, pipe } from "effect";
import { runToPromise, runToPromiseUnsafe } from "../../promise";
import {
  registerPasskey as registerPasskeyM,
  type RegistrationError,
  type RegistrationOptions,
  type RegistrationSuccess,
} from "./micro";
import { EventLogger, Logger } from "../../logger";

/**
 * Register a passkey on the local device and store the
 * associated public key in your Passlock vault.
 * @param options
 * @returns
 */
export const registerPasskeyUnsafe = async (
  options: RegistrationOptions,
  logger: typeof Logger.Service = EventLogger,
): Promise<RegistrationSuccess> =>
  pipe(
    registerPasskeyM(options),
    Micro.provideService(Logger, logger),
    runToPromiseUnsafe,
  );

/**
 * Register a passkey on the local device and store the
 * associated public key in your Passlock vault.
 * @param options
 * @returns
 */
export const registerPasskey = async (
  options: RegistrationOptions,
  logger: typeof Logger.Service = EventLogger,
): Promise<RegistrationSuccess | RegistrationError> =>
  pipe(
    registerPasskeyM(options),
    Micro.provideService(Logger, logger),
    runToPromise,
  );

export type { RegistrationSuccess, RegistrationError } from "./micro";
export { isRegistrationSuccess } from "./micro";
