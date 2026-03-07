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

import { Effect, pipe } from "effect"
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
 * Call the Passlock backend API to assign a userId to an authenticator
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
 * Call the Passlock backend API to update passkey properties
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
 * Call the Passlock backend API to update all passkeys for a given user
 *
 * @param request
 * @returns A promise resolving to updated usernames for matching passkeys.
 * @throws {@link NotFoundError} if no passkeys are found for the given user
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Passkeys
 */
export const updatePasskeyUsernames = (
  request: UpdatePasskeyUsernamesOptions
): Promise<UpdatedPasskeyUsernames> =>
  pipe(updatePasskeyUsernamesE(request), Effect.runPromise)

/**
 * Call the Passlock backend API to delete an authenticator
 *
 * @param options
 * @returns A promise resolving to the deleted passkey.
 * @throws {@link NotFoundError} if passkey does not exist
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Passkeys
 */
export const deletePasskey = (
  options: DeletePasskeyOptions
): Promise<Passkey> => pipe(deletePasskeyE(options), Effect.runPromise)

/**
 * Call the Passlock backend API to fetch an authenticator
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
 * Call the Passlock backend API to exchange a code for an ExtendedPrincipal
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
 * Note: This will make a network call to
 * `https://api.passlock.dev/.well-known/jwks.json` (or your configured `endpoint`)
 * to fetch the relevant public key. The response will be cached, however
 * bear in mind that for something like AWS Lambda it will make the call on every
 * cold start so might actually be slower than {@link exchangeCode}
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
