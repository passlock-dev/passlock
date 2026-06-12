/**
 * These methods and functions are **_safe_** i.e. they return wrappers over
 * success and error payloads. Use result.success or result.failure
 * to branch between success and error outcomes.
 *
 * Choose the Passlock client is you prefer a class based API. Alternatively,
 * import standalone tree-shakeable functions.
 *
 * **Note:** unexpected runtime failures may still throw.
 *
 * @example
 * ```ts
 * // Using the Passlock class
 * import { Passlock } from '@passlock/browser';
 *
 * // use authorizePasskeyRegistration() in your backend to obtain a registration token
 * const registrationToken = await fetchRegistrationToken();
 *
 * // pass the config to the constructor
 * const passlock = new Passlock({ tenancyId });
 * const result = await passlock.registerPasskey({ registrationToken });
 *
 * if (result.success) {
 *   console.log(result.value.code);
 * }
 *
 * if (result.failure) {
 *   console.log(result.error.message);
 * }
 * ```
 *
 * @example
 * ```ts
 * // Using the standalone tree-shakeable functions
 * import { registerPasskey } from '@passlock/browser';
 *
 * // use authorizePasskeyRegistration() in your backend to obtain a registration token
 * const registrationToken = await fetchRegistrationToken();
 *
 * // pass the config as the second argument
 * const result = await registerPasskey({ registrationToken }, { tenancyId });
 *
 * if (result.success) {
 *   console.log(result.value.code);
 * }
 *
 * if (result.failure) {
 *   console.log(result.error.message);
 * }
 * ```
 *
 * @categoryDescription Clients
 * Class based API. Pass the Passlock config to the constructor.
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
 * @module index
 */

import { Micro, pipe } from "effect"
import { runToPromise } from "./internal/index.js"
import type { Result } from "./internal/result.js"
import { eventLogger, Logger } from "./logger.js"
import type { PasslockOptions } from "./options.js"
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

type SafeUpdatePasskey = (
  options: UpdatePasskeyOptions | UpdateCredentialOptions,
  config: PasslockOptions
) => Promise<Result<UpdateSuccess, UpdateError>>

type SafeDeletePasskey = (
  options: DeletePasskeyOptions | DeleteCredentialOptions | OrphanedPasskeyError,
  config: PasslockOptions
) => Promise<Result<DeleteSuccess, DeleteError>>

/* Registration */

/**
 * Register a passkey from a server-authorized registration token.
 *
 * Your backend should first call `authorizePasskeyRegistration` from
 * `@passlock/server`, return the resulting `registrationToken` to the browser,
 * then pass that token to this function.
 *
 * The browser uses the WebAuthn options returned by Passlock and does not send
 * an RP ID of its own.
 *
 * @param options Registration token and optional lifecycle callback.
 * @param config Passlock tenancy and API endpoint options.
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
 * const registrationToken = "registration-token-from-your-backend";
 *
 * const result = await registerPasskey({ registrationToken }, { tenancyId });
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
 * } else if (result.failure) {
 *   console.log(result.error.message);
 * }
 *
 * @category Passkeys (core)
 */
export const registerPasskey = async (
  options: RegistrationOptions,
  config: PasslockOptions,
  /** @hidden */
  logger: typeof Logger.Service = eventLogger
): Promise<Result<RegistrationSuccess, RegistrationError>> =>
  pipe(
    registerPasskeyM(options, config),
    Micro.provideService(RegistrationHelper, RegistrationHelper.Default),
    Micro.provideService(Logger, logger),
    runToPromise
  )

/* Authentication */

