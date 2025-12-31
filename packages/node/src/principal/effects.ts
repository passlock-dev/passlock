import type { ApiOptions, AuthorizedApiOptions } from "../shared.js"
import { FetchHttpClient, HttpClient, HttpClientResponse } from "@effect/platform"
import { Data, Effect, type Layer, Match, pipe, Schema } from "effect"
import * as jose from "jose"
import { Forbidden, InvalidCode } from "../schemas/errors.js"
import { ExtendedPrincipal, IdToken, type Principal } from "../schemas/principal.js"

type ExchangeCodeOptions = AuthorizedApiOptions

export const exchangeCode = (
  code: string,
  options: ExchangeCodeOptions,
  httpClient: Layer.Layer<HttpClient.HttpClient> = FetchHttpClient.layer
): Effect.Effect<ExtendedPrincipal, InvalidCode | Forbidden> =>
  pipe(
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      const baseUrl = options.endpoint ?? "https://api.passlock.dev"
      const { tenancyId } = options

      const url = new URL(`/${tenancyId}/principal/${code}`, baseUrl)

      const response = yield* pipe(
        client.get(url, {
          headers: { Authorization: `Bearer ${options.apiKey}` },
        })
      )

      const encoded = yield* HttpClientResponse.matchStatus(response, {
        "2xx": () => HttpClientResponse.schemaBodyJson(ExtendedPrincipal)(response),
        orElse: () =>
          HttpClientResponse.schemaBodyJson(Schema.Union(InvalidCode, Forbidden))(response),
      })

      return yield* pipe(
        Match.value(encoded),
        Match.tag("ExtendedPrincipal", (principal) => Effect.succeed(principal)),
        Match.tag("@error/InvalidCode", (err) => Effect.fail(err)),
        Match.tag("@error/Forbidden", (err) => Effect.fail(err)),
        Match.exhaustive
      )
    }),
    Effect.catchTags({
      ParseError: (err) => Effect.die(err),
      RequestError: (err) => Effect.die(err),
      ResponseError: (err) => Effect.die(err),
    }),
    Effect.provide(httpClient)
  )

type VerifyTokenOptions = ApiOptions

const createJwks = (endpoint?: string) =>
  Effect.sync(() => {
    const baseUrl = endpoint ?? "https://api.passlock.dev"

    return jose.createRemoteJWKSet(new URL("/.well-known/jwks.json", baseUrl))
  })

const createCachedRemoteJwks = pipe(Effect.cachedFunction(createJwks), Effect.runSync)

export class VerificationFailure extends Data.TaggedError("@error/VerificationFailure")<{
  message: string
}> {}

export const verifyIdToken = (
  token: string,
  options: VerifyTokenOptions
): Effect.Effect<Principal, VerificationFailure> =>
  pipe(
    Effect.gen(function* () {
      const JWKS = yield* createCachedRemoteJwks(options.endpoint)

      const { payload } = yield* Effect.tryPromise({
        catch: (err) => {
          console.error(err)
          return err instanceof Error
            ? new VerificationFailure({ message: err.message })
            : new VerificationFailure({ message: String(err) })
        },
        try: () =>
          jose.jwtVerify(token, JWKS, {
            audience: options.tenancyId,
            issuer: "passlock.dev",
          }),
      })

      const idToken = yield* Schema.decodeUnknown(IdToken)({
        ...payload,
        _tag: "IdToken",
      })

      const principal: Principal = {
        _tag: "Principal",
        authenticatorId: idToken["a:id"],
        authenticatorType: "passkey",
        createdAt: idToken.iat * 1000,
        expiresAt: idToken.exp * 1000,
        passkey: {
          userVerified: idToken["pk:uv"],
          verified: true,
        },
        userId: idToken.sub,
      }

      return principal
    }),
    Effect.catchTag("ParseError", (err) => Effect.die(err))
  )

export type { ExchangeCodeOptions, Principal, VerifyTokenOptions }
