import type { Forbidden, NotFound } from "../schemas/errors.js"
import type {
  AssignUserRequest,
  DeleteAuthenticatorOptions,
  GetAuthenticatorOptions,
  Passkey,
} from "./effects.js"
import { Effect, identity, pipe } from "effect"
import {
  assignUser as assignUserE,
  deletePasskey as deletePasskeyE,
  getPasskey as getPasskeyE,
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
): Promise<{ passkeyId: string } | Forbidden | NotFound> =>
  pipe(
    deletePasskeyE(passkeyId, options),
    Effect.as({ passkeyId }),
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
 * @param request
 * @param request
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
