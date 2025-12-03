import { Micro, pipe } from "effect";
import { runToPromise, runToPromiseUnsafe } from "../../promise";
import {
  authenticatePasskey as authenticatePasskeyM,
  type AuthenticationError,
  type AuthenticationOptions,
  type AuthenticationSuccess,
} from "./micro";
import { EventLogger, Logger } from "../../logger";

/**
 * Trigger local passkey authentication then verify the passkey in the Passlock vault.
 * Returns a code and id_token that can be exchanged/decoded in your backend.
 *
 * @param options
 * @returns
 */
export const authenticatePasskeyUnsafe = (
  options: AuthenticationOptions,
  logger: typeof Logger.Service = EventLogger,
): Promise<AuthenticationSuccess> =>
  pipe(
    authenticatePasskeyM(options),
    Micro.provideService(Logger, logger),
    runToPromiseUnsafe,
  );

/**
 * Trigger local passkey authentication then verify the passkey in the Passlock vault.
 * Returns a code and id_token that can be exchanged/decoded in your backend.
 *
 * @param options
 * @returns
 */
export const authenticatePasskey = (
  options: AuthenticationOptions,
  logger: typeof Logger.Service = EventLogger,
): Promise<AuthenticationSuccess | AuthenticationError> =>
  pipe(
    authenticatePasskeyM(options),
    Micro.provideService(Logger, logger),
    runToPromise,
  );

export type { AuthenticationSuccess, AuthenticationError } from "./micro";
export { isAuthenticationSuccess } from "./micro";
