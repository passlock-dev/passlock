import { Micro, pipe } from "effect"
import { EventLogger, Logger } from "../../logger"
import { runToPromise, runToPromiseUnsafe } from "../../shared/promise"
import {
  type RegistrationError,
  RegistrationHelper,
  type RegistrationOptions,
  type RegistrationSuccess,
  registerPasskey as registerPasskeyM,
} from "./registration"

/**
 * Register a passkey on the local device and store the
 * associated public key in your Passlock vault.
 * @param options
 * @returns
 */
export const registerPasskeyUnsafe = async (
  options: RegistrationOptions,
  logger: typeof Logger.Service = EventLogger
): Promise<RegistrationSuccess> =>
  pipe(
    registerPasskeyM(options),
    Micro.provideService(Logger, logger),
    Micro.provideService(RegistrationHelper, RegistrationHelper.Default),
    runToPromiseUnsafe
  )

/**
 * Register a passkey on the local device and store the
 * associated public key in your Passlock vault.
 * @param options
 * @returns
 */
export const registerPasskey = async (
  options: RegistrationOptions,
  logger: typeof Logger.Service = EventLogger
): Promise<RegistrationSuccess | RegistrationError> =>
  pipe(
    registerPasskeyM(options),
    Micro.provideService(Logger, logger),
    Micro.provideService(RegistrationHelper, RegistrationHelper.Default),
    runToPromise
  )

export type { RegistrationError, RegistrationOptions, RegistrationSuccess } from "./registration"
export { isRegistrationSuccess } from "./registration"
