/**
 * _safe_ functions i.e. functions that return result envelopes over the original
 * tagged success and error payloads. Use `result.success` or `result.failure`
 * to branch between success and error outcomes. Existing type guards and `_tag`
 * checks remain supported.
 *
 * Note: unexpected runtime failures may still throw.
 *
 * @example
 * const result = await registerPasskey({ tenancyId, username: "jdoe@gmail.com" });
 *
 * if (result.success) {
 *   console.log(result.value.code);
 * }
 *
 * if (result.failure) {
 *   console.log(result.error.message);
 * }
 *
 * @categoryDescription Passkeys (core)
 * Creating, authenticating, updating and deleting passkeys. {@link registerPasskey}
 * and {@link authenticatePasskey} are the key functions.
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
import type { Result } from "./internal/result.js"
import { runToPromise } from "./internal/index.js"
import { eventLogger, Logger } from "./logger.js"
import type {
  AuthenticationError,
  AuthenticationOptions,
  AuthenticationSuccess,
} from "./passkey/authentication/authentication.js"
import {
  AuthenticationHelper,
  authenticatePasskey as authenticatePasskeyM,
} from "./passkey/authentication/authentication.js"
import type {
  DeleteError,
  OrphanedPasskeyError,
  PruningError,
  UpdateError,
} from "./passkey/errors.js"

import type {
  RegistrationError,
  RegistrationOptions,
  RegistrationSuccess,
} from "./passkey/registration/registration.js"
import {
  RegistrationHelper,
  registerPasskey as registerPasskeyM,
} from "./passkey/registration/registration.js"

import type {
  Credential,
  DeleteCredentialOptions,
  DeletePasskeyOptions,
  DeleteSuccess,
  PrunePasskeyOptions,
  PruningSuccess,
  UpdateCredentialOptions,
  UpdatePasskeyOptions,
  UpdateSuccess,
} from "./passkey/signals/signals.js"
import {
  deletePasskey as deletePasskeyM,
  deleteUserPasskeys as deleteUserPasskeysM,
  isDeleteSuccess,
  isPasskeyDeleteSupport as isPasskeyDeleteSupportM,
  isPasskeyPruningSupport as isPasskeyPruningSupportM,
  isPasskeyUpdateSupport as isPasskeyUpdateSupportM,
  isPruningSuccess,
  isUpdateSuccess,
  prunePasskeys as prunePasskeysM,
  updatePasskey as updatePasskeyM,
  updatePasskeyUsernames as updatePasskeyUsernamesM,
} from "./passkey/signals/signals.js"

/* Registration */

/**
 * Registers a passkey on the user's device, then saves the server-side component in your vault.
 * If successful, this function returns both a `code` and an `id_token` (JWT).
 * Send either value to your backend for verification. See
 * [register a passkey](https://passlock.dev/passkeys/registration/) in the documentation.
 *
 * @param options
 *
 * @returns A {@link Result} whose success branch contains a {@link RegistrationSuccess}
 * and whose error branch contains a {@link RegistrationError}. Existing
 * {@link isRegistrationSuccess} checks and `_tag` discrimination still work.
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
 * if (result.success) {
 *   // send this to your backend for verification
 *   console.log(result.value.code);
 * } else if (result.failure && isPasskeyUnsupportedError(result.error)) {
 *   // ^^ using an error type guard
 *   console.log("Device does not support passkeys");
 * } else if (result.failure && result.error._tag === "@error/OtherPasskey") {
 *   // ^^ narrowing the result using the _tag
 *   console.log(result.error.message);
 * } else {
 *  ...
 * }
 *
 * @category Passkeys (core)
 */
export const registerPasskey = async (
  options: RegistrationOptions,
  /** @hidden */
  logger: typeof Logger.Service = eventLogger
): Promise<Result<RegistrationSuccess, RegistrationError>> =>
  pipe(
    registerPasskeyM(options),
    Micro.provideService(RegistrationHelper, RegistrationHelper.Default),
    Micro.provideService(Logger, logger),
    runToPromise
  )

/* Authentication */

