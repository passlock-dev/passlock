import { FetchHttpClient } from "@effect/platform";
import { Effect, Either, identity, Match, pipe } from "effect";

import {
  type Principal,
  exchangeCode as exchangeCodeE,
  verifyIdToken as verifyIdTokenE,
} from "./effect.js";

import type { VerificationError } from "./effect.js";
import type { InvalidCode } from "@passlock/shared/error";

import {
  type Forbidden,
  UnexpectedError,
  type ApiOptions,
  type AuthorizedApiOptions,
} from "../shared.js";

export type { VerificationError, Principal } from "./effect.js";

export { isPrincipal } from "./effect.js";

/**
 * Call the Passlock backend API to exchange a code for a Principal
 * @param code
 * @package options
 * @returns
 */
export const exchangeCode = (
  code: string,
  options: AuthorizedApiOptions,
): Promise<Principal | Forbidden | InvalidCode> =>
  pipe(
    exchangeCodeE(code, options),
    Effect.catchTags({
      ParseError: (err) => Effect.die(err),
      RequestError: (err) => Effect.die(err),
      ResponseError: (err) => Effect.die(err),
    }),
    Effect.match({
      onSuccess: identity,
      onFailure: identity,
    }),
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
  options: AuthorizedApiOptions,
): Promise<Principal> =>
  pipe(
    exchangeCodeE(code, options),
    Effect.either,
    Effect.provide(FetchHttpClient.layer),
    Effect.runPromise,
    (p) =>
      p.then((response) =>
        Either.match(response, {
          onLeft: (err) =>
            pipe(
              Match.value(err),
              Match.tag("ParseError", (err) => new UnexpectedError(err)),
              Match.tag("RequestError", (err) => new UnexpectedError(err)),
              Match.tag("ResponseError", (err) => new UnexpectedError(err)),
              Match.tag(
                "@error/InvalidCode",
                (err) => new UnexpectedError(err),
              ),
              Match.tag(
                "@error/Forbidden",
                ({ _tag }) =>
                  new UnexpectedError({ _tag, message: "Forbidden" }),
              ),
              Match.exhaustive,
              (serverError) => Promise.reject(serverError),
            ),
          onRight: (success) => Promise.resolve(success),
        }),
      ),
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
export const verifyIdToken = (
  token: string,
  options: ApiOptions,
): Promise<Principal | VerificationError> =>
  pipe(
    verifyIdTokenE(token, options),
    Effect.catchTags({
      ParseError: (err) => Effect.die(err),
    }),
    Effect.match({
      onSuccess: identity,
      onFailure: identity,
    }),
    Effect.provide(FetchHttpClient.layer),
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
  options: ApiOptions,
): Promise<Principal> =>
  pipe(
    verifyIdTokenE(token, options),
    Effect.either,
    Effect.provide(FetchHttpClient.layer),
    Effect.runPromise,
    (p) =>
      p.then((response) =>
        Either.match(response, {
          onLeft: (err) => Promise.reject(new UnexpectedError(err)),
          onRight: (success) => Promise.resolve(success),
        }),
      ),
  );
