import { FetchHttpClient } from "@effect/platform";
import { Effect, identity, pipe } from "effect";

import {
  exchangeCode as exchangeCodeE,
  verifyIdToken as verifyIdTokenE,
  type ExchangeCodeOptions,
  type VerifyTokenOptions,
} from "./effect.js";

import type { VerificationFailure } from "../shared.js";

import type { Forbidden, InvalidCode } from "../schemas/errors.js";
import type { Principal } from "../schemas/principal.js";

export * from "../schemas/principal.js";

export type { InvalidCode } from "../schemas/errors.js";
export type { ExchangeCodeOptions, Principal } from "./effect.js";

/**
 * Call the Passlock backend API to exchange a code for a Principal
 * @param code
 * @package options
 * @returns
 */
export const exchangeCode = (
  code: string,
  options: ExchangeCodeOptions,
): Promise<Principal | Forbidden | InvalidCode> =>
  pipe(
    exchangeCodeE(code, options),
    Effect.match({ onFailure: identity, onSuccess: identity }),
    Effect.provide(FetchHttpClient.layer),
    Effect.runPromise,
  );

/**
 * Call the Passlock backend API to exchange a code for a Principal
 * @param code
 * @package options
 * @returns
 */
export const exchangeCodeUnsafe = (
  code: string,
  options: ExchangeCodeOptions,
): Promise<Principal> =>
  pipe(
    exchangeCodeE(code, options),
    Effect.provide(FetchHttpClient.layer),
    Effect.runPromise,
  );

export { VerificationFailure } from "../shared.js";
export type { VerifyTokenOptions } from "./effect.js";

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
export const verifyIdToken = (
  token: string,
  options: VerifyTokenOptions,
): Promise<Principal | VerificationFailure> =>
  pipe(
    verifyIdTokenE(token, options),
    Effect.match({ onFailure: identity, onSuccess: identity }),
    Effect.runPromise,
  );

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
export const verifyIdTokenUnsafe = (
  token: string,
  options: VerifyTokenOptions,
): Promise<Principal> =>
  pipe(
    verifyIdTokenE(token, options),
    Effect.provide(FetchHttpClient.layer),
    Effect.runPromise,
  );
