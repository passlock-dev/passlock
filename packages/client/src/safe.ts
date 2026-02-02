/**
 * _safe_ functions i.e. functions that do not throw but instead return discriminated union
 * types composed of a successful result or an error. Use one of the type guards to narrow
 * the result to a given success or error type.
 *
 * @categoryDescription Passkeys (core)
 * Creating, updating, authenticating and deleting passkeys. {@link registerPasskey}
 * and {@link authenticatePasskey} are the primary functions.
 *
 * @categoryDescription Passkeys (other)
 * Testing for browser capabilities related to passkeys, type guards and other utilities.
 *
 * @categoryDescription Passkeys (errors)
 * Errors that could be returned by a function.
 *
 * @showCategories
 * @module safe
 */

import { Micro, pipe } from "effect"
import { runToPromise } from "./internal"
import { eventLogger, Logger } from "./logger"
import type { PasslockOptions } from "./options"
import type {
  AuthenticationError,
  AuthenticationOptions,
  AuthenticationSuccess,
} from "./passkey/authentication/authentication"
import {
  AuthenticationHelper,
  authenticatePasskey as authenticatePasskeyM,
} from "./passkey/authentication/authentication"
import type {
  DeleteError,
  PasskeyNotFoundError,
  PruningError,
  UpdateError,
} from "./passkey/errors"

import type {
  RegistrationError,
  RegistrationOptions,
  RegistrationSuccess,
} from "./passkey/registration/registration"
import {
  RegistrationHelper,
  registerPasskey as registerPasskeyM,
} from "./passkey/registration/registration"

import type {
  CredentialMapping,
  UpdatePasskeyOptions,
} from "./passkey/signals/signals"
import {
  deletePasskey as deletePasskeyM,
  isPasskeyDeleteSupport as isPasskeyDeleteSupportM,
  isPasskeyPruningSupport as isPasskeyPruningSupportM,
  isPasskeyUpdateSupport as isPasskeyUpdateSupportM,
  prunePasskeys as prunePasskeysM,
  signalCredentialRemoval,
  updatePasskey as updatePasskeyM,
} from "./passkey/signals/signals"

/* Registration */

/**
 * Registers a passkey on the user's device, then saves the server-side component in your vault.
 * If successful, this function returns a `code` or `id_token` (JWT). The code and/or jwt should
 * be sent to your backend for verification. See
 * [register a passkey](https://passlock.dev/passkeys/registration/) in the documentation.
 *
 * @param options
 *
 * @returns Use {@link isRegistrationSuccess} to test for a successful result, `RegistrationError` is
 * an alias to a union of potential errors. Use one of the appropriate isXXX type guards to narrow
 * the error.
 *
 * @see {@link isRegistrationSuccess}
 * @see {@link isPasskeyUnsupportedError}
 * @see {@link isDuplicatePasskeyError}
 * @see {@link isOtherPasskeyError}
 *
 * @example
 * // from your Passlock console settings
 * const tenancyId = "myTenancyId";
 * const username = "jdoe@gmail.com";
 *
 * const result = await registerPasskey({ tenancyId, username });
 *
 * if (isRegistrationSuccess(result)) {
 *   // send this to your backend for verification
 *   console.log(result.code);
 * } else if (isPasskeyUnsupportedError(result)) {
 *   console.error("Device does not support passkeys");
 * } else {
 *   console.error(result.message);
 * }
 *
 * @category Passkeys (core)
 */
export const registerPasskey = async (
  options: RegistrationOptions,
  /** @hidden */
  logger: typeof Logger.Service = eventLogger
): Promise<RegistrationSuccess | RegistrationError> =>
  pipe(
    registerPasskeyM(options),
    Micro.provideService(RegistrationHelper, RegistrationHelper.Default),
    Micro.provideService(Logger, logger),
    runToPromise
  )

/* Authentication */

