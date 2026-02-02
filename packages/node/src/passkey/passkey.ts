import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform"

import {
  Chunk,
  Effect,
  type Layer,
  Match,
  Option,
  pipe,
  Schema,
  Stream,
} from "effect"
import type { satisfy } from "src/schemas/satisfy.js"
import { FindAllPasskeysSchema, Forbidden, NotFound } from "../schemas/index.js"
import {
  type CredentialDeviceType,
  DeletedPasskeySchema,
  PasskeySchema,
  PasskeySummarySchema,
  type Transports,
} from "../schemas/passkey.js"
import type { AuthenticatedOptions } from "../shared.js"

/**
 * WebAuthn specific passkey data
 */
export type Credential = {
  id: string
  userId: string
  username: string
  aaguid: string
  backedUp: boolean
  counter: number
  deviceType: CredentialDeviceType
  transports: ReadonlyArray<Transports>
  publicKey: Uint8Array<ArrayBufferLike>
}

/**
 * Passkeys are usually synced across devices **but only within
 * a specific platform/ecosystem** e.g. a passkey created on Apple
 * devices would typically be synced across devices sharing the same
 * iCloud ID.
 *
 * However, if the user also wants to sign in from their Windows
 * or Android/Chrome devices they will need an additional passkey.
 * Therefore when listing the passkeys registered to a user's account
 * it's a good idea to tell them which platform the passkeys relate to.
 *
 * We've also included links to icons (SVG) so you can give your users
 * a quick visual indication.
 */
export type Platform = {
  name?: string | undefined
  icon?: string | undefined
}

/**
 * The server-side component of a passkey
 *
 * @category Passkeys
 */
export type Passkey = {
  _tag: "Passkey"
  /**
   * Not to be confused with the credential.id
   */
  id: string
  /**
   * Not to be confused with the credential.userId
   */
  userId?: string | undefined
  enabled: boolean
  credential: Credential
  platform?: Platform | undefined
  lastUsed?: number | undefined
  createdAt: number
  updatedAt: number
}

export const isPasskey = (payload: unknown): payload is Passkey =>
  Schema.is(PasskeySchema)(payload)

/**
 * needed to ensure the Passkey === Passkey.Type
 * @internal
 * */
export type _Passkey = satisfy<typeof PasskeySchema.Type, Passkey>

export type PasskeySummary = {
  readonly _tag: "PasskeySummary"
  readonly id: string
  readonly userId: string
  readonly enabled: boolean
  readonly credential: {
    readonly id: string
    readonly userId: string
  }
  readonly lastUsed?: number | undefined
  readonly createdAt: number
}

export const isPasskeySummary = (payload: unknown): payload is PasskeySummary =>
  Schema.is(PasskeySummarySchema)(payload)

/**
 * needed to ensure the PasskeySummary === PasskeySummary.Type
 * @internal
 */
export type _PasskeySummary = satisfy<
  typeof PasskeySummarySchema.Type,
  PasskeySummary
>

export type FindAllPasskeys = {
  readonly _tag: "FindAllPasskeys"
  readonly cursor: string | null
  readonly records: ReadonlyArray<PasskeySummary>
}

/**
 * needed to ensure the FindAllPasskeys === FindAllPasskeys.Type
 * @internal
 */
export type _FindAllPasskeys = satisfy<
  typeof FindAllPasskeysSchema.Type,
  FindAllPasskeys
>

export type DeletedPasskey = {
  readonly _tag: "DeletedPasskey"
  readonly id: string
  readonly credentialId: string
  readonly rpId: string
}

export const isDeletedPasskey = (payload: unknown): payload is DeletedPasskey =>
  Schema.is(DeletedPasskeySchema)(payload)

/**
 * needed to ensure the DeletedPasskey === DeletedPasskey.Type
 * @internal
 */
export type _DeletedPasskey = satisfy<
  typeof DeletedPasskeySchema.Type,
  DeletedPasskey
>

/* Get Passkey */

export interface GetPasskeyOptions extends AuthenticatedOptions {
  passkeyId: string
}

