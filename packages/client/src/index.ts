/**
 * _unsafe_ functions that could throw an error. Be sure to catch errors and use one of the
 * type guards to narrow the thrown error down to a specific type.
 *
 * @categoryDescription Passkeys (core)
 * Creating, authenticating, updating and deleting passkeys. {@link registerPasskey}
 * and {@link authenticatePasskey} are the key functions.
 *
 * @categoryDescription Passkeys (other)
 * Testing for browser capabilities related to passkeys, type guards and other utilities.
 *
 * @showCategories
 * @module unsafe
 */

import { Micro, pipe } from "effect"
import { runToPromiseUnsafe } from "./internal"
import { eventLogger, Logger } from "./logger"
import type {
  AuthenticationOptions,
  AuthenticationSuccess,
} from "./passkey/authentication/authentication"
import {
  AuthenticationHelper,
  authenticatePasskey as authenticatePasskeyM,
} from "./passkey/authentication/authentication"
import type {
  RegistrationOptions,
  RegistrationSuccess,
} from "./passkey/registration/registration"
import {
  RegistrationHelper,
  registerPasskey as registerPasskeyM,
} from "./passkey/registration/registration"
import type {
  DeleteCredentialOptions,
  DeletePasskeyOptions,
  DeleteSuccess,
  PrunePasskeyOptions,
  PruningSuccess,
  UpdateCredentialOptions,
  UpdatePasskeyOptions,
  UpdateSuccess,
} from "./passkey/signals/signals"
import {
  deletePasskey as deletePasskeyM,
  isPasskeyDeleteSupport as isPasskeyDeleteSupportM,
  isPasskeyPruningSupport as isPasskeyPruningSupportM,
  isPasskeyUpdateSupport as isPasskeyUpdateSupportM,
  prunePasskeys as prunePasskeysM,
  updatePasskey as updatePasskeyM,
} from "./passkey/signals/signals"
import type { OrphanedPasskeyError } from "./safe"

/* Registration */

/**
 * Registers a passkey on the user's device, then saves the server-side component in your vault.
 * If successful, this function returns both a `code` and an `id_token` (JWT).
 * Send either value to your backend for verification.
 * See [register a passkey](https://passlock.dev/passkeys/registration/) in the documentation.
 *
 * @param options
 *
 * @returns A successful registration payload.
 *
 * @see {@link isRegistrationSuccess}
 * @see {@link isPasskeyUnsupportedError}
 * @see {@link isDuplicatePasskeyError}
 * @see {@link isOtherPasskeyError}
 *
 * @throws {@link RegistrationError} (alias to a union of potential errors)
 * @throws {@link PasskeyUnsupportedError} if the device does not support passkeys
 * @throws {@link DuplicatePasskeyError} if `excludeCredentials` includes a passkey that already exists on the device
 * @throws {@link OtherPasskeyError} typically a low level failure
 * @throws {@link NetworkError}
 *
 * @example
 * // from your Passlock console settings
 * const tenancyId = "myTenancyId";
 * const username = "jdoe@gmail.com";
 *
 * try {
 *   const result = await registerPasskey({ tenancyId, username });
 *   // send this to your backend for verification
 *   console.log(result.code);
 * } catch (error) {
 *   if (isPasskeyUnsupportedError(error)) {
 *     alert("passkeys not supported on this device");
 *   } else {
 *     console.log(error);
 *   }
 * }
 *
 * @category Passkeys (core)
 */
export const registerPasskey = async (
  options: RegistrationOptions,
  /** @hidden */
  logger: typeof Logger.Service = eventLogger
): Promise<RegistrationSuccess> =>
  pipe(
    registerPasskeyM(options),
    Micro.provideService(RegistrationHelper, RegistrationHelper.Default),
    Micro.provideService(Logger, logger),
    runToPromiseUnsafe
  )

/* Authentication */

/**
 * Asks the client to present a passkey, which is then verified against the server-side component in your vault.
 * If successful, this function returns both a `code` and an `id_token` (JWT). Send either value to your backend for verification.
 * See
 * [authenticate a passkey](https://passlock.dev/passkeys/authentication/) in the documentation.
 *
 * @param options
 *
 * @returns A successful authentication payload.
 *
 * @see {@link isAuthenticationSuccess}
 * @see {@link isPasskeyUnsupportedError}
 * @see {@link isOrphanedPasskeyError}
 * @see {@link isOtherPasskeyError}
 *
 * @throws {@link AuthenticationError} (alias to a union of potential errors)
 * @throws {@link PasskeyUnsupportedError} if the device does not support passkeys
 * @throws {@link OrphanedPasskeyError} if the passkey is orphaned i.e. deleted from the vault but still present on the local device
 * @throws {@link OtherPasskeyError} typically a low level failure
 * @throws {@link NetworkError}
 *
 * @example
 * // from your Passlock console settings
 * const tenancyId = "myTenancyId";
 *
 * try {
 *   const result = await authenticatePasskey({ tenancyId });
 *   // send this to your backend for verification
 *   console.log(result.code);
 * } catch (error) {
 *   if (isPasskeyUnsupportedError(error)) {
 *     alert("passkeys not supported on this device");
 *   } else {
 *     console.log(error);
 *   }
 * }
 *
 * @category Passkeys (core)
 */