/**
 * Asks the device to present a passkey, then verifies it against the
 * server-side component in your vault.
 *
 * Pass an `authenticationToken` created by `@passlock/server`'s
 * `authorizePasskeyAuthentication` function. Relying party ID, allowed
 * credentials, user verification, timeout, and autofill/mediation policy are
 * all decided by your backend during authorization. If successful, this function
 * returns both a `code` and an `id_token` (JWT). Send either value to your
 * backend for verification.
 *
 * The browser uses the WebAuthn options returned by Passlock and does not send
 * an RP ID of its own.
 *
 * @param options Authentication ceremony options.
 * @param config Passlock tenancy and API endpoint options.
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
 * const authenticationToken = "authentication-token-from-your-backend";
 *
 * const result = await authenticatePasskey({ authenticationToken }, { tenancyId });
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
  config: PasslockOptions,
  /** @hidden */
  logger: typeof Logger.Service = eventLogger
): Promise<Result<AuthenticationSuccess, AuthenticationError>> =>
  pipe(
    authenticatePasskeyM(options, config),
    Micro.provideService(AuthenticationHelper, AuthenticationHelper.Default),
    Micro.provideService(Logger, logger),
    runToPromise
  )

/* Signals */

/**
 * Attempt to update the username or display name for a passkey on the local device.
 *
 * Useful if the user has changed their account identifier. For example, they register
 * using jdoe@gmail.com but later change their account username to jdoe@yahoo.com.
 * Even after you update their account details in your backend, their local password
 * manager will continue to display jdoe@gmail.com.
 *
 * By calling this function and supplying a new username/display name, their local
 * password manager will align with their updated account identifier.
 * Support and metadata lookup failures populate the error branch as
 * {@link UpdateError}. Browser-side signalling failures are logged as warnings
 * and do not populate the error branch.
 *
 * @param options You will typically supply a target `passkeyId` via
 * {@link UpdatePasskeyOptions}. {@link UpdateCredentialOptions} is intended
 * for credential-scoped updates, for example when replaying data returned by
 * `@passlock/server`.
 * @param config Passlock tenancy and API endpoint options. Required when
 * passing a Passlock passkey ID.
 * @returns A {@link Result} whose success branch contains an
 * {@link UpdateSuccess} after the local update workflow has been started, and
 * whose error branch contains an {@link UpdateError}.
 * Existing {@link isUpdateSuccess}, {@link isUpdateError}, and `_tag` checks
 * still work.
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
 * const result = await updatePasskey({ passkeyId, username, displayName }, { tenancyId });
 *
 * if (result.success) {
 *   console.log("passkey update requested");
 * } else {
 *   console.log(result.error.code);
 * }
 *
 * @category Passkeys (core)
 */
export function updatePasskey(
  options: UpdatePasskeyOptions,
  config: PasslockOptions,
  /** @hidden */
  logger?: typeof Logger.Service
): Promise<Result<UpdateSuccess, UpdateError>>
export function updatePasskey(
  options: UpdateCredentialOptions,
  config?: PasslockOptions,
  /** @hidden */
  logger?: typeof Logger.Service
): Promise<Result<UpdateSuccess, UpdateError>>
export function updatePasskey(
  options: UpdatePasskeyOptions | UpdateCredentialOptions,
  config?: PasslockOptions,
  /** @hidden */
  logger: typeof Logger.Service = eventLogger
): Promise<Result<UpdateSuccess, UpdateError>> {
  const micro =
    "rpId" in options ? updatePasskeyM(options) : updatePasskeyM(options, config as PasslockOptions)
  return pipe(micro, Micro.provideService(Logger, logger), runToPromise)
}

