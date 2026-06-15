/**
 * These methods and functions are **_safe_**; they return wrappers over
 * success and error payloads. Use `result.success` or `result.failure`
 * to branch between success and error outcomes.
 *
 * Choose the Passlock client if you prefer a class-based API. Alternatively,
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
 * Creating, authenticating, updating, deleting, and pruning passkeys. Management
 * helpers use short-lived tokens prepared by `@passlock/server`, then signal
 * local password managers on a best-effort basis.
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
import type { DeleteError, PruningError, UpdateError } from "./passkey/errors.js"

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
  DeletePasskeysOptions,
  DeleteSuccess,
  PrunePasskeysOptions,
  PruningSuccess,
  UpdatePasskeysOptions,
  UpdateSuccess,
} from "./passkey/signals/signals.js"
import {
  deletePasskeys as deletePasskeysM,
  isDeleteSuccess,
  isPasskeyDeleteSupport as isPasskeyDeleteSupportM,
  isPasskeyPruningSupport as isPasskeyPruningSupportM,
  isPasskeyUpdateSupport as isPasskeyUpdateSupportM,
  isPruningSuccess,
  isUpdateSuccess,
  prunePasskeys as prunePasskeysM,
  updatePasskeys as updatePasskeysM,
} from "./passkey/signals/signals.js"

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
 * Exchange a prepared update token and signal local passkey user-detail updates.
 *
 * Your backend should first call `updatePasskeys` from `@passlock/server`,
 * return the resulting `updatePasskeysToken` to the browser, then pass that
 * token to this function. The browser exchanges the token for exact
 * WebAuthn signal instructions chosen by your backend.
 *
 * Unsupported signal APIs and browser-side signal failures are returned as
 * warnings on the success branch. A successful result means the signalling
 * workflow completed or no-op'd; it does not guarantee that a browser or
 * password manager changed local passkey state.
 *
 * @param options Prepared update token.
 * @param config Passlock tenancy and API endpoint options.
 * @returns A {@link Result} whose success branch contains an
 * {@link UpdateSuccess} with warnings and whose error branch contains an
 * {@link UpdateError}.
 *
 * @see {@link isUpdateSuccess}
 * @see {@link isUpdateError}
 *
 * @example
 * const tenancyId = "myTenancyId";
 * const updatePasskeysToken = "token-from-your-backend";
 *
 * const result = await updatePasskeys({ updatePasskeysToken }, { tenancyId });
 *
 * if (result.success) {
 *   console.log(result.value.warnings);
 * } else {
 *   console.log(result.error.code);
 * }
 *
 * @category Passkeys (core)
 */
export const updatePasskeys = (
  options: UpdatePasskeysOptions,
  config: PasslockOptions,
  /** @hidden */
  logger: typeof Logger.Service = eventLogger
): Promise<Result<UpdateSuccess, UpdateError>> => {
  const micro = updatePasskeysM(options, config)
  return pipe(micro, Micro.provideService(Logger, logger), runToPromise)
}

/**
 * Exchange a prepared deletion token and signal local passkey removals.
 *
 * Your backend should first call `deletePasskeys` from `@passlock/server`,
 * return the resulting `deletePasskeysToken` to the browser, then pass that
 * token to this function. The browser exchanges the token for exact
 * WebAuthn signal instructions chosen by your backend.
 *
 * Unsupported signal APIs and browser-side signal failures are returned as
 * warnings on the success branch. A successful result means the signalling
 * workflow completed or no-op'd; it does not guarantee that a browser or
 * password manager removed local passkeys.
 *
 * @param options Prepared deletion token.
 * @param config Passlock tenancy and API endpoint options.
 * @returns A {@link Result} whose success branch contains an
 * {@link DeleteSuccess} with warnings and whose error branch contains a
 * {@link DeleteError}.
 *
 * @see {@link isDeleteSuccess}
 * @see {@link isDeleteError}
 *
 * @example
 * const tenancyId = "myTenancyId";
 * const deletePasskeysToken = "token-from-your-backend";
 *
 * const result = await deletePasskeys({ deletePasskeysToken }, { tenancyId });
 *
 * if (result.success) {
 *   console.log(result.value.warnings);
 * } else {
 *   console.log(result.error.code);
 * }
 *
 * @category Passkeys (core)
 */
export const deletePasskeys = (
  options: DeletePasskeysOptions,
  config: PasslockOptions,
  /** @hidden */
  logger: typeof Logger.Service = eventLogger
): Promise<Result<DeleteSuccess, DeleteError>> => {
  const micro = deletePasskeysM(options, config)
  return pipe(micro, Micro.provideService(Logger, logger), runToPromise)
}

