import { Micro, pipe } from "effect"
import { EventLogger, Logger } from "../../logger"
import { runToPromise, runToPromiseUnsafe } from "../../shared/promise"
import {
  type AuthenticationError,
  AuthenticationHelper,
  type AuthenticationOptions,
  type AuthenticationSuccess,
  authenticatePasskey as authenticatePasskeyM,
} from "./authentication"

/**
 * Trigger local passkey authentication then verify the passkey in the Passlock vault.
 * Returns a code and id_token that can be exchanged/decoded in your backend.
 *
 * @param options
 * @returns
 */
export const authenticatePasskeyUnsafe = (
  options: AuthenticationOptions,
  logger: typeof Logger.Service = EventLogger
): Promise<AuthenticationSuccess> =>
  pipe(
    authenticatePasskeyM(options),
    Micro.provideService(Logger, logger),
    Micro.provideService(AuthenticationHelper, AuthenticationHelper.Default),
    runToPromiseUnsafe
  )

/**
 * Trigger local passkey authentication then verify the passkey in the Passlock vault.
 * Returns a code and id_token that can be exchanged/decoded in your backend.
 *
 * @param options
 * @returns
 */
export const authenticatePasskey = (
  options: AuthenticationOptions,
  logger: typeof Logger.Service = EventLogger
): Promise<AuthenticationSuccess | AuthenticationError> =>
  pipe(
    authenticatePasskeyM(options),
    Micro.provideService(Logger, logger),
    Micro.provideService(AuthenticationHelper, AuthenticationHelper.Default),
    runToPromise
  )

export type {
  AuthenticationError,
  AuthenticationOptions,
  AuthenticationSuccess,
} from "./authentication"
export { isAuthenticationSuccess } from "./authentication"
