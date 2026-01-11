import type { Forbidden, NotFound } from "../schemas/errors.js"
import type { DeletedPasskey, FindAllPasskeys, PasskeySummary } from "../schemas/passkey.js"
import type { AuthenticatedTenancyOptions } from "../shared.js"
import type {
  AssignUserRequest,
  DeleteAuthenticatorOptions,
  GetAuthenticatorOptions,
  ListPasskeyOptions,
  Passkey,
} from "./effects.js"
import { Effect, identity, pipe, Stream } from "effect"
import {
  assignUser as assignUserE,
  deletePasskey as deletePasskeyE,
  getPasskey as getPasskeyE,
  listPasskeys as listPasskeysE,
  listPasskeysStream as listPasskeysStreamE,
} from "./effects.js"

/**
 * Call the Passlock backend API to assign a userId to an authenticator
 * @param request
 * @param request
 * @returns
 */
export const assignUser = (request: AssignUserRequest): Promise<Passkey | NotFound | Forbidden> =>
  pipe(
    assignUserE(request),
    Effect.match({ onFailure: identity, onSuccess: identity }),
    Effect.runPromise
  )

/**
 * Call the Passlock backend API to assign a userId to an authenticator
 * @param request
 * @param request
 * @returns
 */
export const assignUserUnsafe = (request: AssignUserRequest): Promise<Passkey> =>
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
): Promise<DeletedPasskey | Forbidden | NotFound> =>
  pipe(
    deletePasskeyE(passkeyId, options),
    Effect.match({ onFailure: identity, onSuccess: identity }),
    Effect.runPromise
  )

/**
 * Call the Passlock backend API to delete an authenticator
 * @param options
 * @param options
 * @returns
 */
export const deletePasskeyUnsafe = (
  passkeyId: string,
  options: DeleteAuthenticatorOptions
): Promise<{ passkeyId: string }> =>
  pipe(deletePasskeyE(passkeyId, options), Effect.as({ passkeyId }), Effect.runPromise)

/**
 * Call the Passlock backend API to fetch an authenticator
 * @param request
 * @param request
 * @returns
 */
export const getPasskey = (
  authenticatorId: string,
  options: GetAuthenticatorOptions
): Promise<Passkey | Forbidden | NotFound> =>
  pipe(
    getPasskeyE(authenticatorId, options),
    Effect.match({ onFailure: identity, onSuccess: identity }),
    Effect.runPromise
  )

/**
 * Call the Passlock backend API to fetch an authenticator
 * @param authenticatorId
 * @param options
 * @returns
 */
export const getPasskeyUnsafe = (
  authenticatorId: string,
  options: GetAuthenticatorOptions
): Promise<Passkey> => pipe(getPasskeyE(authenticatorId, options), Effect.runPromise)

export type {
  AssignUserRequest,
  DeleteAuthenticatorOptions,
  GetAuthenticatorOptions,
  Passkey,
} from "./effects.js"

/**
 * List passkeys for the given tenancy. Note this could return a cursor, in which case the function chould be called with the given cursor.
 * @param options
 * @returns
 */
export const listPasskeys = (options: ListPasskeyOptions): Promise<FindAllPasskeys | Forbidden> =>
  pipe(
    listPasskeysE(options),
    Effect.match({ onFailure: identity, onSuccess: identity }),
    Effect.runPromise
  )

/**
 * List passkeys for the given tenancy. Note this could return a cursor, in which case the function chould be called with the given cursor.
 * @param options
 * @returns
 */
export const listPasskeysUnsafe = (options: ListPasskeyOptions): Promise<FindAllPasskeys> =>
  pipe(listPasskeysE(options), Effect.runPromise)

export const listPasskeysStream = (
  options: AuthenticatedTenancyOptions
): ReadableStream<PasskeySummary> =>
  pipe(listPasskeysStreamE(options), (stream) => Stream.toReadableStream(stream))

export type { ListPasskeyOptions } from "./effects.js"
