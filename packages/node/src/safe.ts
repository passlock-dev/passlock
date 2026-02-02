/**
 * Safe functions that don't throw but instead
 * return a discriminated union of types representing
 * the successful outcome or failures.
 *
 * @categoryDescription Passkeys
 * Functions and related types for managing passkeys
 *
 * @showCategories
 *
 * @module safe
 */

import { FetchHttpClient } from "@effect/platform"
import { Effect, identity, pipe } from "effect"
import type {
  Forbidden,
  InvalidCode,
  NotFound,
  VerificationFailure,
} from "./errors.js"
import type {
  AssignUserOptions,
  DeletedPasskey,
  DeletePasskeyOptions,
  FindAllPasskeys,
  GetPasskeyOptions,
  ListPasskeyOptions,
  Passkey,
  UpdatePasskeyOptions,
} from "./passkey/passkey.js"
import {
  assignUser as assignUserE,
  deletePasskey as deletePasskeyE,
  getPasskey as getPasskeyE,
  listPasskeys as listPasskeysE,
  updatePasskey as updatePasskeyE,
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
 * **Note:** This does not change the underlying WebAuthn credential's userID.
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
): Promise<Passkey | NotFound | Forbidden> =>
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
): Promise<Passkey | NotFound | Forbidden> =>
  pipe(
    updatePasskeyE(request),
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
 * @returns A promise resolving to either deleted-passkey details or an API error.
 *
 * @category Passkeys
 */
export const deletePasskey = (
  options: DeletePasskeyOptions
): Promise<DeletedPasskey | Forbidden | NotFound> =>
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
): Promise<Passkey | Forbidden | NotFound> =>
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
): Promise<FindAllPasskeys | Forbidden> =>
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
): Promise<ExtendedPrincipal | Forbidden | InvalidCode> =>
  pipe(
    exchangeCodeE(options),
    Effect.match({ onFailure: identity, onSuccess: identity }),
    Effect.provide(FetchHttpClient.layer),
    Effect.runPromise
  )

/**
 * Decode and verify an id_token (JWT) locally.
 * **Note:** This will make a network call to the passlock.dev/.well-known/jwks.json
 * endpoint to fetch the relevant public key. The response will be cached, however
 * bear in mind that for something like AWS lambda it will make the call on every
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
): Promise<Principal | VerificationFailure> =>
  pipe(
    verifyIdTokenE(options),
    Effect.match({ onFailure: identity, onSuccess: identity }),
    Effect.runPromise
  )

/* Re-exports */

export type {
  BadRequest,
  DuplicateEmail,
  Forbidden,
  InvalidCode,
  InvalidEmail,
  InvalidTenancy,
  NotFound,
  PasskeyNotFound,
  Unauthorized,
  VerificationFailure,
} from "./errors.js"
export {
  isBadRequest,
  isDuplicateEmail,
  isForbidden,
  isInvalidCode,
  isInvalidEmail,
  isInvalidTenancy,
  isNotFound,
  isPasskeyNotFound,
  isUnauthorized,
  isVerificationFailure,
} from "./errors.js"
export type {
  AssignUserOptions,
  Credential,
  DeletedPasskey,
  DeletePasskeyOptions,
  FindAllPasskeys,
  GetPasskeyOptions,
  ListPasskeyOptions,
  Passkey,
  PasskeySummary,
  Platform,
  UpdatePasskeyOptions,
} from "./passkey/passkey.js"
export {
  isDeletedPasskey,
  isPasskey,
  isPasskeySummary,
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
