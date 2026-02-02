/**
 * Unsafe functions that could potentially throw errors.
 *
 * @categoryDescription Passkeys
 * Functions and related types for managing passkeys
 *
 * @showCategories
 *
 * @module unsafe
 */

import { FetchHttpClient } from "@effect/platform"
import { Effect, pipe } from "effect"
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
 * Call the Passlock backend API to assign a userId to an authenticator
 *
 * @param request
 * @returns A promise resolving to the updated passkey.
 * @throws {@link NotFound} if passkey does not exist
 * @throws {@link Forbidden} if the Tenancy ID or API key is invalid
 *
 * @category Passkeys
 */
export const assignUser = (request: AssignUserOptions): Promise<Passkey> =>
  pipe(assignUserE(request), Effect.runPromise)

/**
 * Call the Passlock backend API to update passkey properties
 *
 * @param request
 * @returns A promise resolving to the updated passkey.
 *
 * @category Passkeys
 */
export const updatePasskey = (
  request: UpdatePasskeyOptions
): Promise<Passkey> => pipe(updatePasskeyE(request), Effect.runPromise)

/**
 * Call the Passlock backend API to delete an authenticator
 *
 * @param options
 * @returns A promise resolving to the deleted passkey payload.
 *
 * @category Passkeys
 */
export const deletePasskey = (
  options: DeletePasskeyOptions
): Promise<DeletedPasskey> => pipe(deletePasskeyE(options), Effect.runPromise)

/**
 * Call the Passlock backend API to fetch an authenticator
 * @param options
 * @returns A promise resolving to the passkey.
 */
export const getPasskey = (options: GetPasskeyOptions): Promise<Passkey> =>
  pipe(getPasskeyE(options), Effect.runPromise)

/**
 * List passkeys for the given tenancy. Note this could return a cursor,
 * in which case the function should be called again with the given cursor.
 *
 * @param options
 * @returns A promise resolving to a page of passkey summaries.
 *
 * @category Passkeys
 */
export const listPasskeys = (
  options: ListPasskeyOptions
): Promise<FindAllPasskeys> => pipe(listPasskeysE(options), Effect.runPromise)

/**
 * Call the Passlock backend API to exchange a code for a Principal
 *
 * @param options
 * @returns A promise resolving to an extended principal.
 *
 * @category Principal
 */
export const exchangeCode = (
  options: ExchangeCodeOptions
): Promise<ExtendedPrincipal> =>
  pipe(
    exchangeCodeE(options),
    Effect.provide(FetchHttpClient.layer),
    Effect.runPromise
  )

/**
 * Decode and verify a Passlock idToken.
 * Note: This will make a network call to the passlock.dev/.well-known/jwks.json
 * endpoint to fetch the relevant public key. The response will be cached, however
 * bear in mind that for something like AWS lambda it will make the call on every
 * cold start so might actually be slower than {@link exchangeCode}
 *
 * @param options
 * @returns A promise resolving to the verified principal.
 *
 * @category Principal
 */
export const verifyIdToken = (
  options: VerifyIdTokenOptions
): Promise<Principal> =>
  pipe(
    verifyIdTokenE(options),
    Effect.provide(FetchHttpClient.layer),
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
