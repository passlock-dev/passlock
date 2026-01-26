import type {
  AssignUserRequest,
  DeleteAuthenticatorOptions,
  GetAuthenticatorOptions,
  ListPasskeyOptions,
  Passkey,
} from "./passkey.js"
import type { ExchangeCodeOptions, VerifyTokenOptions } from "./principal.js"
import type { DeletedPasskey, FindAllPasskeys } from "./schemas/passkey.js"
import type { ExtendedPrincipal, Principal } from "./schemas/principal.js"
import { FetchHttpClient } from "@effect/platform"
import { Effect, pipe } from "effect"
import {
  assignUser as assignUserE,
  deletePasskey as deletePasskeyE,
  getPasskey as getPasskeyE,
  listPasskeys as listPasskeysE,
} from "./passkey.js"
import { exchangeCode as exchangeCodeE, verifyIdToken as verifyIdTokenE } from "./principal.js"

/**
 * Call the Passlock backend API to assign a userId to an authenticator
 * @param request
 * @param request
 * @returns
 */
export const assignUser = (request: AssignUserRequest): Promise<Passkey> =>
  pipe(assignUserE(request), Effect.runPromise)

/**
 * Call the Passlock backend API to delete an authenticator
 * @param options
 * @param options
 * @returns
 */
export const deletePasskey = (
  passkeyId: string,
  options: DeleteAuthenticatorOptions
): Promise<DeletedPasskey> => pipe(deletePasskeyE(passkeyId, options), Effect.runPromise)

/**
 * Call the Passlock backend API to fetch an authenticator
 * @param authenticatorId
 * @param options
 * @returns
 */
export const getPasskey = (
  authenticatorId: string,
  options: GetAuthenticatorOptions
): Promise<Passkey> => pipe(getPasskeyE(authenticatorId, options), Effect.runPromise)

/**
 * List passkeys for the given tenancy. Note this could return a cursor, in which case the function chould be called with the given cursor.
 * @param options
 * @returns
 */
export const listPasskeys = (options: ListPasskeyOptions): Promise<FindAllPasskeys> =>
  pipe(listPasskeysE(options), Effect.runPromise)

/**
 * Call the Passlock backend API to exchange a code for a Principal
 * @param code
 * @package options
 * @returns
 */
export const exchangeCode = (
  code: string,
  options: ExchangeCodeOptions
): Promise<ExtendedPrincipal> =>
  pipe(exchangeCodeE(code, options), Effect.provide(FetchHttpClient.layer), Effect.runPromise)

/**
 * Decode and verify a Passlock idToken.
 * Note: This will make a network call to the passlock.dev/.well-known/jwks.json
 * endpoint to fetch the relevant public key. The response will be cached, however
 * bear in mind that for something like AWS lambda it will make the call on every
 * cold start so might actually be slower than {@link exchangeCode}
 * @param token
 * @param options
 * @returns
 */
export const verifyIdToken = (token: string, options: VerifyTokenOptions): Promise<Principal> =>
  pipe(verifyIdTokenE(token, options), Effect.provide(FetchHttpClient.layer), Effect.runPromise)

export type {
  AssignUserRequest,
  DeleteAuthenticatorOptions,
  GetAuthenticatorOptions,
  ListPasskeyOptions,
} from "./passkey.js"
export type { ExchangeCodeOptions, VerifyTokenOptions } from "./principal.js"
export type { AuthenticatedTenancyOptions, TenancyOptions } from "./shared.js"
export { VerificationFailure } from "./principal.js"
export * from "./schemas/index.js"