/**
 * Asks the client to present a passkey, which is then verified against the server-side component in your vault.
 * If successful, this function returns both a `code` and an `id_token` (JWT).
 * Send either value to your backend for verification. See
 * [authenticate a passkey](https://passlock.dev/passkeys/authentication/) in the documentation.
 *
 * @param options
 *
 * @returns A {@link Result} whose success branch contains an
 * {@link AuthenticationSuccess} and whose error branch contains an
 * {@link AuthenticationError}. Existing {@link isAuthenticationSuccess}
 * checks and `_tag` discrimination still work.
 *
 * @see {@link isAuthenticationSuccess}
 * @see {@link isPasskeyUnsupportedError}
 * @see {@link isOrphanedPasskeyError}
 * @see {@link isOtherPasskeyError}
 *
 * @example
 * // from your Passlock console settings
 * const tenancyId = "myTenancyId";
 *
 * const result = await authenticatePasskey({ tenancyId });
 *
 * if (result.success) {
 *   // send this to your backend for verification
 *   console.log(result.value.code);
 * } else if (result.failure && isPasskeyUnsupportedError(result.error)) {
 *   // ^^ using an error type guard
 *   console.log("Device does not support passkeys");
 * } else if (result.failure && result.error._tag === "@error/OtherPasskey") {
 *   // ^^ narrowing the result using the _tag
 *   console.log(result.error.message);
 * }
 *
 * @category Passkeys (core)
 */
export const authenticatePasskey = (
  options: AuthenticationOptions,
  /** @hidden */
  logger: typeof Logger.Service = eventLogger
): Promise<Result<AuthenticationSuccess, AuthenticationError>> =>
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
 * @param options You will typically supply a target `passkeyId` via
 * {@link UpdatePasskeyOptions}. {@link UpdateCredentialOptions} is intended
 * for credential-scoped updates, for example when replaying data returned by
 * `@passlock/server`.
 * @returns A {@link Result} whose success branch contains an {@link UpdateSuccess}
 * and whose error branch contains an {@link UpdateError}. Existing
 * {@link isUpdateSuccess}, {@link isUpdateError}, and `_tag` checks still work.
 *
 * @see {@link isUpdateSuccess}
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
 * if (result.success) {
 *   console.log("passkey updated locally");
 * } else if (result.failure && isUpdateError(result.error)) {
 *   // narrowed to an UpdateError type
 *   console.log(result.error.code);
 * } else {
 *   console.log("unable to update passkey");
 * }
 *
 * @category Passkeys (core)
 */
export const updatePasskey = (
  options: UpdatePasskeyOptions | UpdateCredentialOptions,
  /** @hidden */
  logger: typeof Logger.Service = eventLogger
): Promise<Result<UpdateSuccess, UpdateError>> => {
  const micro = updatePasskeyM(options)
  return pipe(micro, Micro.provideService(Logger, logger), runToPromise)
}

/**
 * Attempt to update the username and/or display name for multiple passkeys (client-side only).
 *
 * Useful if the user has changed their account identifier. For example, they register
 * using jdoe@gmail.com but later change their account username to jdoe@yahoo.com.
 * Even after you update their account details in your backend, their local password
 * manager will continue to display jdoe@gmail.com.
 *
 * By calling this function and supplying a new username/display name, their local
 * password manager will align with their updated account identifier.
 *
 * @param options The `credentials` array returned by
 * `@passlock/server/safe`'s `updatePasskeyUsernames` success branch.
 * @returns A {@link Result} whose success branch contains an {@link UpdateSuccess}
 * and whose error branch contains an {@link UpdateError}. Existing
 * {@link isUpdateSuccess}, {@link isUpdateError}, and `_tag` checks still work.
 *
 * @see {@link isUpdateSuccess}
 * @see {@link isUpdateError}
 *
 * @example
 * // server code
 * import { updatePasskeyUsernames } from "@passlock/server/safe";
 *
 * const backendResult = await updatePasskeyUsernames({
 *   tenancyId,
 *   userId,
 *   username,
 *   displayName,
 * });
 * if (backendResult.success) {
 *   // send backendResult.value.credentials to your frontend
 * }
 *
 * // client code
 * import { updatePasskeyUsernames } from "@passlock/client/safe";
 *
 * const credentialsFromBackend = [
 *   {
 *     userId: "base64url-user-id",
 *     rpId: "example.com",
 *     username: "jdoe@yahoo.com",
 *     displayName: "Jane Doe",
 *   },
 * ];
 * const result = await updatePasskeyUsernames(credentialsFromBackend);
 *
 * if (result.success) {
 *   console.log("passkeys updated locally");
 * } else if (result.failure && isUpdateError(result.error)) {
 *   // narrowed to an UpdateError type
 *   console.log(result.error.code);
 * } else {
 *   console.log("unable to update passkey");
 * }
 *
 * @category Passkeys (core)
 */