/**
 * Asks the client to present a passkey, which is then verified against the server-side component in your vault.
 * If successful, this function returns a `code` or `id_token` (JWT). The code and/or jwt should
 * be sent to your backend for verification. See
 * [authenticate a passkey](https://passlock.dev/passkeys/authentication/) in the documentation.
 *
 * @param options
 *
 * @returns Use {@link isAuthenticationSuccess} to test for a successful result, `AuthenticationError` is
 * an alias to a union of potential errors. Use one of the appropriate isXXX type guards to narrow
 * the error.
 *
 * @see {@link isAuthenticationSuccess}
 * @see {@link isPasskeyUnsupportedError}
 * @see {@link isPasskeyNotFoundError}
 * @see {@link isOtherPasskeyError}
 *
 * @example
 * // from your Passlock console settings
 * const tenancyId = "myTenancyId";
 *
 * const result = await authenticatePasskey({ tenancyId });
 *
 * if (isAuthenticationSuccess(result)) {
 *   // send this to your backend for verification
 *   console.log(result.code);
 * } else if (isPasskeyUnsupportedError(result)) {
 *   console.error("Device does not support passkeys");
 * } else {
 *   console.error(result.message);
 * }
 *
 * @category Passkeys (core)
 */
export const authenticatePasskey = (
  options: AuthenticationOptions,
  /** @hidden */
  logger: typeof Logger.Service = eventLogger
): Promise<AuthenticationSuccess | AuthenticationError> =>
  pipe(
    authenticatePasskeyM(options),
    Micro.provideService(AuthenticationHelper, AuthenticationHelper.Default),
    Micro.provideService(Logger, logger),
    runToPromise
  )

/* Signals */

/**
 * Attempt to update the username or display name for a passkey (client-side only).
 *
 * Useful if the user has changed their account identifier. For example, they register
 * using jdoe@gmail.com but later change their account username to jdoe@yahoo.com.
 * Even after you update their account details in your backend, their local password
 * manager will continue to display jdoe@gmail.com.
 *
 * By calling this function and supplying a new username/display name, their local
 * password manager will align with their updated account identifier.
 *
 * @param options
 * @returns Update status
 * @see {@link isUpdateError}
 *
 * @example
 * // from your Passlock console settings
 * const tenancyId = "myTenancyId";
 * const passkeyId = "myPasskeyId";
 * const username = "newUsername@gmail.com";
 * const displayName = "New Account Name";
 *
 * const result = await updatePasskey({ tenancyId, passkeyId, username, displayName });
 *
 * if (result === true) {
 *   console.log("passkey updated locally");
 * } else if (isUpdateError(result)) {
 *   // narrowed to an UpdateError type
 *   console.error(result.code);
 * } else {
 *   console.error("unable to update passkey");
 * }
 *
 * @category Passkeys (core)
 */
export const updatePasskey = (
  options: UpdatePasskeyOptions,
  /** @hidden */
  logger: typeof Logger.Service = eventLogger
): Promise<boolean | UpdateError> => {
  const micro = updatePasskeyM(options)
  return pipe(micro, Micro.provideService(Logger, logger), runToPromise)
}

/**
 * Attempts to delete a passkey from a local device. There are two scenarios in which this function proves useful:
 *
 * 1. **Deleting a passkey**. Use the `@passlock/node` package or make  vanilla REST calls from your
 * backend to delete the server-side component, then use this function to delete the client-side component.
 *
 * 2. **Missing passkey**. The user tried to present a passkey, but the server-side component could not be found.
 * Remove the passkey from the local device to prevent it happening again.
 *
 * See [deleting passkeys](https://passlock.dev/passkeys/passkey-removal/) and
 * [handling missing passkeys](https://passlock.dev/handling-missing-passkeys/) in the documentation.
 *
 * @param identifiers Passkey identifier, credential mapping, or a {@link PasskeyNotFoundError}
 * payload from failed authentication.
 * @param options Passlock tenancy and endpoint options.
 * @returns Delete status
 * @see {@link isDeleteError}
 *
 * @example
 * // from your Passlock console settings
 * const tenancyId = "myTenancyId";
 * const passkeyId = "myPasskeyId";
 *
 * const result = await deletePasskey(passkeyId, { tenancyId });
 *
 * if (result === true) {
 *   console.log("passkey deleted locally");
 * } else if (isDeleteError(result)) {
 *   // narrowed to a DeleteError type
 *   console.error(result.code);
 * } else {
 *   console.error("unable to delete passkey");
 * }
 *
 * @category Passkeys (core)
 */