export const getPasskey = (
  options: GetPasskeyOptions,
  httpClient: Layer.Layer<HttpClient.HttpClient> = FetchHttpClient.layer
): Effect.Effect<Passkey, NotFound | Forbidden> =>
  pipe(
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      const baseUrl = options.endpoint ?? "https://api.passlock.dev"
      const { tenancyId, passkeyId } = options

      const url = new URL(`/${tenancyId}/passkeys/${passkeyId}`, baseUrl)

      const response = yield* HttpClientRequest.get(url, {
        headers: { Authorization: `Bearer ${options.apiKey}` },
      }).pipe(client.execute)

      const encoded = yield* HttpClientResponse.matchStatus(response, {
        "2xx": () => HttpClientResponse.schemaBodyJson(PasskeySchema)(response),
        orElse: () =>
          HttpClientResponse.schemaBodyJson(Schema.Union(Forbidden, NotFound))(
            response
          ),
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

/* Delete Passkey */

export interface DeletePasskeyOptions extends AuthenticatedOptions {
  passkeyId: string
}

export const deletePasskey = (
  options: DeletePasskeyOptions,
  httpClient: Layer.Layer<HttpClient.HttpClient> = FetchHttpClient.layer
): Effect.Effect<DeletedPasskey, NotFound | Forbidden> =>
  pipe(
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      const baseUrl = options.endpoint ?? "https://api.passlock.dev"
      const { tenancyId, passkeyId } = options

      const url = new URL(`/${tenancyId}/passkeys/${passkeyId}`, baseUrl)

      const response = yield* HttpClientRequest.del(url, {
        headers: { Authorization: `Bearer ${options.apiKey}` },
      }).pipe(client.execute)

      const encoded = yield* HttpClientResponse.matchStatus(response, {
        "2xx": () =>
          HttpClientResponse.schemaBodyJson(DeletedPasskeySchema)(response),
        orElse: () =>
          HttpClientResponse.schemaBodyJson(Schema.Union(Forbidden, NotFound))(
            response
          ),
      })

      return yield* pipe(
        Match.value(encoded),
        Match.tag("DeletedPasskey", (deletedPasskey) =>
          Effect.succeed(deletedPasskey)
        ),
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

/* Assign User */

/**
 * @category Passkeys
 */
export interface AssignUserOptions extends AuthenticatedOptions {
  passkeyId: string

  /**
   * Custom User ID to align with your own systems
   */
  userId: string
}

// TODO reuse updatePasskey
export const assignUser = (
  options: AssignUserOptions,
  httpClient: Layer.Layer<HttpClient.HttpClient> = FetchHttpClient.layer
): Effect.Effect<Passkey, NotFound | Forbidden> =>
  pipe(
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      const baseUrl = options.endpoint ?? "https://api.passlock.dev"
      const { userId, passkeyId } = options
      const { tenancyId } = options

      const url = new URL(`/${tenancyId}/passkeys/${passkeyId}`, baseUrl)

      const response = yield* HttpClientRequest.patch(url, {
        headers: { Authorization: `Bearer ${options.apiKey}` },
      }).pipe(
        HttpClientRequest.bodyJson({ userId }),
        Effect.flatMap(client.execute)
      )

      const encoded = yield* HttpClientResponse.matchStatus(response, {
        "2xx": () => HttpClientResponse.schemaBodyJson(PasskeySchema)(response),
        orElse: () =>
          HttpClientResponse.schemaBodyJson(Schema.Union(NotFound, Forbidden))(
            response
          ),
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

export interface UpdatePasskeyOptions extends AuthenticatedOptions {
  passkeyId: string
  userId?: string
  username?: string
}

export const updatePasskey = (
  options: UpdatePasskeyOptions,
  httpClient: Layer.Layer<HttpClient.HttpClient> = FetchHttpClient.layer
): Effect.Effect<Passkey, NotFound | Forbidden> =>
  pipe(
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      const baseUrl = options.endpoint ?? "https://api.passlock.dev"
      const { userId, passkeyId, username } = options
      const { tenancyId } = options

      const url = new URL(`/${tenancyId}/passkeys/${passkeyId}`, baseUrl)

      const response = yield* HttpClientRequest.patch(url, {
        headers: { Authorization: `Bearer ${options.apiKey}` },
      }).pipe(
        HttpClientRequest.bodyJson({ userId, username }),
        Effect.flatMap(client.execute)
      )

      const encoded = yield* HttpClientResponse.matchStatus(response, {
        "2xx": () => HttpClientResponse.schemaBodyJson(PasskeySchema)(response),
        orElse: () =>
          HttpClientResponse.schemaBodyJson(Schema.Union(NotFound, Forbidden))(
            response
          ),
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

/* List Passkeys */

export const listPasskeysStream = (
  options: AuthenticatedOptions,
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

export interface ListPasskeyOptions extends AuthenticatedOptions {
  cursor?: string
}

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
        "2xx": () =>
          HttpClientResponse.schemaBodyJson(FindAllPasskeysSchema)(response),
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