/**
 * Attempt to update the username and/or display name for multiple passkeys on the local device.
 *
 * Useful if the user has changed their account identifier. For example, they register
 * using jdoe@gmail.com but later change their account username to jdoe@yahoo.com.
 * Even after you update their account details in your backend, their local password
 * manager will continue to display jdoe@gmail.com.
 *
 * By calling this function and supplying a new username/display name, their local
 * password manager will align with their updated account identifier.
 * Support failures populate the error branch as {@link UpdateError}.
 * Browser-side signalling failures are logged as warnings and do not populate
 * the error branch.
 *
 * @param options The `credentials` array returned by
 * `@passlock/server`'s `updatePasskeyUsernames` success branch.
 * @returns A {@link Result} whose success branch contains an
 * {@link UpdateSuccess} after the local update workflows have been started,
 * and whose error branch contains an {@link UpdateError}.
 * Existing {@link isUpdateSuccess}, {@link isUpdateError}, and `_tag` checks
 * still work.
 *
 * @see {@link isUpdateSuccess}
 * @see {@link isUpdateError}
 *
 * @example
 * // server code
 * import { updatePasskeyUsernames as updatePasskeyUsernamesOnServer } from "@passlock/server";
 *
 * const backendResult = await updatePasskeyUsernamesOnServer({
 *   tenancyId,
 *   userId,
 *   username,
 *   displayName,
 * });
 * // send backendResult.value.credentials to your frontend when backendResult.success
 *
 * // browser code
 * import { updatePasskeyUsernames } from "@passlock/browser";
 *
 * const credentialsFromBackend = backendResult.value.credentials;
 * const result = await updatePasskeyUsernames(credentialsFromBackend);
 * console.log(result);
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
 * Attempt to signal removal of multiple passkeys from a local device.
 *
 * Use this after deleting the server-side passkeys. The `deleted` array returned
 * by `@passlock/server` already has the right shape, so you can pass it
 * straight into this function.
 * Support failures populate the error branch as {@link DeleteError}.
 * Browser-side signalling failures are logged as warnings and do not populate
 * the error branch.
 *
 * @param options Credentials derived from deleted backend passkeys.
 * @returns A {@link Result} whose success branch contains a
 * {@link DeleteSuccess} once the local removal workflows have been started,
 * and whose error branch contains a {@link DeleteError}. Existing
 * {@link isDeleteSuccess}, {@link isDeleteError}, and `_tag` checks still work.
 * @see {@link isDeleteSuccess}
 * @see {@link isDeleteError}
 *
 * @example
 * // server code
 * import { deleteUserPasskeys as deleteUserPasskeysOnServer } from "@passlock/server";
 *
 * const backendResult = await deleteUserPasskeysOnServer({
 *   tenancyId,
 *   userId,
 *   apiKey,
 * });
 *
 * // send backendResult.value.deleted to your frontend when backendResult.success
 *
 * // browser code
 * import { deleteUserPasskeys } from "@passlock/browser";
 *
 * const deletedCredentials = backendResult.value.deleted;
 * const result = await deleteUserPasskeys(deletedCredentials);
 * console.log(result);
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
 * Attempts to signal removal of a passkey from a local device. There are two
 * scenarios in which this function is useful:
 *
 * 1. **Deleting a passkey** - Use the `@passlock/server` package or make vanilla REST calls from your
 * backend to delete the server-side component, then use this function to delete the passkey from the user's local device.
 *
 * 2. **Missing passkey** - When a user presented a passkey but the server-side component could not be found.
 * Remove the passkey from the user's local device to prevent it happening again.
 *
 * See [deleting passkeys](https://passlock.dev/passkeys/passkey-removal/) and
 * [handling missing passkeys](https://passlock.dev/handling-missing-passkeys/) in the documentation.
 * Support and metadata lookup failures populate the error branch as
 * {@link DeleteError}. Browser-side signalling failures are logged as warnings
 * and do not populate the error branch.
 *
 * @param options You will typically pass {@link DeletePasskeyOptions}. Use
 * {@link DeleteCredentialOptions} or {@link OrphanedPasskeyError} when you
 * already have the credential metadata.
 * @param config Passlock tenancy and API endpoint options. Required when
 * passing a Passlock passkey ID.
 * @returns A {@link Result} whose success branch contains a
 * {@link DeleteSuccess} once the local removal workflow has been started, and
 * whose error branch contains a {@link DeleteError}. Existing
 * {@link isDeleteSuccess}, {@link isDeleteError}, and `_tag` checks still work.
 * @see {@link isDeleteSuccess}
 * @see {@link isDeleteError}
 *
 * @example
 * // from your Passlock console settings
 * const tenancyId = "myTenancyId";
 * const passkeyId = "myPasskeyId";
 *
 * const result = await deletePasskey({ passkeyId }, { tenancyId });
 *
 * if (result.success) {
 *   console.log("passkey removal requested");
 * } else {
 *   console.log(result.error.code);
 * }
 *
 * @category Passkeys (core)
 */
