/**
 * Promise-based functions that reject with tagged error payloads for expected
 * API failures.
 *
 * Unexpected runtime defects may still throw.
 *
 * @categoryDescription Passkeys
 * Functions and related types for managing passkeys.
 *
 * @categoryDescription Principal
 * Functions and related types for exchanging client codes and verifying
 * Passlock tokens.
 *
 * @showCategories
 *
 * @module unsafe (default)
 */

import { Effect, pipe } from "effect"
import type {
  AssignUserOptions,
  DeletePasskeyOptions,
  DeleteUserPasskeysOptions,
  DeletedPasskeys,
  FindAllPasskeys,
  GetPasskeyOptions,
  ListPasskeyOptions,
  Passkey,
  UpdatedCredentials,
  UpdatePasskeyOptions,
  UpdateUsernamesOptions,
  DeletedPasskey,
} from "./passkey/passkey.js"
import {
  assignUser as assignUserE,
  deletePasskey as deletePasskeyE,
  deleteUserPasskeys as deleteUserPasskeysE,
  getPasskey as getPasskeyE,
  listPasskeys as listPasskeysE,
  updatePasskey as updatePasskeyE,
  updatePasskeyUsernames as updatePasskeyUsernamesE,
} from "./passkey/passkey.js"
import type {
  ExchangeCodeOptions,
  VerifyIdTokenOptions,
} from "./principal/principal.js"
import {
  exchangeCode as exchangeCodeE,
  verifyIdToken as verifyIdTokenE,
} from "./principal/principal.js"
import type { ExtendedPrincipal, Principal } from "./schemas/principal.js"

/**
 * Assign a custom user ID to a passkey in the Passlock vault.
 *
 * This updates Passlock's server-side mapping for the passkey. It does not
 * change the underlying WebAuthn credential's `userId`.
 *
 * @param request
 * @returns A promise resolving to the updated passkey.
 * @throws {@link NotFoundError} if passkey does not exist
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Passkeys
 */
export const assignUser = (request: AssignUserOptions): Promise<Passkey> =>
  pipe(assignUserE(request), Effect.runPromise)

/**
 * Update a passkey's custom user ID and/or username metadata.
 *
 * Updating the username only affects the metadata stored in the vault. It does
 * not affect whether the passkey can be used for authentication.
 *
 * @param request
 * @returns A promise resolving to the updated passkey.
 * @throws {@link NotFoundError} if passkey does not exist
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Passkeys
 */
export const updatePasskey = (
  request: UpdatePasskeyOptions
): Promise<Passkey> => pipe(updatePasskeyE(request), Effect.runPromise)

/**
 * Update the stored username metadata for all passkeys belonging to a given
 * user, and prepare client-side credential updates for those passkeys.
 *
 * **Important:** changing these values has no bearing on authentication. The
 * server-side operation updates the username stored in Passlock. The optional
 * `displayName` is only included in the returned credential updates for
 * follow-up use with `@passlock/client`; it is not persisted in the vault.
 *
 * However you might choose to align the username in your vault with the
 * client-side component to simplify end user support.
 *
 * **Note:** This can be used alongside `@passlock/client`'s
 * `updatePasskeyUsernames` helper to update those details on the user's device.
 *
 * @param request
 * @returns A promise resolving to an {@link UpdatedCredentials} payload.
 * Its `credentials` array can be passed to the client's `updatePasskeyUsernames` function.
 *
 * @category Passkeys
 */
export const updatePasskeyUsernames = (
  request: UpdateUsernamesOptions
): Promise<UpdatedCredentials> =>
  pipe(updatePasskeyUsernamesE(request), Effect.runPromise)

/**
 * Delete a passkey from the Passlock vault.
 *
 * This does not remove the passkey from the user's device. Use
 * `@passlock/client` to coordinate client-side removal when needed.
 *
 * @param options
 * @returns A promise resolving to the deleted credential.
 * @throws {@link NotFoundError} if passkey does not exist
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Passkeys
 */
export const deletePasskey = (
  options: DeletePasskeyOptions
): Promise<DeletedPasskey> => pipe(deletePasskeyE(options), Effect.runPromise)

