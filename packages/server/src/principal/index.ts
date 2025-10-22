import { FetchHttpClient } from "@effect/platform";
import { Effect, Either, pipe } from "effect";
import {
  exchangeCode as exchangeCodeE,
  verifyIdToken as verifyIdTokenE,
} from "./effect.js";
import type { ExchangeCode, VerifyIdToken } from "./effect.js";

export class ServerError extends Error {
  readonly _tag: string;

  constructor(data: { _tag: string; message: string }) {
    super(data.message);
    this._tag = data._tag;
  }

  override readonly toString = () => `${this.message} (_tag: ${this._tag})`;
}

export type {
  ExchangeCode,
  VerifyIdToken,
  Principal,
  IdToken,
  VerificationSuccess,
  VerificationError,
} from "./effect.js";

export const exchangeCode = (cmd: ExchangeCode) =>
  pipe(
    exchangeCodeE(cmd),
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

export const verifyIdToken = (cmd: VerifyIdToken) =>
  pipe(
    verifyIdTokenE(cmd),
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