export const authenticatePasskey = (
  options: AuthenticationOptions,
  /** @hidden */
  logger: typeof Logger.Service = eventLogger
): Promise<AuthenticationSuccess> =>
  pipe(
    authenticatePasskeyM(options),
    Micro.provideService(AuthenticationHelper, AuthenticationHelper.Default),
    Micro.provideService(Logger, logger),
    runToPromiseUnsafe
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
 * @param options You will typically supply a target `passkeyId` via {@link UpdatePasskeyOptions}. {@link UpdateCredentialOptions} is for advanced use cases.
 * @returns Update status
 * @see {@link isUpdateError}
 * @throws {@link UpdateError} if the passkey cannot be updated
 *
 * @example
 * // from your Passlock console settings
 * const tenancyId = "myTenancyId";
 * const passkeyId = "myPasskeyId";
 * const username = "newUsername@gmail.com";
 * const displayName = "New Account Name";
 *
 * try {
 *   const result = await updatePasskey({ tenancyId, passkeyId, username, displayName });
 *   console.log("passkey updated");
 * } catch (error) {
 *   console.log(error);
 * }
 *
 * @category Passkeys (core)
 */
export const updatePasskey = (
  options: UpdatePasskeyOptions | UpdateCredentialOptions,
  /** @hidden */
  logger: typeof Logger.Service = eventLogger
): Promise<UpdateSuccess> => {
  const micro = updatePasskeyM(options)
  return pipe(micro, Micro.provideService(Logger, logger), runToPromiseUnsafe)
}

/**
 * Attempts to delete a passkey from a local device. There are two scenarios in which this function proves useful:
 *
 * 1. **Deleting a passkey**. Use the `@passlock/node` package or make vanilla REST calls from your
 * backend to delete the server-side component, then use this function to delete the client-side component.
 *
 * 2. **Missing passkey**. The user tried to present a passkey, but the server-side component could not be found.
 * Remove the passkey from the local device to prevent it happening again.
 *
 * See [deleting passkeys](https://passlock.dev/passkeys/passkey-removal/) and
 * [handling missing passkeys](https://passlock.dev/handling-missing-passkeys/) in the documentation.
 *
 * @param options You typically pass a {@link DeletePasskeyOptions}, the other types are for advanced edge-cases.
 * @returns A {@link DeleteSuccess} payload if the passkey is deleted.
 * @see {@link isDeleteError}
 * @throws {@link DeleteError} if the passkey cannot be deleted
 *
 * @example
 * // from your Passlock console settings
 * const tenancyId = "myTenancyId";
 * const passkeyId = "myPasskeyId";
 *
 * try {
 *   const result = await deletePasskey({ tenancyId, passkeyId });
 *   console.log("passkey deleted");
 * } catch (error) {
 *   console.log(error);
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
): Promise<DeleteSuccess> => {
  const micro = deletePasskeyM(options)
  return pipe(micro, Micro.provideService(Logger, logger), runToPromiseUnsafe)
}

/**
 * Attempt to prune local passkeys by keeping only the passkey IDs you trust.
 *
 * This is useful when your backend is the source of truth for which passkeys
 * should still exist for a given account on this device.
 *
 * @param options Pass the passkeys you want to retain.
 * @returns A {@link PruningSuccess} payload if local passkeys were pruned.
 * @see {@link isPruningError}
 *
 * @throws {@link PruningError}
 *
 * @example
 * // from your Passlock console settings
 * const tenancyId = "myTenancyId";
 * const allowablePasskeyIds = ["passkey-1", "passkey-2"];
 *
 * try {
 *   const result = await prunePasskeys({ tenancyId, allowablePasskeyIds });
 *   console.log("local passkeys pruned", result);
 * } catch (error) {
 *   if (isPruningError(error)) {
 *     console.log(error.code);
 *   } else {
 *     console.log(error);
 *   }
 * }
 *
 * @category Passkeys (core)
 */
export const prunePasskeys = (
  options: PrunePasskeyOptions,
  /** @hidden */
  logger: typeof Logger.Service = eventLogger
): Promise<PruningSuccess> => {
  const micro = prunePasskeysM(options)
  return pipe(micro, Micro.provideService(Logger, logger), runToPromiseUnsafe)
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

export { isNetworkError, NetworkError } from "./internal/network"
export {
  LogEvent,
  Logger,
  LogLevel,
} from "./logger"
export type { PasslockOptions } from "./options"
export type {
  AuthenticationError,
  AuthenticationEvent,
  AuthenticationEvents,
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
  DeleteCredentialOptions,
  DeletePasskeyOptions,
  DeleteSuccess,
  PrunePasskeyOptions,
  PruningSuccess,
  UpdateCredentialOptions,
  UpdatePasskeyOptions,
  UpdateSuccess,
} from "./passkey/signals/signals"
export {
  isDeleteSuccess,
  isPruningSuccess,
  isUpdateSuccess,
} from "./passkey/signals/signals"
export {
  isAutofillSupport,
  isPasskeySupport,
} from "./passkey/support"
export type { Principal } from "./principal"
