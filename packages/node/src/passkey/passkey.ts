import {
  Array,
  Chunk,
  Effect,
  type Layer,
  Match,
  Option,
  pipe,
  Schema,
  Stream,
} from "effect"
import type { satisfy } from "../schemas/satisfy.js"
import {
  fetchNetwork,
  matchStatus,
  type NetworkFetch,
  NetworkFetchLive,
  type NetworkPayloadError,
  type NetworkRequestError,
  type NetworkResponse,
  type NetworkResponseError,
} from "../network.js"
import {
  FindAllPasskeys as FindAllPasskeysSchema,
  ForbiddenError,
  NotFoundError,
} from "../schemas/index.js"
import * as PasskeySchemas from "../schemas/passkey.js"
import type { AuthenticatedOptions } from "../shared.js"

/* Passkey */

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
  deviceType: PasskeySchemas.CredentialDeviceType
  transports: ReadonlyArray<PasskeySchemas.Transports>
  publicKey: Uint8Array<ArrayBufferLike>
  rpId: string
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
  Schema.is(PasskeySchemas.Passkey)(payload)

/**
 * needed to ensure the Passkey === Passkey.Type
 * @internal
 * */
export type _Passkey = satisfy<typeof PasskeySchemas.Passkey.Type, Passkey>

/* PasskeySummary */

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
  Schema.is(PasskeySchemas.PasskeySummary)(payload)

/**
 * needed to ensure the PasskeySummary === PasskeySummary.Type
 * @internal
 */
export type _PasskeySummary = satisfy<
  typeof PasskeySchemas.PasskeySummary.Type,
  PasskeySummary
>

/* UpdatedPasskeys */

export type UpdatedPasskeys = {
  _tag: "UpdatedPasskeys"
  updated: ReadonlyArray<Passkey>
}

export const isUpdatedPasskeys = (
  payload: unknown
): payload is UpdatedPasskeys =>
  Schema.is(PasskeySchemas.UpdatedPasskeys)(payload)

/**
 * needed to ensure the UpdatedPasskeys === UpdatedPasskeys.Type
 * @internal
 * */
export type _UpdatedPasskeys = satisfy<
  typeof PasskeySchemas.UpdatedPasskeys.Type,
  UpdatedPasskeys
>

/* FindAllPasskeys */

export type FindAllPasskeys = {
  readonly _tag: "FindAllPasskeys"
  readonly cursor: string | null
  readonly records: ReadonlyArray<PasskeySummary>
}

export const isFindAllPasskeys = (
  payload: unknown
): payload is FindAllPasskeys =>
  Schema.is(PasskeySchemas.FindAllPasskeys)(payload)

/**
 * needed to ensure the FindAllPasskeys === FindAllPasskeys.Type
 * @internal
 */
export type _FindAllPasskeys = satisfy<
  typeof FindAllPasskeysSchema.Type,
  FindAllPasskeys
>

/* UpdatedPasskeyUsernames (update names by userId) */

export type UpdatedPasskeyUsernames = {
  _tag: "UpdatedPasskeyUsernames"
  credentials: ReadonlyArray<{
    rpId: string
    userId: string
    username: string
    displayName: string
  }>
}

export const isUpdatedPasskeyUsernames = (
  payload: unknown
): payload is UpdatedPasskeyUsernames => {
  if (typeof payload !== "object") return false
  if (payload === null) return false
  if (!("_tag" in payload)) return false
  if (typeof payload._tag !== "string") return false
  if (payload._tag !== "UpdatedPasskeyUsernames") return false

  return true
}

/* END UpdatedPasskeyUsernames */

const authorizationHeaders = (apiKey: string) => ({
  authorization: `Bearer ${apiKey}`,
})

const decodeResponseJson = <A, I, R>(
  response: NetworkResponse,
  schema: Schema.Schema<A, I, R>
) => pipe(response.json, Effect.flatMap(Schema.decodeUnknown(schema)))

/* Get Passkey */

export interface GetPasskeyOptions extends AuthenticatedOptions {
  passkeyId: string
}

