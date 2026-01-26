import type { PasslockOptions } from "./shared/options"
import { Micro, pipe } from "effect"
import { EventLogger, Logger } from "./logger"
import {
  AuthenticationHelper,
  type AuthenticationOptions,
  type AuthenticationSuccess,
  authenticatePasskey as authenticatePasskeyM,
  type PasskeyNotFound,
} from "./passkey/authentication"
import {
  RegistrationHelper,
  type RegistrationOptions,
  type RegistrationSuccess,
  registerPasskey as registerPasskeyM,
} from "./passkey/registration"
import {
  type CredentialMapping,
  deletePasskey as deletePasskeyM,
  isPasskeyDeletionSupport as isPasskeyDeletionSupportM,
  isPasskeySyncSupport as isPasskeySyncSupportM,
  isPasskeyUpdateSupport as isPasskeyUpdateSupportM,
  signalCredentialRemoval,
  syncPasskeys as syncPasskeysM,
  type UpdateUserDetails,
  updateUserDetails as updateUserDetailsM,
} from "./passkey/signals"
import { runToPromiseUnsafe } from "./shared/promise"

export type { PasslockOptions } from "./shared/options"
export { ConsoleLogger, EventLogger, LogEvent, Logger, LogLevel } from "./logger"

/* Registration */

/**
 * Register a passkey on the local device and store the
 * associated public key in your Passlock vault.
 * @param options
 * @returns
 */
export const registerPasskey = async (
  options: RegistrationOptions,
  logger: typeof Logger.Service = EventLogger
): Promise<RegistrationSuccess> =>
  pipe(
    registerPasskeyM(options),
    Micro.provideService(Logger, logger),
    Micro.provideService(RegistrationHelper, RegistrationHelper.Default),
    runToPromiseUnsafe
  )

export type {
  RegistrationError,
  RegistrationOptions,
  RegistrationSuccess,
} from "./passkey/registration"
export {
  isOtherPasskeyError,
  isPasskeyUnsupported,
  OtherPasskeyError,
  PasskeyUnsupportedError,
} from "./passkey/errors"
export {
  DuplicatePasskeyError,
  isDuplicatePasskey,
  isRegistrationSuccess,
} from "./passkey/registration"
export { isUnexpectedError, UnexpectedError } from "./shared/network"

/* Authentication */

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
): Promise<AuthenticationSuccess> =>
  pipe(
    authenticatePasskeyM(options),
    Micro.provideService(Logger, logger),
    Micro.provideService(AuthenticationHelper, AuthenticationHelper.Default),
    runToPromiseUnsafe
  )

export type {
  AuthenticationError,
  AuthenticationOptions,
  AuthenticationSuccess,
  PasskeyNotFound,
} from "./passkey/authentication"
export {
  isAuthenticationSuccess,
  isPasskeyNotFound,
} from "./passkey/authentication"

/* Signals */

export const isPasskeyDeletionSupport = () => pipe(isPasskeyDeletionSupportM, Micro.runSync)
export const isPasskeySyncSupport = () => pipe(isPasskeySyncSupportM, Micro.runSync)
export const isPasskeyUpdateSupport = () => pipe(isPasskeyUpdateSupportM, Micro.runSync)

export const deletePasskey = (
  identifiers: string | CredentialMapping | PasskeyNotFound,
  options: PasslockOptions,
  logger: typeof Logger.Service = EventLogger
): Promise<boolean> => {
  const micro =
    typeof identifiers === "string"
      ? deletePasskeyM(identifiers, options)
      : signalCredentialRemoval(identifiers)

  return pipe(micro, Micro.provideService(Logger, logger), runToPromiseUnsafe)
}

export type { CredentialMapping } from "./passkey/signals"
export { DeletionError, isDeletionError } from "./passkey/signals"

export const syncPasskeys = (
  passkeyIds: Array<string>,
  options: PasslockOptions,
  logger: typeof Logger.Service = EventLogger
): Promise<boolean> => {
  const micro = syncPasskeysM(passkeyIds, options)
  return pipe(micro, Micro.provideService(Logger, logger), runToPromiseUnsafe)
}

export { isSyncError, SyncError } from "./passkey/signals"

export const updateUserDetails = (
  options: UpdateUserDetails,
  logger: typeof Logger.Service = EventLogger
): Promise<boolean> => {
  const micro = updateUserDetailsM(options)
  return pipe(micro, Micro.provideService(Logger, logger), runToPromiseUnsafe)
}

export type { UpdateUserDetails } from "./passkey/signals"
export { isUpdateError, UpdateError } from "./passkey/signals"

/* Support */

export { isAutofillSupport, isPasskeySupport } from "./passkey/support"
