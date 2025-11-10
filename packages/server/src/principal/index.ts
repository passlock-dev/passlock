import { FetchHttpClient } from "@effect/platform";
import { Effect, Either, Match, pipe } from "effect";

import {
  exchangeCode as exchangeCodeE,
  verifyIdToken as verifyIdTokenE,
} from "./effect.js";

import type {
  AuthenticatedPasslockOptions,
  PasslockOptions,
  Principal,
  VerificationSuccess,
} from "./effect.js";

export type {
  IdToken,
  Principal,
  VerificationError,
  VerificationSuccess,
} from "./effect.js";

export class ServerError extends Error {
  readonly _tag: string;

  constructor(data: { _tag: string; message: string }) {
    super(data.message);
    this._tag = data._tag;
  }

  override readonly toString = (): string =>
    `${this.message} (_tag: ${this._tag})`;
}

/**
 * Call the Passlock backend API to exchange a code for a Principal
 * @param code
 * @package options
 * @returns
 */
export const exchangeCode = (
  code: string,
  options: AuthenticatedPasslockOptions,
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
              Match.tag("ParseError", (err) => new ServerError(err)),
              Match.tag("RequestError", (err) => new ServerError(err)),
              Match.tag("ResponseError", (err) => new ServerError(err)),
              Match.tag("InvalidCodeError", (err) => new ServerError(err)),
              Match.tag(
                "Forbidden",
                ({ _tag }) => new ServerError({ _tag, message: "Forbidden" }),
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
  options: PasslockOptions,
): Promise<VerificationSuccess> =>
  pipe(
    verifyIdTokenE(token, options),
    Effect.either,
    Effect.provide(FetchHttpClient.layer),
    Effect.runPromise,
    (p) =>
      p.then((response) =>
        Either.match(response, {
          onLeft: (err) => Promise.reject(new ServerError(err)),
          onRight: (success) => Promise.resolve(success),
        }),
      ),
  );