export function deletePasskey(
  options: DeletePasskeyOptions,
  config: PasslockOptions,
  /** @hidden */
  logger?: typeof Logger.Service
): Promise<Result<DeleteSuccess, DeleteError>>
export function deletePasskey(
  options: DeleteCredentialOptions | OrphanedPasskeyError,
  config?: PasslockOptions,
  /** @hidden */
  logger?: typeof Logger.Service
): Promise<Result<DeleteSuccess, DeleteError>>
export function deletePasskey(
  options: DeletePasskeyOptions | DeleteCredentialOptions | OrphanedPasskeyError,
  config?: PasslockOptions,
  /** @hidden */
  logger: typeof Logger.Service = eventLogger
): Promise<Result<DeleteSuccess, DeleteError>> {
  const micro =
    "rpId" in options ? deletePasskeyM(options) : deletePasskeyM(options, config as PasslockOptions)
  return pipe(micro, Micro.provideService(Logger, logger), runToPromise)
}

/**
 * Attempt to prune redundant local passkeys by keeping only the passkey IDs
 * you trust.
 *
 * This is useful when your backend is the source of truth for which passkeys
 * should still exist for a given account on this device. Only passkeys for the
 * same account on the same relying party can be pruned; passkeys for different
 * accounts are retained.
 * Support and metadata lookup failures populate the error branch as
 * {@link PruningError}. Browser-side signalling failures are logged as
 * warnings and do not populate the error branch.
 *
 * @param options Pass the passkey IDs you **want to retain** for that account
 * on this device.
 * @param config Passlock tenancy and API endpoint options.
 * @returns A {@link Result} whose success branch contains a
 * {@link PruningSuccess} once the accepted-credentials signalling attempt has
 * completed, and whose error branch contains a
 * {@link PruningError}. Existing {@link isPruningSuccess},
 * {@link isPruningError}, and `_tag` checks still work.
 *
 * @see {@link isPruningSuccess}
 * @see {@link isPruningError}
 *
 * @example
 * // from your Passlock console settings
 * const tenancyId = "myTenancyId";
 * const allowablePasskeyIds = ["passkey-1", "passkey-2"];
 *
 * const result = await prunePasskeys({ allowablePasskeyIds }, { tenancyId });
 *
 * if (result.success) {
 *   console.log("accepted credentials sync completed");
 * } else {
 *   console.log(result.error.code);
 * }
 *
 * @category Passkeys (core)
 */