export const deletePasskey = (
  identifiers: string | CredentialMapping | PasskeyNotFoundError,
  options: PasslockOptions,
  /** @hidden */
  logger: typeof Logger.Service = eventLogger
): Promise<boolean | DeleteError> => {
  const micro =
    typeof identifiers === "string"
      ? deletePasskeyM(identifiers, options)
      : signalCredentialRemoval(identifiers)

  return pipe(micro, Micro.provideService(Logger, logger), runToPromise)
}

/**
 * Attempt to prune local passkeys by keeping only the passkey IDs you trust.
 *
 * This is useful when your backend is the source of truth for which passkeys
 * should still exist for a given account on this device.
 *
 * @param passkeyIds IDs to keep on-device.
 * @param options Passlock tenancy and endpoint options.
 * @returns Pruning status
 * @see {@link isPruningError}
 *
 * @example
 * // from your Passlock console settings
 * const tenancyId = "myTenancyId";
 * const activePasskeyIds = ["passkey-1", "passkey-2"];
 *
 * const result = await prunePasskeys(activePasskeyIds, { tenancyId });
 *
 * if (result === true) {
 *   console.log("local passkeys pruned");
 * } else if (isPruningError(result)) {
 *   // narrowed to a PruningError type
 *   console.error(result.code);
 * } else {
 *   console.error("unable to prune passkeys");
 * }
 *
 * @category Passkeys (core)
 */
export const prunePasskeys = (
  passkeyIds: Array<string>,
  options: PasslockOptions,
  /** @hidden */
  logger: typeof Logger.Service = eventLogger
): Promise<boolean | PruningError> => {
  const micro = prunePasskeysM(passkeyIds, options)
  return pipe(micro, Micro.provideService(Logger, logger), runToPromise)
}

/* Support */

/**
 * Does the local device support programmatic passkey deletion
 *
 * @returns `true` if local passkey deletion is supported.
 *
 * @category Passkeys (other)
 */
export const isPasskeyDeleteSupport = () =>
  pipe(isPasskeyDeleteSupportM, Micro.runSync)

/**
 * Does the local device support programmatic passkey pruning
 *
 * @returns `true` if local passkey pruning is supported.
 *
 * @category Passkeys (other)
 */
export const isPasskeyPruningSupport = () =>
  pipe(isPasskeyPruningSupportM, Micro.runSync)

/**
 * Does the local device support programmatic passkey updates
 *
 * @returns `true` if local passkey updates are supported.
 *
 * @category Passkeys (other)
 */
export const isPasskeyUpdateSupport = () =>
  pipe(isPasskeyUpdateSupportM, Micro.runSync)

/* Re-exports */

export type { NetworkError } from "./internal/network"
export { isNetworkError } from "./internal/network"
export {
  LogEvent,
  Logger,
  LogLevel,
} from "./logger"
export type { PasslockOptions } from "./options"
export type {
  AuthenticationError,
  AuthenticationEvent,
  AuthenticationOptions,
  AuthenticationSuccess,
  OnAuthenticationEvent,
} from "./passkey/authentication/authentication"
export {
  AuthenticationHelper,
  isAuthenticationSuccess,
} from "./passkey/authentication/authentication"
export type { ErrorCode } from "./passkey/errors"
export {
  DeleteError,
  DuplicatePasskeyError,
  isDeleteError,
  isDuplicatePasskeyError,
  isOtherPasskeyError,
  isPasskeyNotFoundError,
  isPasskeyUnsupportedError,
  isPruningError,
  isUpdateError,
  OtherPasskeyError,
  PasskeyNotFoundError,
  PasskeyUnsupportedError,
  PruningError,
  UpdateError,
} from "./passkey/errors"
export type {
  OnRegistrationEvent,
  RegistrationError,
  RegistrationEvent,
  RegistrationOptions,
  RegistrationSuccess,
} from "./passkey/registration/registration"
export {
  isRegistrationSuccess,
  RegistrationHelper,
} from "./passkey/registration/registration"
export type { UserVerification } from "./passkey/shared"
export type {
  CredentialMapping,
  UpdatePasskeyOptions,
} from "./passkey/signals/signals"
export {
  isAutofillSupport,
  isPasskeySupport,
} from "./passkey/support"
export type { Principal } from "./principal"