/**
 * Exchange a prepared pruning token and signal the currently accepted passkeys.
 *
 * Your backend should first call `prunePasskeys` from `@passlock/server`,
 * return the resulting `prunePasskeysToken` to the browser, then pass that
 * token to this function. The browser exchanges the token for exact
 * WebAuthn signal instructions chosen by your backend.
 *
 * Unsupported signal APIs and browser-side signal failures are returned as
 * warnings on the success branch. A successful result means the signalling
 * workflow completed or no-op'd; it does not guarantee that a browser or
 * password manager removed local passkeys.
 *
 * @param options Prepared pruning token.
 * @param config Passlock tenancy and API endpoint options.
 * @returns A {@link Result} whose success branch contains a
 * {@link PruningSuccess} with warnings and whose error branch contains a
 * {@link PruningError}.
 *
 * @see {@link isPruningSuccess}
 * @see {@link isPruningError}
 *
 * @example
 * const tenancyId = "myTenancyId";
 * const prunePasskeysToken = "token-from-your-backend";
 *
 * const result = await prunePasskeys({ prunePasskeysToken }, { tenancyId });
 *
 * if (result.success) {
 *   console.log(result.value.warnings);
 * } else {
 *   console.log(result.error.code);
 * }
 *
 * @category Passkeys (core)
 */
export const prunePasskeys = (
  options: PrunePasskeysOptions,
  config: PasslockOptions,
  /** @hidden */
  logger: typeof Logger.Service = eventLogger
): Promise<Result<PruningSuccess, PruningError>> => {
  const micro = prunePasskeysM(options, config)
  return pipe(micro, Micro.provideService(Logger, logger), runToPromise)
}

/* Support */

/**
 * Does the local device support passkey deletion signalling?
 *
 * @returns `true` if local passkey deletion signalling is supported.
 *
 * @category Passkeys (other)
 */
export const isPasskeyDeleteSupport = () => pipe(isPasskeyDeleteSupportM, Micro.runSync)

/**
 * Does the local device support passkey pruning via accepted-credentials
 * signalling?
 *
 * @returns `true` if local passkey pruning signalling is supported.
 *
 * @category Passkeys (other)
 */
export const isPasskeyPruningSupport = () => pipe(isPasskeyPruningSupportM, Micro.runSync)

/**
 * Does the local device support passkey user-detail update signalling?
 *
 * @returns `true` if local passkey update signalling is supported.
 *
 * @category Passkeys (other)
 */
export const isPasskeyUpdateSupport = () => pipe(isPasskeyUpdateSupportM, Micro.runSync)

/* Client */

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
   * Exchange a prepared update token and signal local passkey user-detail updates.
   *
   * The token is prepared by `@passlock/server` after your backend chooses the
   * user, username, and optional display name. Unsupported signal APIs and
   * signal failures are returned as warnings on the success branch.
   *
   * @param options Prepared update token.
   * @returns A {@link Result} whose success branch contains an
   * {@link UpdateSuccess} with warnings and whose error branch contains an
   * {@link UpdateError}.
   *
   * @category Passkeys (core)
   */
  updatePasskeys(options: UpdatePasskeysOptions): Promise<Result<UpdateSuccess, UpdateError>> {
    return updatePasskeys(options, this.config)
  }

  /**
   * Exchange a prepared deletion token and signal local passkey removals.
   *
   * The token is prepared by `@passlock/server` after your backend chooses
   * passkey IDs or a user ID. A successful result means the browser signalling
   * flow completed or no-op'd, not that local passkeys were definitely removed.
   *
   * @param options Prepared deletion token.
   * @returns A {@link Result} whose success branch contains a
   * {@link DeleteSuccess} with warnings and whose error branch contains a
   * {@link DeleteError}.
   *
   * @category Passkeys (core)
   */
  deletePasskeys(options: DeletePasskeysOptions): Promise<Result<DeleteSuccess, DeleteError>> {
    return deletePasskeys(options, this.config)
  }

  /**
   * Exchange a prepared pruning token and signal the currently accepted passkeys.
   *
   * The token is prepared by `@passlock/server` after your backend chooses a
   * user ID. A successful result means the accepted-credentials signal was
   * attempted or no-op'd, not that local passkeys were definitely removed.
   *
   * @param options Prepared pruning token.
   * @returns A {@link Result} whose success branch contains a
   * {@link PruningSuccess} with warnings and whose error branch contains a
   * {@link PruningError}.
   *
   * @category Passkeys (core)
   */
  prunePasskeys(options: PrunePasskeysOptions): Promise<Result<PruningSuccess, PruningError>> {
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
  DeletePasskeysOptions,
  DeleteSuccess,
  PasskeyDeletionInstruction,
  PasskeyManagementWarning,
  PasskeyManagementWarningCode,
  PasskeyPruningInstruction,
  PasskeyUpdateInstruction,
  PrunePasskeysOptions,
  PruningSuccess,
  UpdatePasskeysOptions,
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