export const prunePasskeys = (
  options: PrunePasskeyOptions,
  config: PasslockOptions,
  /** @hidden */
  logger: typeof Logger.Service = eventLogger
): Promise<Result<PruningSuccess, PruningError>> => {
  const micro = prunePasskeysM(options, config)
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
export const isPasskeyDeleteSupport = () => pipe(isPasskeyDeleteSupportM, Micro.runSync)

/**
 * Does the local device support programmatic passkey pruning via accepted
 * credentials signalling?
 *
 * @returns `true` if local passkey pruning is supported.
 *
 * @category Passkeys (other)
 */
export const isPasskeyPruningSupport = () => pipe(isPasskeyPruningSupportM, Micro.runSync)

/**
 * Does the local device support programmatic passkey updates?
 *
 * @returns `true` if local passkey updates are supported.
 *
 * @category Passkeys (other)
 */
export const isPasskeyUpdateSupport = () => pipe(isPasskeyUpdateSupportM, Micro.runSync)

/* Client */

const updatePasskeySafe = updatePasskey as SafeUpdatePasskey
const deletePasskeySafe = deletePasskey as SafeDeletePasskey

/**
 * Safe Passlock browser client.
 *
 * Methods return result envelopes over the original success and error payloads.
 * Use `result.success` or `result.failure` to branch between outcomes.
 *
 * @example
 * ```ts
 * import { Passlock } from '@passlock/browser';
 *
 * // use authorizePasskeyRegistration() in your backend to obtain a registration token
 * const registrationToken = await fetchRegistrationToken();
 *
 * // pass the config in the constructor
 * const passlock = new Passlock({ tenancyId });
 * const result = await passlock.registerPasskey({ registrationToken });
 *
 * if (result.success) {
 *   console.log(result.value.code);
 * }
 *
 * if (result.failure) {
 *   console.log(result.error.message);
 * }
 * ```
 *
 * @category Clients
 */
export class Passlock {
  readonly config: PasslockOptions

  constructor(config: PasslockOptions) {
    this.config = config
  }

  /**
   * Register a passkey from a server-authorized registration token.
   *
   * Your backend should first call `authorizePasskeyRegistration` from
   * `@passlock/server`, return the resulting `registrationToken` to the browser,
   * then pass that token to this method.
   *
   * The browser uses the WebAuthn options returned by Passlock and does not send
   * an RP ID of its own.
   *
   * @param options Registration token and optional lifecycle callback.
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
   * const registrationToken = "registration-token-from-your-backend";
   *
   * const passlock = new Passlock({ tenancyId });
   * const result = await passlock.registerPasskey({ registrationToken });
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
   * } else if (result.failure) {
   *   console.log(result.error.message);
   * }
   *
   * @category Passkeys (core)
   */
  registerPasskey(
    options: RegistrationOptions
  ): Promise<Result<RegistrationSuccess, RegistrationError>> {
    return registerPasskey(options, this.config)
  }

  /**
   * Asks the device to present a passkey, then verifies it against the
   * server-side component in your vault.
   *
   * Pass an `authenticationToken` created by `@passlock/server`'s
   * `authorizePasskeyAuthentication` function. Relying party ID, allowed
   * credentials, user verification, timeout, and autofill/mediation policy are
   * all decided by your backend during authorization. If successful, this method
   * returns both a `code` and an `id_token` (JWT). Send either value to your
   * backend for verification.
   *
   * The browser uses the WebAuthn options returned by Passlock and does not send
   * an RP ID of its own.
   *
   * @param options Authentication ceremony options.
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
   * const authenticationToken = "authentication-token-from-your-backend";
   *
   * const passlock = new Passlock({ tenancyId });
   * const result = await passlock.authenticatePasskey({ authenticationToken });
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
  authenticatePasskey(
    options: AuthenticationOptions
  ): Promise<Result<AuthenticationSuccess, AuthenticationError>> {
    return authenticatePasskey(options, this.config)
  }

  /**
   * Attempt to update the username or display name for a passkey on the local device.
   *
   * Useful if the user has changed their account identifier. For example, they register
   * using jdoe@gmail.com but later change their account username to jdoe@yahoo.com.
   * Even after you update their account details in your backend, their local password
   * manager will continue to display jdoe@gmail.com.
   *
   * By calling this method and supplying a new username/display name, their local
   * password manager will align with their updated account identifier.
   * Support and metadata lookup failures populate the error branch as
   * {@link UpdateError}. Browser-side signalling failures are logged as warnings
   * and do not populate the error branch.
   *
   * @param options You will typically supply a target `passkeyId` via
   * {@link UpdatePasskeyOptions}. {@link UpdateCredentialOptions} is intended
   * for credential-scoped updates, for example when replaying data returned by
   * `@passlock/server`.
   * @returns A {@link Result} whose success branch contains an
   * {@link UpdateSuccess} after the local update workflow has been started, and
   * whose error branch contains an {@link UpdateError}.
   * Existing {@link isUpdateSuccess}, {@link isUpdateError}, and `_tag` checks
   * still work.
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
   * const passlock = new Passlock({ tenancyId });
   * const result = await passlock.updatePasskey({ passkeyId, username, displayName });
   *
   * if (result.success) {
   *   console.log("passkey update requested");
   * } else {
   *   console.log(result.error.code);
   * }
   *
   * @category Passkeys (core)
   */
  updatePasskey(
    options: UpdatePasskeyOptions | UpdateCredentialOptions
  ): Promise<Result<UpdateSuccess, UpdateError>> {
    return updatePasskeySafe(options, this.config)
  }

  /**
   * Attempt to update the username and/or display name for multiple passkeys on the local device.
   *
   * Useful if the user has changed their account identifier. For example, they register
   * using jdoe@gmail.com but later change their account username to jdoe@yahoo.com.
   * Even after you update their account details in your backend, their local password
   * manager will continue to display jdoe@gmail.com.
   *
   * By calling this method and supplying a new username/display name, their local
   * password manager will align with their updated account identifier.
   * Support failures populate the error branch as {@link UpdateError}.
   * Browser-side signalling failures are logged as warnings and do not populate
   * the error branch.
   *
   * @param options The `credentials` array returned by
   * `@passlock/server`'s `updatePasskeyUsernames` success branch.
   * @returns A {@link Result} whose success branch contains an
   * {@link UpdateSuccess} after the local update workflows have been started,
   * and whose error branch contains an {@link UpdateError}.
   * Existing {@link isUpdateSuccess}, {@link isUpdateError}, and `_tag` checks
   * still work.
   *
   * @see {@link isUpdateSuccess}
   * @see {@link isUpdateError}
   *
   * @example
   * // server code
   * import { updatePasskeyUsernames as updatePasskeyUsernamesOnServer } from "@passlock/server";
   *
   * const backendResult = await updatePasskeyUsernamesOnServer({
   *   tenancyId,
   *   userId,
   *   username,
   *   displayName,
   * });
   * // send backendResult.value.credentials to your frontend when backendResult.success
   *
   * // browser code
   * import { Passlock } from "@passlock/browser";
   *
   * const passlock = new Passlock({ tenancyId });
   * const credentialsFromBackend = backendResult.value.credentials;
   * const result = await passlock.updatePasskeyUsernames(credentialsFromBackend);
   * console.log(result);
   *
   * @category Passkeys (core)
   */
  updatePasskeyUsernames(
    options: ReadonlyArray<UpdateCredentialOptions>
  ): Promise<Result<UpdateSuccess, UpdateError>> {
    return updatePasskeyUsernames(options)
  }

  /**
   * Attempts to signal removal of a passkey from a local device. There are two
   * scenarios in which this method is useful:
   *
   * 1. **Deleting a passkey** - Use the `@passlock/server` package or make vanilla REST calls from your
   * backend to delete the server-side component, then use this method to delete the passkey from the user's local device.
   *
   * 2. **Missing passkey** - When a user presented a passkey but the server-side component could not be found.
   * Remove the passkey from the user's local device to prevent it happening again.
   *
   * See [deleting passkeys](https://passlock.dev/passkeys/passkey-removal/) and
   * [handling missing passkeys](https://passlock.dev/handling-missing-passkeys/) in the documentation.
   * Support and metadata lookup failures populate the error branch as
   * {@link DeleteError}. Browser-side signalling failures are logged as warnings
   * and do not populate the error branch.
   *
   * @param options You will typically pass {@link DeletePasskeyOptions}. Use
   * {@link DeleteCredentialOptions} or {@link OrphanedPasskeyError} when you
   * already have the credential metadata.
   * @returns A {@link Result} whose success branch contains a
   * {@link DeleteSuccess} once the local removal workflow has been started, and
   * whose error branch contains a {@link DeleteError}. Existing
   * {@link isDeleteSuccess}, {@link isDeleteError}, and `_tag` checks still work.
   * @see {@link isDeleteSuccess}
   * @see {@link isDeleteError}
   *
   * @example
   * // from your Passlock console settings
   * const tenancyId = "myTenancyId";
   * const passkeyId = "myPasskeyId";
   *
   * const passlock = new Passlock({ tenancyId });
   * const result = await passlock.deletePasskey({ passkeyId });
   *
   * if (result.success) {
   *   console.log("passkey removal requested");
   * } else {
   *   console.log(result.error.code);
   * }
   *
   * @category Passkeys (core)
   */
  deletePasskey(
    options: DeletePasskeyOptions | DeleteCredentialOptions | OrphanedPasskeyError
  ): Promise<Result<DeleteSuccess, DeleteError>> {
    return deletePasskeySafe(options, this.config)
  }

  /**
   * Attempt to signal removal of multiple passkeys from a local device.
   *
   * Use this after deleting the server-side passkeys. The `deleted` array returned
   * by `@passlock/server` already has the right shape, so you can pass it
   * straight into this method.
   * Support failures populate the error branch as {@link DeleteError}.
   * Browser-side signalling failures are logged as warnings and do not populate
   * the error branch.
   *
   * @param options Credentials derived from deleted backend passkeys.
   * @returns A {@link Result} whose success branch contains a
   * {@link DeleteSuccess} once the local removal workflows have been started,
   * and whose error branch contains a {@link DeleteError}. Existing
   * {@link isDeleteSuccess}, {@link isDeleteError}, and `_tag` checks still work.
   * @see {@link isDeleteSuccess}
   * @see {@link isDeleteError}
   *
   * @example
   * // server code
   * import { deleteUserPasskeys as deleteUserPasskeysOnServer } from "@passlock/server";
   *
   * const backendResult = await deleteUserPasskeysOnServer({
   *   tenancyId,
   *   userId,
   *   apiKey,
   * });
   *
   * // send backendResult.value.deleted to your frontend when backendResult.success
   *
   * // browser code
   * import { Passlock } from "@passlock/browser";
   *
   * const passlock = new Passlock({ tenancyId });
   * const deletedCredentials = backendResult.value.deleted;
   * const result = await passlock.deleteUserPasskeys(deletedCredentials);
   * console.log(result);
   *
   * @category Passkeys (core)
   */
  deleteUserPasskeys(
    options: ReadonlyArray<Credential>
  ): Promise<Result<DeleteSuccess, DeleteError>> {
    return deleteUserPasskeys(options)
  }

  /**
   * Attempt to prune redundant local passkeys by keeping only the passkey IDs
   * you trust.
   *
   * This is useful when your backend is the source of truth for which passkeys
   * should still exist for a given account on this device. Only passkeys for the
   * same account on the same relying party can be pruned; passkeys for different
   * accounts are retained.
   * Support and metadata lookup failures populate the error branch as
   * {@link PruningError}. Browser-side signalling failures are logged as
   * warnings and do not populate the error branch.
   *
   * @param options Pass the passkey IDs you **want to retain** for that account
   * on this device.
   * @returns A {@link Result} whose success branch contains a
   * {@link PruningSuccess} once the accepted-credentials signalling attempt has
   * completed, and whose error branch contains a
   * {@link PruningError}. Existing {@link isPruningSuccess},
   * {@link isPruningError}, and `_tag` checks still work.
   *
   * @see {@link isPruningSuccess}
   * @see {@link isPruningError}
   *
   * @example
   * // from your Passlock console settings
   * const tenancyId = "myTenancyId";
   * const allowablePasskeyIds = ["passkey-1", "passkey-2"];
   *
   * const passlock = new Passlock({ tenancyId });
   * const result = await passlock.prunePasskeys({ allowablePasskeyIds });
   *
   * if (result.success) {
   *   console.log("accepted credentials sync completed");
   * } else {
   *   console.log(result.error.code);
   * }
   *
   * @category Passkeys (core)
   */
  prunePasskeys(options: PrunePasskeyOptions): Promise<Result<PruningSuccess, PruningError>> {
    return prunePasskeys(options, this.config)
  }
}

/* Re-exports */

export { isNetworkError, NetworkError } from "./internal/network.js"
export type { Err, Ok, Result } from "./internal/result.js"
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
  AuthorizedAuthenticationOptions,
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
