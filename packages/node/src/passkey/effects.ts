import type { AuthorizedApiOptions } from "../shared.js"
import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform"
import { Effect, type Layer, Match, pipe, Schema } from "effect"
import { Forbidden, NotFound } from "../schemas/errors.js"
import { Passkey } from "../schemas/passkey.js"

/* Get Passkey */

export type GetPasskeyOptions = AuthorizedApiOptions

export const getPasskey = (
  authenticatorId: string,
  options: GetPasskeyOptions,
  httpClient: Layer.Layer<HttpClient.HttpClient> = FetchHttpClient.layer
): Effect.Effect<Passkey, NotFound | Forbidden> =>
  pipe(
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      const baseUrl = options.endpoint ?? "https://api.passlock.dev"
      const { tenancyId } = options

      const url = new URL(`/${tenancyId}/passkeys/${authenticatorId}`, baseUrl)

      const response = yield* HttpClientRequest.get(url, {
        headers: { Authorization: `Bearer ${options.apiKey}` },
      }).pipe(client.execute)

      const encoded = yield* HttpClientResponse.matchStatus(response, {
        "2xx": () => HttpClientResponse.schemaBodyJson(Passkey)(response),
        orElse: () =>
          HttpClientResponse.schemaBodyJson(Schema.Union(Forbidden, NotFound))(response),
      })

      return yield* pipe(
        Match.value(encoded),
        Match.tag("Passkey", (data) => Effect.succeed(data)),
        Match.tag("@error/Forbidden", (err) => Effect.fail(err)),
        Match.tag("@error/NotFound", (err) => Effect.fail(err)),
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

export type { GetPasskeyOptions as GetAuthenticatorOptions, Passkey }

/* Delete Passkey */

type DeleteAuthenticatorOptions = AuthorizedApiOptions

export const deletePasskey = (
  authenticatorId: string,
  request: DeleteAuthenticatorOptions,
  httpClient: Layer.Layer<HttpClient.HttpClient> = FetchHttpClient.layer
): Effect.Effect<void, NotFound | Forbidden> =>
  pipe(
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      const baseUrl = request.endpoint ?? "https://api.passlock.dev"
      const { tenancyId } = request

      const url = new URL(`/${tenancyId}/passkeys/${authenticatorId}`, baseUrl)

      const response = yield* HttpClientRequest.del(url, {
        headers: { Authorization: `Bearer ${request.apiKey}` },
      }).pipe(client.execute)

      const encoded = yield* HttpClientResponse.matchStatus(response, {
        "2xx": () => Effect.succeed(null),
        orElse: () =>
          HttpClientResponse.schemaBodyJson(Schema.Union(Forbidden, NotFound))(response),
      })

      yield* pipe(
        Match.value(encoded),
        Match.when(Match.null, () => Effect.void),
        Match.tag("@error/Forbidden", (err) => Effect.fail(err)),
        Match.tag("@error/NotFound", (err) => Effect.fail(err)),
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

export type { DeleteAuthenticatorOptions }

/* Assign User */

interface AssignUserRequest extends AuthorizedApiOptions {
  userId: string
  passkeyId: string
}

export const assignUser = (
  request: AssignUserRequest,
  httpClient: Layer.Layer<HttpClient.HttpClient> = FetchHttpClient.layer
): Effect.Effect<Passkey, NotFound | Forbidden> =>
  pipe(
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      const baseUrl = request.endpoint ?? "https://api.passlock.dev"
      const { userId, passkeyId } = request
      const { tenancyId } = request

      const url = new URL(`/${tenancyId}/passkeys/${passkeyId}`, baseUrl)

      const response = yield* HttpClientRequest.patch(url, {
        headers: { Authorization: `Bearer ${request.apiKey}` },
      }).pipe(HttpClientRequest.bodyJson({ userId }), Effect.flatMap(client.execute))

      const encoded = yield* HttpClientResponse.matchStatus(response, {
        "2xx": () => HttpClientResponse.schemaBodyJson(Passkey)(response),
        orElse: () =>
          HttpClientResponse.schemaBodyJson(Schema.Union(NotFound, Forbidden))(response),
      })

      return yield* pipe(
        Match.value(encoded),
        Match.tag("Passkey", (passkey) => Effect.succeed(passkey)),
        Match.tag("@error/NotFound", (err) => Effect.fail(err)),
        Match.tag("@error/Forbidden", (err) => Effect.fail(err)),
        Match.exhaustive
      )
    }),
    Effect.catchTags({
      HttpBodyError: (err) => Effect.die(err),
      ParseError: (err) => Effect.die(err),
      RequestError: (err) => Effect.die(err),
      ResponseError: (err) => Effect.die(err),
    }),
    Effect.provide(httpClient)
  )

export type { AssignUserRequest }
