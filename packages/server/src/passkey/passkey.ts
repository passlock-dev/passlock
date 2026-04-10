import { Array, Chunk, Effect, type Layer, Match, Option, pipe, Schema, Stream } from "effect"
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
import type { satisfy } from "../schemas/satisfy.js"
import type { AuthenticatedOptions } from "../shared.js"

/* Passkey */

/**
 * WebAuthn-specific credential data stored for a passkey in the Passlock vault.
 *
 * The `id` and `userId` fields are the underlying WebAuthn values, encoded as
 * Base64URL strings.
 *
 * @category Passkeys
 */
export type PasskeyCredential = {
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
 *
 * @category Passkeys
 */
export type Platform = {
  name?: string | undefined
  icon?: string | undefined
}

/**
 * The server-side representation of a passkey stored in the Passlock vault.
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
  credential: PasskeyCredential
  platform?: Platform | undefined
  lastUsed?: number | undefined
  createdAt: number
  updatedAt: number
}

/**
 * Type guard for {@link Passkey}.
 *
 * @category Passkeys
 */
export const isPasskey = (payload: unknown): payload is Passkey =>
  Schema.is(PasskeySchemas.Passkey)(payload)

/**
 * needed to ensure the Passkey === Passkey.Type
 * @internal
 * */
export type _Passkey = satisfy<typeof PasskeySchemas.Passkey.Type, Passkey>

/**
 * needed to ensure the PasskeyCredential === PasskeyCredential.Type
 * @internal
 * */
export type _PasskeyCredential = satisfy<
  typeof PasskeySchemas.PasskeyCredential.Type,
  PasskeyCredential
>

/* PasskeySummary */

/**
 * Compact passkey payload returned by list operations.
 *
 * @category Passkeys
 */
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

/**
 * Type guard for {@link PasskeySummary}.
 *
 * @category Passkeys
 */
export const isPasskeySummary = (payload: unknown): payload is PasskeySummary =>
  Schema.is(PasskeySchemas.PasskeySummary)(payload)

/**
 * needed to ensure the PasskeySummary === PasskeySummary.Type
 * @internal
 */
export type _PasskeySummary = satisfy<typeof PasskeySchemas.PasskeySummary.Type, PasskeySummary>

/* UpdatedPasskeys */

/**
 * Result payload returned when passkeys are updated in bulk for a user.
 *
 * @category Passkeys
 */
export type UpdatedPasskeys = {
  _tag: "UpdatedPasskeys"
  updated: ReadonlyArray<Passkey>
}

/**
 * Type guard for {@link UpdatedPasskeys}.
 *
 * @category Passkeys
 */
export const isUpdatedPasskeys = (payload: unknown): payload is UpdatedPasskeys =>
  Schema.is(PasskeySchemas.UpdatedPasskeys)(payload)

/**
 * needed to ensure the UpdatedPasskeys === UpdatedPasskeys.Type
 * @internal
 * */
export type _UpdatedPasskeys = satisfy<typeof PasskeySchemas.UpdatedPasskeys.Type, UpdatedPasskeys>

/* Credential */

/**
 * Credential identifiers returned by passkey deletion operations.
 *
 * @category Passkeys
 */
export type Credential = {
  credentialId: string
  userId: string
  rpId: string
}

/**
 * needed to ensure the Credential === Credential.Type
 * @internal
 */
export type _Credential = satisfy<typeof PasskeySchemas.Credential.Type, Credential>

/* DeletedPasskey */

/**
 * Result payload returned when a single passkey has been deleted.
 *
 * @category Passkeys
 */
export type DeletedPasskey = {
  _tag: "DeletedPasskey"
  deleted: Credential
}

/**
 * Type guard for {@link DeletedPasskey}.
 *
 * @category Passkeys
 */
export const isDeletedPasskey = (payload: unknown): payload is DeletedPasskey =>
  Schema.is(PasskeySchemas.DeletedPasskey)(payload)

/**
 * needed to ensure the DeletedPasskey === DeletedPasskey.Type
 * @internal
 * */
export type _DeletedPasskey = satisfy<typeof PasskeySchemas.DeletedPasskey.Type, DeletedPasskey>

/* DeletedPasskeys */

/**
 * Result payload returned when all passkeys for a user have been deleted.
 *
 * @category Passkeys
 */
export type DeletedPasskeys = {
  _tag: "DeletedPasskeys"
  deleted: ReadonlyArray<Credential>
}

/**
 * Type guard for {@link DeletedPasskeys}.
 *
 * @category Passkeys
 */
export const isDeletedPasskeys = (payload: unknown): payload is DeletedPasskeys =>
  Schema.is(PasskeySchemas.DeletedPasskeys)(payload)

/**
 * needed to ensure the DeletedPasskeys === DeletedPasskeys.Type
 * @internal
 * */
export type _DeletedPasskeys = satisfy<typeof PasskeySchemas.DeletedPasskeys.Type, DeletedPasskeys>

/* FindAllPasskeys */

/**
 * A single page of passkey summaries returned by {@link listPasskeys}.
 *
 * @category Passkeys
 */
export type FindAllPasskeys = {
  readonly _tag: "FindAllPasskeys"
  readonly cursor: string | null
  readonly records: ReadonlyArray<PasskeySummary>
}

/**
 * Type guard for {@link FindAllPasskeys}.
 *
 * @category Passkeys
 */
export const isFindAllPasskeys = (payload: unknown): payload is FindAllPasskeys =>
  Schema.is(PasskeySchemas.FindAllPasskeys)(payload)

/**
 * needed to ensure the FindAllPasskeys === FindAllPasskeys.Type
 * @internal
 */
export type _FindAllPasskeys = satisfy<typeof FindAllPasskeysSchema.Type, FindAllPasskeys>

/* UpdatedCredentials (update names by userId) */

/**
 * Client-facing credential update payload returned by
 * {@link updatePasskeyUsernames}.
 *
 * Each entry describes one credential to update on the user's device. The
 * returned `displayName` is derived from
 * {@link UpdateUsernamesOptions#displayName} when provided, otherwise it falls
 * back to the stored username.
 *
 * @category Passkeys
 */
export type UpdatedCredentials = {
  _tag: "UpdatedCredentials"
  credentials: ReadonlyArray<{
    rpId: string
    userId: string
    username: string
    displayName: string
  }>
}

/**
 * Check whether an unknown value carries the `UpdatedCredentials` tag.
 *
 * This lightweight guard only checks the top-level `_tag`.
 *
 * @category Passkeys
 */
export const isUpdatedUserDetails = (payload: unknown): payload is UpdatedCredentials => {
  if (typeof payload !== "object") return false
  if (payload === null) return false
  if (!("_tag" in payload)) return false
  if (typeof payload._tag !== "string") return false
  if (payload._tag !== "UpdatedCredentials") return false

  return true
}

/* END UpdatedUserDetails */

const authorizationHeaders = (apiKey: string) => ({
  authorization: `Bearer ${apiKey}`,
})

const decodeResponseJson = <A, I, R>(response: NetworkResponse, schema: Schema.Schema<A, I, R>) =>
  pipe(response.json, Effect.flatMap(Schema.decodeUnknown(schema)))

/* Get Passkey */

/**
 * Options for fetching a single passkey.
 *
 * @category Passkeys
 */
export interface GetPasskeyOptions extends AuthenticatedOptions {
  /**
   * Identifier of the passkey to fetch.
   */
  passkeyId: string
}

/**
 * Fetch a single passkey from the Passlock vault.
 *
 * @param options Request options including the passkey identifier.
 * @param fetchLayer Optional fetch service override for testing or custom runtimes.
 * @returns An Effect that succeeds with the requested passkey.
 *
 * @category Passkeys
 */
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

      const encoded: Passkey | ForbiddenError | NotFoundError = yield* matchStatus(response, {
        "2xx": (res) => decodeResponseJson(res, PasskeySchemas.Passkey),
        orElse: (res) => decodeResponseJson(res, Schema.Union(ForbiddenError, NotFoundError)),
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

/**
 * Options for deleting a single passkey.
 *
 * @category Passkeys
 */
export interface DeletePasskeyOptions extends AuthenticatedOptions {
  /**
   * Identifier of the passkey to delete.
   */
  passkeyId: string
}

/**
 * Delete a single passkey from the Passlock vault.
 *
 * This only removes the server-side record. It does not remove the passkey
 * from the user's device.
 *
 * @param options Request options including the passkey identifier.
 * @param fetchLayer Optional fetch service override for testing or custom runtimes.
 * @returns An Effect that succeeds with the deleted credential.
 *
 * @category Passkeys
 */
export const deletePasskey = (
  options: DeletePasskeyOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<DeletedPasskey, NotFoundError | ForbiddenError> =>
  pipe(
    Effect.gen(function* () {
      const baseUrl = options.endpoint ?? "https://api.passlock.dev"
      const { tenancyId, passkeyId } = options

      const url = new URL(`/${tenancyId}/passkeys/${passkeyId}`, baseUrl)

      const response = yield* fetchNetwork(url, "delete", undefined, {
        headers: authorizationHeaders(options.apiKey),
      })

      const encoded: Passkey | ForbiddenError | NotFoundError = yield* matchStatus(response, {
        "2xx": (res) => decodeResponseJson(res, PasskeySchemas.Passkey),
        orElse: (res) => decodeResponseJson(res, Schema.Union(ForbiddenError, NotFoundError)),
      })

      return yield* pipe(
        Match.value(encoded),
        Match.tag("Passkey", (passkey) =>
          Effect.succeed({
            _tag: "DeletedPasskey" as const,
            deleted: {
              credentialId: passkey.credential.id,
              userId: passkey.credential.userId,
              rpId: passkey.credential.rpId,
            },
          })
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
 * Options for assigning a custom user ID to a single passkey.
 *
 * @category Passkeys
 */
export interface AssignUserOptions extends AuthenticatedOptions {
  /**
   * Identifier of the passkey to update.
   */
  passkeyId: string

  /**
   * Custom User ID to align with your own systems
   */
  userId: string
}

// TODO reuse updatePasskey
/**
 * Assign a custom user ID to a single passkey.
 *
 * This updates Passlock's mapping for the passkey. It does not change the
 * underlying WebAuthn credential's `userId`.
 *
 * @param options Request options including the passkey identifier and custom user ID.
 * @param fetchLayer Optional fetch service override for testing or custom runtimes.
 * @returns An Effect that succeeds with the updated passkey.
 *
 * @category Passkeys
 */
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

      const encoded: Passkey | NotFoundError | ForbiddenError = yield* matchStatus(response, {
        "2xx": (res) => decodeResponseJson(res, PasskeySchemas.Passkey),
        orElse: (res) => decodeResponseJson(res, Schema.Union(NotFoundError, ForbiddenError)),
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

/**
 * Options for updating a single passkey's metadata.
 *
 * @category Passkeys
 */
export interface UpdatePasskeyOptions extends AuthenticatedOptions {
  /**
   * Identifier of the passkey to update.
   */
  passkeyId: string
  /**
   * Custom user ID to associate with the passkey.
   */
  userId?: string
  /**
   * Username metadata stored alongside the passkey.
   */
  username?: string
}

/**
 * Update a single passkey's custom user ID and/or username metadata.
 *
 * @param options Request options including the passkey identifier and fields to update.
 * @param fetchLayer Optional fetch service override for testing or custom runtimes.
 * @returns An Effect that succeeds with the updated passkey.
 *
 * @category Passkeys
 */
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

      const encoded: Passkey | NotFoundError | ForbiddenError = yield* matchStatus(response, {
        "2xx": (res) => decodeResponseJson(res, PasskeySchemas.Passkey),
        orElse: (res) => decodeResponseJson(res, Schema.Union(NotFoundError, ForbiddenError)),
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

      const encoded: UpdatedPasskeys | NotFoundError | ForbiddenError = yield* matchStatus(
        response,
        {
          "2xx": (res) => decodeResponseJson(res, PasskeySchemas.UpdatedPasskeys),
          orElse: (res) => decodeResponseJson(res, Schema.Union(NotFoundError, ForbiddenError)),
        }
      )

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

/* Delete passkeys by userId */

/**
 * Options for deleting all passkeys belonging to a user.
 *
 * @category Passkeys
 */
export interface DeleteUserPasskeysOptions extends AuthenticatedOptions {
  /**
   * Custom user ID whose passkeys should be deleted.
   */
  userId: string
}

/**
 * Delete all passkeys associated with a custom user ID.
 *
 * The resulting `deleted` credentials can be passed to
 * `@passlock/client` to remove the corresponding passkeys from the user's
 * device.
 *
 * @param options Request options including the custom user ID.
 * @param fetchLayer Optional fetch service override for testing or custom runtimes.
 * @returns An Effect that succeeds with the deleted credential identifiers.
 *
 * @category Passkeys
 */
export const deleteUserPasskeys = (
  options: DeleteUserPasskeysOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<DeletedPasskeys, NotFoundError | ForbiddenError> =>
  pipe(
    Effect.gen(function* () {
      const baseUrl = options.endpoint ?? "https://api.passlock.dev"

      const { tenancyId, userId } = options

      const url = new URL(`/${tenancyId}/users/${userId}/passkeys/`, baseUrl)

      const response = yield* fetchNetwork(
        url,
        "delete",
        { userId },
        {
          headers: authorizationHeaders(options.apiKey),
        }
      )

      const encoded:
        | typeof PasskeySchemas.DeletedPasskeysResponse.Type
        | NotFoundError
        | ForbiddenError = yield* matchStatus(response, {
        "2xx": (res) => decodeResponseJson(res, PasskeySchemas.DeletedPasskeysResponse),
        orElse: (res) => decodeResponseJson(res, Schema.Union(NotFoundError, ForbiddenError)),
      })

      return yield* pipe(
        Match.value(encoded),
        Match.tag("DeletedPasskeys", (result) =>
          Effect.succeed({
            _tag: "DeletedPasskeys" as const,
            deleted: result.deleted.map((passkey) => ({
              credentialId: passkey.credential.id,
              userId: passkey.credential.userId,
              rpId: passkey.credential.rpId,
            })),
          })
        ),
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

/* Update user details by userId */

/**
 * Options for updating username metadata for all passkeys that share a custom
 * user ID, plus optional display-name data to return for client-side updates.
 *
 * @category Passkeys
 */
export interface UpdateUsernamesOptions extends AuthenticatedOptions {
  /**
   * Custom user ID whose passkeys should be updated.
   */
  userId: string
  /**
   * Username to write back to each stored passkey.
   */
  username: string
  /**
   * Optional display name to return for client-side credential updates.
   *
   * When omitted, the returned credentials use `username` as the display name.
   */
  displayName?: string
}

/**
 * Update the username metadata for all passkeys belonging to a custom user ID.
 *
 * The resulting payload is designed to be passed to
 * `@passlock/client` so matching device credentials can be updated.
 * The optional `displayName` is not stored in Passlock; it is only copied into
 * the returned client payload.
 *
 * @param options Request options including the custom user ID and username metadata.
 * @param fetchLayer Optional fetch service override for testing or custom runtimes.
 * @returns An Effect that succeeds with one credential update per updated passkey.
 *
 * @category Passkeys
 */
export const updatePasskeyUsernames = (
  options: UpdateUsernamesOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<UpdatedCredentials, NotFoundError | ForbiddenError> =>
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
      _tag: "UpdatedCredentials",
      credentials,
    }))
  )

/* List Passkeys */

/**
 * Stream every passkey summary for a tenancy across all result pages.
 *
 * @param options Request options used for each paginated request.
 * @param fetchLayer Optional fetch service override for testing or custom runtimes.
 * @returns A stream of passkey summaries.
 *
 * @category Passkeys
 */
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

/**
 * Options for listing passkeys.
 *
 * @category Passkeys
 */
export interface ListPasskeyOptions extends AuthenticatedOptions {
  /**
   * Pagination cursor returned from a previous {@link listPasskeys} call.
   */
  cursor?: string
}

/**
 * Fetch a single page of passkey summaries for a tenancy.
 *
 * @param options Request options including an optional pagination cursor.
 * @param fetchLayer Optional fetch service override for testing or custom runtimes.
 * @returns An Effect that succeeds with one page of passkey summaries.
 *
 * @category Passkeys
 */
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

      const encoded: FindAllPasskeys | ForbiddenError = yield* matchStatus(response, {
        "2xx": (res) => decodeResponseJson(res, FindAllPasskeysSchema),
        orElse: (res) => decodeResponseJson(res, ForbiddenError),
      })

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
