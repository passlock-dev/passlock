/**
 * Safe functions that return result envelopes over the original
 * tagged success and error payloads. The returned value keeps
 * its original `_tag` shape, and is also augmented with a
 * result envelope for `success`- or `failure`-style branching.
 *
 * Note: unexpected runtime failures may still throw.
 *
 * ```ts
 * const result = await exchangeCode({
 *   apiKey,
 *   code,
 *   tenancyId,
 * })
 *
 * if (result.success) {
 *   console.log(result.value.id)
 * }
 *
 * if (result.failure) {
 *   console.log(result.error.message)
 * }
 *
 * if (isExtendedPrincipal(result)) {
 *   console.log(result.id)
 * }
 * ```
 *
 * @categoryDescription Passkeys
 * Functions and related types for managing passkeys
 *
 * @showCategories
 *
 * @module safe
 */

import { Effect, pipe } from "effect"
import type {
  ForbiddenError,
  InvalidCodeError,
  NotFoundError,
  VerificationError,
} from "./errors.js"
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
import { type Result, toErrResult, toOkResult } from "./safe-result.js"
import type { ExtendedPrincipal, Principal } from "./schemas/principal.js"

const runSafe = <A extends object, E extends object>(
  effect: Effect.Effect<A, E>
): Promise<Result<A, E>> =>
  pipe(
    effect,
    Effect.match({
      onFailure: (error): Result<A, E> => toErrResult(error) as Result<A, E>,
      onSuccess: (value): Result<A, E> => toOkResult(value) as Result<A, E>,
    }),
    Effect.runPromise
  )

/**
 * Assign a custom User ID to a passkey. Will be reflected in the next
 * {@link Principal} or {@link ExtendedPrincipal} generated.
 *
 * **Note:** This does not change the underlying WebAuthn credential's `userId`.
 * Instead we apply a layer of indirection.
 *
 * @see {@link Principal}
 * @see {@link ExtendedPrincipal}
 * @see [credential](https://passlock.dev/rest-api/credential/)
 *
 * @param request
 * @returns A promise resolving to a {@link Result} whose success branch contains
 * a passkey and whose error branch contains an API error.
 *
 * @category Passkeys
 */
export const assignUser = (
  request: AssignUserOptions
): Promise<Result<Passkey, NotFoundError | ForbiddenError>> =>
  runSafe(assignUserE(request))

/**
 * Update a passkey's custom user ID and/or username metadata.
 *
 * **Important:** changing the username has no bearing on authentication, as
 * it's typically only used in the client-side component of the passkey
 * (so the user knows which account the passkey relates to).
 *
 * However you might choose to align the username in your vault with the
 * client-side component to simplify end user support.
 *
 * @param request
 * @returns A promise resolving to a {@link Result} whose success branch contains
 * a passkey and whose error branch contains an API error.
 *
 * @category Passkeys
 */
export const updatePasskey = (
  request: UpdatePasskeyOptions
): Promise<Result<Passkey, NotFoundError | ForbiddenError>> =>
  runSafe(updatePasskeyE(request))

/**
 * Update the username and/or display name for all passkeys belonging to a given user.
 *
 * **Important:** changing these values has no bearing on authentication, as
 * it's typically only used in the client-side component of the passkey
 * (so the user knows which account the passkey relates to).
 *
 * However you might choose to align the username and display name in your vault with the
 * client-side component to simplify end user support.
 *
 * **Note:** This can be used alongside `@passlock/client`'s
 * `updatePasskeyUsernames` helper to update those details on the user's device.
 *
 * @param request
 * @returns A promise resolving to a {@link Result}.
 * The success branch contains an {@link UpdatedCredentials} payload, whose
 * `credentials` array can be passed into the client's `updatePasskeyUsernames` function.
 * The error branch contains
 * an API error.
 *
 * @category Passkeys
 */
export const updatePasskeyUsernames = (
  request: UpdateUsernamesOptions
): Promise<Result<UpdatedCredentials, NotFoundError | ForbiddenError>> =>
  runSafe(updatePasskeyUsernamesE(request))