export const updatePasskeyUsernames = (
  options: ReadonlyArray<UpdateCredentialOptions>,
  /** @hidden */
  logger: typeof Logger.Service = eventLogger
): Promise<Result<UpdateSuccess, UpdateError>> => {
  const micro = updatePasskeyUsernamesM(options)
  return pipe(micro, Micro.provideService(Logger, logger), runToPromise)
}

/**
 * Attempt to delete multiple passkeys from a local device.
 *
 * Use this after deleting the server-side passkeys. The `deleted` array returned
 * by `@passlock/server/safe` already has the right shape, so you can pass it
 * straight into this function.
 *
 * @param options Credentials derived from deleted backend passkeys.
 * @returns A {@link Result} whose success branch contains a {@link DeleteSuccess}
 * and whose error branch contains a {@link DeleteError}. Existing
 * {@link isDeleteSuccess}, {@link isDeleteError}, and `_tag` checks still work.
 * @see {@link isDeleteSuccess}
 * @see {@link isDeleteError}
 *
 * @example
 * // server code
 * import { deleteUserPasskeys } from "@passlock/server/safe";
 *
 * const backendResult = await deleteUserPasskeys({
 *   tenancyId,
 *   userId,
 *   apiKey,
 * });
 *
 * if (backendResult.success) {
 *   // client code
 *   const result = await deleteUserPasskeys(backendResult.value.deleted);
 *   console.log(result);
 * }
 *
 * @category Passkeys (core)
 */
export const deleteUserPasskeys = (
  options: ReadonlyArray<Credential>,
  /** @hidden */
  logger: typeof Logger.Service = eventLogger
): Promise<Result<DeleteSuccess, DeleteError>> => {
  const micro = deleteUserPasskeysM(options)
  return pipe(micro, Micro.provideService(Logger, logger), runToPromise)
}

/**
 * Attempts to delete a passkey from a local device. There are two scenarios in which this function is useful:
 *
 * 1. **Deleting a passkey** - Use the `@passlock/server` package or make vanilla REST calls from your
 * backend to delete the server-side component, then use this function to delete the client-side component.
 *
 * 2. **Missing passkey** - When a user presented a passkey but the server-side component could not be found.
 * Remove the passkey from the local device to prevent it happening again.
 *
 * See [deleting passkeys](https://passlock.dev/passkeys/passkey-removal/) and
 * [handling missing passkeys](https://passlock.dev/handling-missing-passkeys/) in the documentation.
 *
 * @param options You will typically pass {@link DeletePasskeyOptions}, the other types are for advanced use cases/optimizations.
 * @returns A {@link Result} whose success branch contains a {@link DeleteSuccess}
 * and whose error branch contains a {@link DeleteError}. Existing
 * {@link isDeleteSuccess}, {@link isDeleteError}, and `_tag` checks still work.
 * @see {@link isDeleteSuccess}
 * @see {@link isDeleteError}
 *
 * @example
 * // from your Passlock console settings
 * const tenancyId = "myTenancyId";
 * const passkeyId = "myPasskeyId";
 *
 * const result = await deletePasskey({ tenancyId, passkeyId });
 *
 * if (result.success) {
 *   console.log("passkey deleted locally");
 * } else if (result.failure && isDeleteError(result.error)) {
 *   // narrowed to a DeleteError type
 *   console.log(result.error.code);
 * } else {
 *   console.log("unable to delete passkey");
 * }
 *
 * @category Passkeys (core)
 */
export const deletePasskey = (
  options:
    | DeletePasskeyOptions
    | DeleteCredentialOptions
    | OrphanedPasskeyError,
  /** @hidden */
  logger: typeof Logger.Service = eventLogger
): Promise<Result<DeleteSuccess, DeleteError>> => {
  const micro = deletePasskeyM(options)
  return pipe(micro, Micro.provideService(Logger, logger), runToPromise)
}