/**
 * Call the Passlock backend API to delete all passkeys associated with a user.
 *
 * @param request
 * @returns A promise resolving to a {@link DeletedPasskeys} payload.
 * Its `deleted` array can be passed directly into `@passlock/client`'s
 * `deleteUserPasskeys` helper for follow-up client-side passkey removal.
 * @throws {@link NotFoundError} if the user does not exist
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Passkeys
 */
export const deleteUserPasskeys = (
  request: DeleteUserPasskeysOptions
): Promise<DeletedPasskeys> =>
  pipe(deleteUserPasskeysE(request), Effect.runPromise)

/**
 * Fetch a single passkey from the Passlock vault.
 *
 * @param options
 * @returns A promise resolving to the passkey.
 * @throws {@link NotFoundError} if passkey does not exist
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Passkeys
 */
export const getPasskey = (options: GetPasskeyOptions): Promise<Passkey> =>
  pipe(getPasskeyE(options), Effect.runPromise)

/**
 * List passkeys for the given tenancy. Note this could return a cursor,
 * in which case the function should be called again with the given cursor.
 *
 * @param options
 * @returns A promise resolving to a page of passkey summaries.
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Passkeys
 */
export const listPasskeys = (
  options: ListPasskeyOptions
): Promise<FindAllPasskeys> => pipe(listPasskeysE(options), Effect.runPromise)

/**
 * Exchange a short-lived code from `@passlock/client` for an
 * {@link ExtendedPrincipal}.
 *
 * @param options
 * @returns A promise resolving to an extended principal.
 * @throws {@link InvalidCodeError} if the code is invalid or expired
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Principal
 */
export const exchangeCode = (
  options: ExchangeCodeOptions
): Promise<ExtendedPrincipal> => pipe(exchangeCodeE(options), Effect.runPromise)

/**
 * Decode and verify a Passlock `id_token` (JWT).
 *
 * Note: this will make a network call to
 * `https://api.passlock.dev/.well-known/jwks.json` (or your configured `endpoint`)
 * to fetch the relevant public key. The response will be cached, however
 * bear in mind that for environments such as AWS Lambda it will make the call
 * on each cold start, so it might be slower than {@link exchangeCode}.
 *
 * @param options
 * @returns A promise resolving to the verified principal.
 * @throws {@link VerificationError} if token verification fails
 *
 * @category Principal
 */
export const verifyIdToken = (
  options: VerifyIdTokenOptions
): Promise<Principal> => pipe(verifyIdTokenE(options), Effect.runPromise)

/* Re-exports */

export type {
  BadRequestError,
  DuplicateEmailError,
  ForbiddenError,
  InvalidCodeError,
  InvalidEmailError,
  InvalidTenancyError,
  NotFoundError,
  PasskeyNotFoundError,
  UnauthorizedError,
  VerificationError,
} from "./errors.js"
export {
  isBadRequestError,
  isDuplicateEmailError,
  isForbiddenError,
  isInvalidCodeError,
  isInvalidEmailError,
  isInvalidTenancyError,
  isNotFoundError,
  isPasskeyNotFoundError,
  isUnauthorizedError,
  isVerificationError,
} from "./errors.js"
export type {
  AssignUserOptions,
  Credential,
  DeletePasskeyOptions,
  DeleteUserPasskeysOptions,
  DeletedPasskey,
  DeletedPasskeys,
  FindAllPasskeys,
  GetPasskeyOptions,
  ListPasskeyOptions,
  Passkey,
  PasskeyCredential,
  PasskeySummary,
  Platform,
  UpdatedPasskeys,
  UpdatedCredentials as UpdatedUserDetails,
  UpdatePasskeyOptions,
  UpdateUsernamesOptions as UpdateUserDetailsOptions,
} from "./passkey/passkey.js"
export {
  isDeletedPasskeys,
  isPasskey,
  isPasskeySummary,
  isUpdatedPasskeys,
  isUpdatedUserDetails,
} from "./passkey/passkey.js"
export type {
  ExchangeCodeOptions,
  VerifyIdTokenOptions,
} from "./principal/principal.js"
export type {
  CredentialDeviceType,
  Transports,
} from "./schemas/passkey.js"
export type { ExtendedPrincipal, Principal } from "./schemas/principal.js"
export { isExtendedPrincipal, isPrincipal } from "./schemas/principal.js"
export type {
  AuthenticatedOptions,
  PasslockOptions,
} from "./shared.js"
