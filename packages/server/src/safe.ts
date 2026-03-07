/**
 * Safe functions that return discriminated unions representing
 * the successful outcome or expected failures.
 *
 * Note: unexpected runtime failures may still throw.
 *
 * @categoryDescription Passkeys
 * Functions and related types for managing passkeys
 *
 * @showCategories
 *
 * @module safe
 */

import { Effect, identity, pipe } from "effect"
import type {
  ForbiddenError,
  InvalidCodeError,
  NotFoundError,
  VerificationError,
} from "./errors.js"
import type {
  AssignUserOptions,
  DeletePasskeyOptions,
  FindAllPasskeys,
  GetPasskeyOptions,
  ListPasskeyOptions,
  Passkey,
  UpdatedPasskeyUsernames,
  UpdatePasskeyOptions,
  UpdatePasskeyUsernamesOptions,
} from "./passkey/passkey.js"
import {
  assignUser as assignUserE,
  deletePasskey as deletePasskeyE,
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
 * @returns A promise resolving to either a passkey or an API error.
 *
 * @category Passkeys
 */
export const assignUser = (
  request: AssignUserOptions
): Promise<Passkey | NotFoundError | ForbiddenError> =>
  pipe(
    assignUserE(request),
    Effect.match({ onFailure: identity, onSuccess: identity }),
    Effect.runPromise
  )

/**
 * Can also be used to assign a custom User ID, but also allows you to update
 * the username.
 *
 * **Important:** changing the username has no bearing on authentication, as
 * it's typically only used in the client-side component of the passkey
 * (so the user knows which account the passkey relates to).
 *
 * However you might choose to align the username in your vault with the
 * client-side component to simplify end user support.
 *
 * @param request
 * @returns A promise resolving to either a passkey or an API error.
 *
 * @category Passkeys
 */
export const updatePasskey = (
  request: UpdatePasskeyOptions
): Promise<Passkey | NotFoundError | ForbiddenError> =>
  pipe(
    updatePasskeyE(request),
    Effect.match({ onFailure: identity, onSuccess: identity }),
    Effect.runPromise
  )

/**
 * Update the username for all passkeys belonging to a given user.
 *
 * **Important:** changing the username has no bearing on authentication, as
 * it's typically only used in the client-side component of the passkey
 * (so the user knows which account the passkey relates to).
 *
 * However you might choose to align the username in your vault with the
 * client-side component to simplify end user support.
 *
 * @param request
 * @returns A promise resolving to either updated passkey usernames or an API error.
 *
 * @category Passkeys
 */
export const updatePasskeyUsernames = (
  request: UpdatePasskeyUsernamesOptions
): Promise<UpdatedPasskeyUsernames | NotFoundError | ForbiddenError> =>
  pipe(
    updatePasskeyUsernamesE(request),
    Effect.match({ onFailure: identity, onSuccess: identity }),
    Effect.runPromise
  )

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
 * @returns A promise resolving to either the deleted passkey or an API error.
 *
 * @category Passkeys
 */
export const deletePasskey = (
  options: DeletePasskeyOptions
): Promise<Passkey | ForbiddenError | NotFoundError> =>
  pipe(
    deletePasskeyE(options),
    Effect.match({ onFailure: identity, onSuccess: identity }),
    Effect.runPromise
  )

/**
 * Fetch details about a passkey. **Important**: Not to be confused with
 * the {@link exchangeCode} or {@link verifyIdToken} functions, which
 * return details about specific authentication or registration operations.
 * Use this function for passkey management, not authentication.
 *
 * @param options
 * @returns A promise resolving to either passkey details or an API error.
 *
 * @category Passkeys
 */
export const getPasskey = (
  options: GetPasskeyOptions
): Promise<Passkey | ForbiddenError | NotFoundError> =>
  pipe(
    getPasskeyE(options),
    Effect.match({ onFailure: identity, onSuccess: identity }),
    Effect.runPromise
  )

/**
 * List passkeys for the given tenancy. Note: This could return a cursor.
 * If so, call again, passing the cursor back in.
 *
 * @param options
 * @returns A promise resolving to a page of passkey summaries or an API error.
 *
 * @category Passkeys
 */
export const listPasskeys = (
  options: ListPasskeyOptions
): Promise<FindAllPasskeys | ForbiddenError> =>
  pipe(
    listPasskeysE(options),
    Effect.match({ onFailure: identity, onSuccess: identity }),
    Effect.runPromise
  )

/**
 * The @passlock/client library generates codes, which you should send to
 * your backend. Use this function to exchange the code for details about
 * the registration or authentication operation. **Note:** a code is valid
 * for 5 minutes.
 *
 * @see {@link ExtendedPrincipal}
 *
 * @param options
 * @returns A promise resolving to an extended principal or an API error.
 *
 * @category Principal
 */
export const exchangeCode = (
  options: ExchangeCodeOptions
): Promise<ExtendedPrincipal | ForbiddenError | InvalidCodeError> =>
  pipe(
    exchangeCodeE(options),
    Effect.match({ onFailure: identity, onSuccess: identity }),
    Effect.runPromise
  )

/**
 * Decode and verify an id_token (JWT) locally.
 * **Note:** This will make a network call to
 * `https://api.passlock.dev/.well-known/jwks.json` (or your configured `endpoint`)
 * to fetch the relevant public key. The response will be cached, however
 * bear in mind that for something like AWS Lambda it will make the call on every
 * cold start so might actually be slower than {@link exchangeCode}
 *
 * @see {@link Principal}
 *
 * @param options
 * @returns A promise resolving to a verified principal or verification failure.
 *
 * @category Principal
 */
export const verifyIdToken = (
  options: VerifyIdTokenOptions
): Promise<Principal | VerificationError> =>
  pipe(
    verifyIdTokenE(options),
    Effect.match({ onFailure: identity, onSuccess: identity }),
    Effect.runPromise
  )

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
  FindAllPasskeys,
  GetPasskeyOptions,
  ListPasskeyOptions,
  Passkey,
  PasskeySummary,
  Platform,
  UpdatedPasskeys,
  UpdatedPasskeyUsernames,
  UpdatePasskeyOptions,
  UpdatePasskeyUsernamesOptions,
} from "./passkey/passkey.js"
export {
  isPasskey,
  isPasskeySummary,
  isUpdatedPasskeys,
  isUpdatedPasskeyUsernames,
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
