import { FetchHttpClient } from "@effect/platform";
import { Effect, Either, pipe } from "effect";
import * as PrincipalEffect from "./effect.js";

interface ExchangeCodeCommand {
  tenancyId: string
  code: string
  endpoint?: string
}

export class ServerError extends Error {
  readonly _tag: string
  
  constructor(data: { _tag: string, message: string }) {
    super(data.message)
    this._tag = data._tag
  }

  override readonly toString = () => `${this.message} (_tag: ${this._tag})`
}

export const exchangeCode = ({ tenancyId, code, endpoint }: ExchangeCodeCommand) => pipe(
  PrincipalEffect.exchangeCode({ tenancyId, code, ...(endpoint? { endpoint } : {}) }),
  Effect.either,
  Effect.provide(FetchHttpClient.layer),
  Effect.runPromise,
  (p) => p.then((response) =>
    Either.match(response, {
      onLeft: (err) => Promise.reject(new ServerError(err)),
      onRight: (success) => Promise.resolve(success)
    })
  )
)

interface VerificationCommand {
  id_token: string, 
  tenancyId: string, 
  endpoint?: string
}

export const verifyIdToken = ({ tenancyId, id_token, endpoint }: VerificationCommand) => pipe(
  PrincipalEffect.verifyIdToken({ tenancyId, id_token, ...(endpoint? { endpoint } : {}) }),
  Effect.either,
  Effect.provide(FetchHttpClient.layer),
  Effect.runPromise,
  (p) => p.then((response) =>
    Either.match(response, {
      onLeft: (err) => Promise.reject(new ServerError(err)),
      onRight: (success) => Promise.resolve(success)
    })
  )
)