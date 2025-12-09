import { FetchHttpClient } from "@effect/platform";
import { Effect, identity, pipe } from "effect";

import type { GetAuthenticatorOptions, Passkey } from "./getPasskey.js";
import { getPasskey as getPasskeyE } from "./getPasskey.js";

import type { AssignUserRequest } from "./assignUser.js";
import { assignUser as assignUserE } from "./assignUser.js";

import type { Forbidden, NotFound } from "../schemas/errors.js";
import type { DeleteAuthenticatorOptions } from "./deletePasskey.js";
import { deletePasskey as deletePasskeyE } from "./deletePasskey.js";

export * from "../schemas/passkey.js";

export type { AssignUserRequest } from "./assignUser.js";

/**
 * Call the Passlock backend API to assign a userId to an authenticator
 * @param request
 * @param request
 * @returns
 */
export const assignUser = (
  request: AssignUserRequest,
): Promise<Passkey | NotFound | Forbidden> =>
  pipe(
    assignUserE(request),
    Effect.provide(FetchHttpClient.layer),
    Effect.match({ onFailure: identity, onSuccess: identity }),
    Effect.runPromise,
  );

/**
 * Call the Passlock backend API to assign a userId to an authenticator
 * @param request
 * @param request
 * @returns
 */
export const assignUserUnsafe = (
  request: AssignUserRequest,
): Promise<Passkey> =>
  pipe(
    assignUserE(request),
    Effect.provide(FetchHttpClient.layer),
    Effect.runPromise,
  );

export type { DeleteAuthenticatorOptions } from "./deletePasskey.js";

/**
 * Call the Passlock backend API to delete an authenticator
 * @param options
 * @param options
 * @returns
 */
export const deletePasskey = (
  passkeyId: string,
  options: DeleteAuthenticatorOptions,
): Promise<{ passkeyId: string } | Forbidden | NotFound> =>
  pipe(
    deletePasskeyE(passkeyId, options),
    Effect.as({ passkeyId }),
    Effect.provide(FetchHttpClient.layer),
    Effect.match({ onFailure: identity, onSuccess: identity }),
    Effect.runPromise,
  );

/**
 * Call the Passlock backend API to delete an authenticator
 * @param options
 * @param options
 * @returns
 */
export const deletePasskeyUnsafe = (
  passkeyId: string,
  options: DeleteAuthenticatorOptions,
): Promise<{ passkeyId: string }> =>
  pipe(
    deletePasskeyE(passkeyId, options),
    Effect.as({ passkeyId }),
    Effect.provide(FetchHttpClient.layer),
    Effect.runPromise,
  );

export type { GetAuthenticatorOptions, Passkey } from "./getPasskey.js";

/**
 * Call the Passlock backend API to fetch an authenticator
 * @param request
 * @param request
 * @returns
 */
export const getPasskey = (
  authenticatorId: string,
  options: GetAuthenticatorOptions,
): Promise<Passkey | Forbidden | NotFound> =>
  pipe(
    getPasskeyE(authenticatorId, options),
    Effect.provide(FetchHttpClient.layer),
    Effect.match({ onFailure: identity, onSuccess: identity }),
    Effect.runPromise,
  );

/**
 * Call the Passlock backend API to fetch an authenticator
 * @param request
 * @param request
 * @returns
 */
export const getPasskeyUnsafe = (
  authenticatorId: string,
  options: GetAuthenticatorOptions,
): Promise<Passkey> =>
  pipe(
    getPasskeyE(authenticatorId, options),
    Effect.provide(FetchHttpClient.layer),
    Effect.runPromise,
  );