/**
 * Attempt to prune local passkeys by keeping only the passkey IDs you trust.
 *
 * This is useful when your backend is the source of truth for which passkeys
 * should still exist for a given account on this device.
 *
 * @param options Pass the passkeys you **want to retain**.
 * @returns A {@link Result} whose success branch contains a {@link PruningSuccess}
 * and whose error branch contains a {@link PruningError}. Existing
 * {@link isPruningSuccess}, {@link isPruningError}, and `_tag` checks still work.
 *
 * @see {@link isPruningSuccess}
 * @see {@link isPruningError}
 *
 * @example
 * // from your Passlock console settings
 * const tenancyId = "myTenancyId";
 * const allowablePasskeyIds = ["passkey-1", "passkey-2"];
 *
 * const result = await prunePasskeys({ tenancyId, allowablePasskeyIds });
 *
 * if (result.success) {
 *   console.log("local passkeys pruned");
 * } else if (result.failure && isPruningError(result.error)) {
 *   // narrowed to a PruningError type
 *   console.log(result.error.code);
 * } else {
 *   console.log("unable to prune passkeys");
 * }
 *
 * @category Passkeys (core)
 */
export const prunePasskeys = (
  options: PrunePasskeyOptions,
  /** @hidden */
  logger: typeof Logger.Service = eventLogger
): Promise<Result<PruningSuccess, PruningError>> => {
  const micro = prunePasskeysM(options)
  return pipe(micro, Micro.provideService(Logger, logger), runToPromise)
}

/* Support */

/**
 * Does the local device support programmatic passkey deletion?
 *
 * @returns `true` if local passkey deletion is supported.
 *
 * @category Passkeys (other)
 */
export const isPasskeyDeleteSupport = () =>
  pipe(isPasskeyDeleteSupportM, Micro.runSync)

/**
 * Does the local device support programmatic passkey pruning?
 *
 * @returns `true` if local passkey pruning is supported.
 *
 * @category Passkeys (other)
 */
export const isPasskeyPruningSupport = () =>
  pipe(isPasskeyPruningSupportM, Micro.runSync)

/**
 * Does the local device support programmatic passkey updates?
 *
 * @returns `true` if local passkey updates are supported.
 *
 * @category Passkeys (other)
 */
export const isPasskeyUpdateSupport = () =>
  pipe(isPasskeyUpdateSupportM, Micro.runSync)

/* Re-exports */

export type { Err, Ok, Result } from "./internal/result.js"
export { isNetworkError, NetworkError } from "./internal/network.js"
export {
  LogEvent,
  Logger,
  LogLevel,
} from "./logger.js"
export type { PasslockOptions } from "./options.js"
export type {
  AuthenticationError,
  AuthenticationEvent,
  AuthenticationEvents,
  AuthenticationOptions,
  AuthenticationSuccess,
  OnAuthenticationEvent,
} from "./passkey/authentication/authentication.js"
export {
  AuthenticationHelper,
  isAuthenticationSuccess,
} from "./passkey/authentication/authentication.js"
export type { ErrorCode } from "./passkey/errors.js"
export {
  DeleteError,
  DuplicatePasskeyError,
  isDeleteError,
  isDuplicatePasskeyError,
  isOrphanedPasskeyError,
  isOtherPasskeyError,
  isPasskeyUnsupportedError,
  isPruningError,
  isUpdateError,
  OrphanedPasskeyError,
  OtherPasskeyError,
  PasskeyUnsupportedError,
  PruningError,
  UpdateError,
} from "./passkey/errors.js"
export type {
  OnRegistrationEvent,
  RegistrationError,
  RegistrationEvent,
  RegistrationOptions,
  RegistrationSuccess,
} from "./passkey/registration/registration.js"
export {
  isRegistrationSuccess,
  RegistrationHelper,
} from "./passkey/registration/registration.js"
export type { UserVerification } from "./passkey/shared.js"
export type {
  Credential,
  DeleteCredentialOptions,
  DeletePasskeyOptions,
  DeleteSuccess,
  PrunePasskeyOptions,
  PruningSuccess,
  UpdateCredentialOptions,
  UpdatePasskeyOptions,
  UpdateSuccess,
} from "./passkey/signals/signals.js"
export {
  isDeleteSuccess,
  isPruningSuccess,
  isUpdateSuccess,
} from "./passkey/signals/signals.js"
export {
  isAutofillSupport,
  isPasskeySupport,
} from "./passkey/support.js"
export type { Principal } from "./principal.js"