/**
 * Delete a passkey from your vault.
 *
 * **Note:** The user will still retain the passkey on their device so
 * you will need to either:
 *
 * a) Use the @passlock/client functions to delete the passkey from the user's device.
 * b) Remind the user to delete the passkey
 *
 * See [deleting passkeys](https://passlock.dev/passkeys/passkey-removal/) in the documentation.
 *
 * In addition, during authentication you should handle a missing passkey scenario.
 * This happens when a user tries to authenticate with a passkey that is missing from
 * your vault. The @passlock/client library can help with this. See
 * [handling missing passkeys](https://passlock.dev/handling-missing-passkeys/)
 *
 * @see [deleting passkeys](https://passlock.dev/passkeys/passkey-removal/)
 * @see [handling missing passkeys](https://passlock.dev/handling-missing-passkeys/)
 *
 * @param options
 * @returns A promise resolving to a {@link Result} whose success branch contains
 * the deleted credential and whose error branch contains an API error.
 *
 * @category Passkeys
 */
export const deletePasskey = (
  options: DeletePasskeyOptions
): Promise<Result<DeletedPasskey, ForbiddenError | NotFoundError>> =>
  runSafe(deletePasskeyE(options))

/**
 * Delete all passkeys associated with a user.
 *
 * @param request
 * @returns A promise resolving to a {@link Result}.
 * The success branch contains a {@link DeletedPasskeys} payload whose
 * `deleted` array can be passed directly into `@passlock/client`'s
 * `deleteUserPasskeys` helper for follow-up client-side passkey removal.
 * The error branch contains an API error.
 *
 * @category Passkeys
 */
export const deleteUserPasskeys = (
  request: DeleteUserPasskeysOptions
): Promise<Result<DeletedPasskeys, ForbiddenError | NotFoundError>> =>
  runSafe(deleteUserPasskeysE(request))

/**
 * Fetch details about a passkey. **Important**: Not to be confused with
 * the {@link exchangeCode} or {@link verifyIdToken} functions, which
 * return details about specific authentication or registration operations.
 * Use this function for passkey management, not authentication.
 *
 * @param options
 * @returns A promise resolving to a {@link Result} whose success branch contains
 * passkey details and whose error branch contains an API error.
 *
 * @category Passkeys
 */
export const getPasskey = (
  options: GetPasskeyOptions
): Promise<Result<Passkey, ForbiddenError | NotFoundError>> =>
  runSafe(getPasskeyE(options))

/**
 * List passkeys for the given tenancy. Note: This could return a cursor.
 * If so, call again, passing the cursor back in.
 *
 * @param options
 * @returns A promise resolving to a {@link Result} whose success branch contains
 * a page of passkey summaries and whose error branch contains an API error.
 *
 * @category Passkeys
 */
export const listPasskeys = (
  options: ListPasskeyOptions
): Promise<Result<FindAllPasskeys, ForbiddenError>> =>
  runSafe(listPasskeysE(options))

/**
 * The @passlock/client library generates codes, which you should send to
 * your backend. Use this function to exchange the code for details about
 * the registration or authentication operation. **Note:** a code is valid
 * for 5 minutes.
 *
 * @see {@link ExtendedPrincipal}
 *
 * @param options
 * @returns A promise resolving to a {@link Result} whose success branch contains
 * an extended principal and whose error branch contains an API error.
 *
 * @category Principal
 */
export const exchangeCode = (
  options: ExchangeCodeOptions
): Promise<Result<ExtendedPrincipal, ForbiddenError | InvalidCodeError>> =>
  runSafe(exchangeCodeE(options))

/**
 * Decode and verify an id_token (JWT) locally.
 *
 * **Note:** This will make a network call to
 * `https://api.passlock.dev/.well-known/jwks.json` (or your configured `endpoint`)
 * to fetch the relevant public key. The response will be cached, however
 * bear in mind that for environments such as AWS Lambda it will make the call
 * on each cold start, so it might be slower than {@link exchangeCode}.
 *
 * @see {@link Principal}
 *
 * @param options
 * @returns A promise resolving to a {@link Result} whose success branch contains
 * a verified principal and whose error branch contains a verification error.
 *
 * @category Principal
 */
export const verifyIdToken = (
  options: VerifyIdTokenOptions
): Promise<Result<Principal, VerificationError>> =>
  runSafe(verifyIdTokenE(options))

/* Re-exports */

export type { Err, Ok, Result } from "./safe-result.js"
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
