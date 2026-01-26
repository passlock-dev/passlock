import type { AuthenticatedTenancyOptions } from "./shared.js"
import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform"
import { Chunk, Effect, type Layer, Match, Option, pipe, Schema, Stream } from "effect"
import { Forbidden, NotFound } from "./schemas/errors.js"
import { FindAllPasskeys } from "./schemas/index.js"
import { DeletedPasskey, Passkey, type PasskeySummary } from "./schemas/passkey.js"

/* Get Passkey */

export type GetPasskeyOptions = AuthenticatedTenancyOptions

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

type DeleteAuthenticatorOptions = AuthenticatedTenancyOptions

export const deletePasskey = (
  passkeyId: string,
  request: DeleteAuthenticatorOptions,
  httpClient: Layer.Layer<HttpClient.HttpClient> = FetchHttpClient.layer
): Effect.Effect<DeletedPasskey, NotFound | Forbidden> =>
  pipe(
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      const baseUrl = request.endpoint ?? "https://api.passlock.dev"
      const { tenancyId } = request

      const url = new URL(`/${tenancyId}/passkeys/${passkeyId}`, baseUrl)

      const response = yield* HttpClientRequest.del(url, {
        headers: { Authorization: `Bearer ${request.apiKey}` },
      }).pipe(client.execute)

      const encoded = yield* HttpClientResponse.matchStatus(response, {
        "2xx": () => HttpClientResponse.schemaBodyJson(DeletedPasskey)(response),
        orElse: () =>
          HttpClientResponse.schemaBodyJson(Schema.Union(Forbidden, NotFound))(response),
      })

      return yield* pipe(
        Match.value(encoded),
        Match.tag("DeletedPasskey", (deletedPasskey) => Effect.succeed(deletedPasskey)),
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

interface AssignUserRequest extends AuthenticatedTenancyOptions {
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

/* List Passkeys */

export interface ListPasskeyOptions extends AuthenticatedTenancyOptions {
  cursor?: string
}

export const listPasskeysStream = (
  options: AuthenticatedTenancyOptions,
  httpClient: Layer.Layer<HttpClient.HttpClient> = FetchHttpClient.layer
): Stream.Stream<PasskeySummary, Forbidden> =>
  pipe(
    Stream.paginateChunkEffect(null as string | null, (cursor) =>
      pipe(
        listPasskeys(cursor ? { ...options, cursor } : options, httpClient),
        Effect.map((result) => [
          Chunk.fromIterable(result.records),
          Option.fromNullable(result.cursor),
        ])
      )
    )
  )

export const listPasskeys = (
  options: ListPasskeyOptions,
  httpClient: Layer.Layer<HttpClient.HttpClient> = FetchHttpClient.layer
): Effect.Effect<FindAllPasskeys, Forbidden> =>
  pipe(
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      const baseUrl = options.endpoint ?? "https://api.passlock.dev"
      const { tenancyId } = options

      const url = new URL(`/${tenancyId}/passkeys/`, baseUrl)
      if (options.cursor) {
        url.searchParams.append("cursor", options.cursor)
      }

      const response = yield* HttpClientRequest.get(url, {
        headers: { Authorization: `Bearer ${options.apiKey}` },
      }).pipe(client.execute)

      const encoded = yield* HttpClientResponse.matchStatus(response, {
        "2xx": () => HttpClientResponse.schemaBodyJson(FindAllPasskeys)(response),
        orElse: () => HttpClientResponse.schemaBodyJson(Forbidden)(response),
      })

      return yield* pipe(
        Match.value(encoded),
        Match.tag("FindAllPasskeys", (data) => Effect.succeed(data)),
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