export const getPasskey = (
  options: GetPasskeyOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<Passkey, NotFoundError | ForbiddenError> =>
  pipe(
    Effect.gen(function* () {
      const baseUrl = options.endpoint ?? "https://api.passlock.dev"
      const { tenancyId, passkeyId } = options

      const url = new URL(`/${tenancyId}/passkeys/${passkeyId}`, baseUrl)

      const response = yield* fetchNetwork(url, "get", undefined, {
        headers: authorizationHeaders(options.apiKey),
      })

      const encoded: Passkey | ForbiddenError | NotFoundError =
        yield* matchStatus(response, {
          "2xx": (res) => decodeResponseJson(res, PasskeySchemas.Passkey),
          orElse: (res) =>
            decodeResponseJson(
              res,
              Schema.Union(ForbiddenError, NotFoundError)
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
      "@error/NetworkPayload": (err: NetworkPayloadError) => Effect.die(err),
      "@error/NetworkRequest": (err: NetworkRequestError) => Effect.die(err),
      "@error/NetworkResponse": (err: NetworkResponseError) => Effect.die(err),
      ParseError: (err) => Effect.die(err),
    }),
    Effect.provide(fetchLayer)
  )

/* Delete Passkey */

export interface DeletePasskeyOptions extends AuthenticatedOptions {
  passkeyId: string
}

export const deletePasskey = (
  options: DeletePasskeyOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<Passkey, NotFoundError | ForbiddenError> =>
  pipe(
    Effect.gen(function* () {
      const baseUrl = options.endpoint ?? "https://api.passlock.dev"
      const { tenancyId, passkeyId } = options

      const url = new URL(`/${tenancyId}/passkeys/${passkeyId}`, baseUrl)

      const response = yield* fetchNetwork(url, "delete", undefined, {
        headers: authorizationHeaders(options.apiKey),
      })

      const encoded: Passkey | ForbiddenError | NotFoundError =
        yield* matchStatus(response, {
          "2xx": (res) => decodeResponseJson(res, PasskeySchemas.Passkey),
          orElse: (res) =>
            decodeResponseJson(
              res,
              Schema.Union(ForbiddenError, NotFoundError)
            ),
        })

      return yield* pipe(
        Match.value(encoded),
        Match.tag("Passkey", (deletedPasskey) =>
          Effect.succeed(deletedPasskey)
        ),
        Match.tag("@error/Forbidden", (err) => Effect.fail(err)),
        Match.tag("@error/NotFound", (err) => Effect.fail(err)),
        Match.exhaustive
      )
    }),
    Effect.catchTags({
      "@error/NetworkPayload": (err: NetworkPayloadError) => Effect.die(err),
      "@error/NetworkRequest": (err: NetworkRequestError) => Effect.die(err),
      "@error/NetworkResponse": (err: NetworkResponseError) => Effect.die(err),
      ParseError: (err) => Effect.die(err),
    }),
    Effect.provide(fetchLayer)
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
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<Passkey, NotFoundError | ForbiddenError> =>
  pipe(
    Effect.gen(function* () {
      const baseUrl = options.endpoint ?? "https://api.passlock.dev"
      const { userId, passkeyId } = options
      const { tenancyId } = options

      const url = new URL(`/${tenancyId}/passkeys/${passkeyId}`, baseUrl)

      const response = yield* fetchNetwork(
        url,
        "patch",
        { userId },
        {
          headers: authorizationHeaders(options.apiKey),
        }
      )

      const encoded: Passkey | NotFoundError | ForbiddenError =
        yield* matchStatus(response, {
          "2xx": (res) => decodeResponseJson(res, PasskeySchemas.Passkey),
          orElse: (res) =>
            decodeResponseJson(
              res,
              Schema.Union(NotFoundError, ForbiddenError)
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
      "@error/NetworkPayload": (err: NetworkPayloadError) => Effect.die(err),
      "@error/NetworkRequest": (err: NetworkRequestError) => Effect.die(err),
      "@error/NetworkResponse": (err: NetworkResponseError) => Effect.die(err),
      ParseError: (err) => Effect.die(err),
    }),
    Effect.provide(fetchLayer)
  )

/* Update passkey */

export interface UpdatePasskeyOptions extends AuthenticatedOptions {
  passkeyId: string
  userId?: string
  username?: string
}

export const updatePasskey = (
  options: UpdatePasskeyOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<Passkey, NotFoundError | ForbiddenError> =>
  pipe(
    Effect.gen(function* () {
      const baseUrl = options.endpoint ?? "https://api.passlock.dev"

      const { userId, passkeyId, username } = options
      const { tenancyId } = options

      const url = new URL(`/${tenancyId}/passkeys/${passkeyId}`, baseUrl)

      const response = yield* fetchNetwork(
        url,
        "patch",
        { userId, username },
        {
          headers: authorizationHeaders(options.apiKey),
        }
      )

      const encoded: Passkey | NotFoundError | ForbiddenError =
        yield* matchStatus(response, {
          "2xx": (res) => decodeResponseJson(res, PasskeySchemas.Passkey),
          orElse: (res) =>
            decodeResponseJson(
              res,
              Schema.Union(NotFoundError, ForbiddenError)
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
      "@error/NetworkPayload": (err: NetworkPayloadError) => Effect.die(err),
      "@error/NetworkRequest": (err: NetworkRequestError) => Effect.die(err),
      "@error/NetworkResponse": (err: NetworkResponseError) => Effect.die(err),
      ParseError: (err) => Effect.die(err),
    }),
    Effect.provide(fetchLayer)
  )

/* Update passkeys by userId (currently not exported) */

interface UpdateUserPasskeyOptions extends AuthenticatedOptions {
  userId: string
  username?: string
}

const updateUserPasskeys = (
  options: UpdateUserPasskeyOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<UpdatedPasskeys, NotFoundError | ForbiddenError> =>
  pipe(
    Effect.gen(function* () {
      const baseUrl = options.endpoint ?? "https://api.passlock.dev"

      const { userId, username } = options
      const { tenancyId } = options

      const url = new URL(`/${tenancyId}/users/${userId}/passkeys/`, baseUrl)

      const response = yield* fetchNetwork(
        url,
        "patch",
        { userId, username },
        {
          headers: authorizationHeaders(options.apiKey),
        }
      )

      const encoded: UpdatedPasskeys | NotFoundError | ForbiddenError =
        yield* matchStatus(response, {
          "2xx": (res) =>
            decodeResponseJson(res, PasskeySchemas.UpdatedPasskeys),
          orElse: (res) =>
            decodeResponseJson(
              res,
              Schema.Union(NotFoundError, ForbiddenError)
            ),
        })

      return yield* pipe(
        Match.value(encoded),
        Match.tag("UpdatedPasskeys", (result) => Effect.succeed(result)),
        Match.tag("@error/NotFound", (err) => Effect.fail(err)),
        Match.tag("@error/Forbidden", (err) => Effect.fail(err)),
        Match.exhaustive
      )
    }),
    Effect.catchTags({
      "@error/NetworkPayload": (err: NetworkPayloadError) => Effect.die(err),
      "@error/NetworkRequest": (err: NetworkRequestError) => Effect.die(err),
      "@error/NetworkResponse": (err: NetworkResponseError) => Effect.die(err),
      ParseError: (err) => Effect.die(err),
    }),
    Effect.provide(fetchLayer)
  )

/* Update usernames by userId */

export interface UpdatePasskeyUsernamesOptions extends AuthenticatedOptions {
  userId: string
  username: string
  displayName?: string
}

export const updatePasskeyUsernames = (
  options: UpdatePasskeyUsernamesOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<UpdatedPasskeyUsernames, NotFoundError | ForbiddenError> =>
  pipe(
    updateUserPasskeys(options, fetchLayer),
    Effect.map((result) => result.updated),
    Effect.map(
      Array.map((passkey) => {
        return {
          rpId: passkey.credential.rpId,
          userId: passkey.credential.userId,
          username: passkey.credential.username,
          displayName: options.displayName ?? passkey.credential.username,
        }
      })
    ),
    Effect.map((credentials) => ({
      _tag: "UpdatedPasskeyUsernames",
      credentials,
    }))
  )

/* List Passkeys */

export const listPasskeysStream = (
  options: AuthenticatedOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Stream.Stream<PasskeySummary, ForbiddenError> =>
  pipe(
    Stream.paginateChunkEffect(null as string | null, (cursor) =>
      pipe(
        listPasskeys(cursor ? { ...options, cursor } : options, fetchLayer),
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
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<FindAllPasskeys, ForbiddenError> =>
  pipe(
    Effect.gen(function* () {
      const baseUrl = options.endpoint ?? "https://api.passlock.dev"
      const { tenancyId } = options

      const url = new URL(`/${tenancyId}/passkeys/`, baseUrl)
      if (options.cursor) {
        url.searchParams.append("cursor", options.cursor)
      }

      const response = yield* fetchNetwork(url, "get", undefined, {
        headers: authorizationHeaders(options.apiKey),
      })

      const encoded: FindAllPasskeys | ForbiddenError = yield* matchStatus(
        response,
        {
          "2xx": (res) => decodeResponseJson(res, FindAllPasskeysSchema),
          orElse: (res) => decodeResponseJson(res, ForbiddenError),
        }
      )

      return yield* pipe(
        Match.value(encoded),
        Match.tag("FindAllPasskeys", (data) => Effect.succeed(data)),
        Match.tag("@error/Forbidden", (err) => Effect.fail(err)),
        Match.exhaustive
      )
    }),
    Effect.catchTags({
      "@error/NetworkPayload": (err: NetworkPayloadError) => Effect.die(err),
      "@error/NetworkRequest": (err: NetworkRequestError) => Effect.die(err),
      "@error/NetworkResponse": (err: NetworkResponseError) => Effect.die(err),
      ParseError: (err) => Effect.die(err),
    }),
    Effect.provide(fetchLayer)
  )
