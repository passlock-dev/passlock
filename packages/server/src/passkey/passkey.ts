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
  BadRequestError,
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
   * Passlock passkey record identifier, not the WebAuthn credential ID.
   */
  id: string
  /**
   * Optional custom user ID assigned by your application, not the WebAuthn
   * credential user ID.
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
 * Ensures the public Passkey type matches the runtime schema.
 * @internal
 * */
export type _Passkey = satisfy<typeof PasskeySchemas.Passkey.Type, Passkey>

/**
 * Ensures the public PasskeyCredential type matches the runtime schema.
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
 * Ensures the public PasskeySummary type matches the runtime schema.
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
 * Ensures the public UpdatedPasskeys type matches the runtime schema.
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
 * Ensures the public Credential type matches the runtime schema.
 * @internal
 */
export type _Credential = satisfy<typeof PasskeySchemas.Credential.Type, Credential>

/* DeletedPasskey */

/**
 * Result payload returned when a single passkey has been deleted.
 *
 * The nested `deleted` object contains the credential identifiers needed for
 * optional client-side cleanup.
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
 * Ensures the public DeletedPasskey type matches the runtime schema.
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
 * Ensures the public DeletedPasskeys type matches the runtime schema.
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
 * Ensures the public FindAllPasskeys type matches the runtime schema.
 * @internal
 */
export type _FindAllPasskeys = satisfy<typeof FindAllPasskeysSchema.Type, FindAllPasskeys>

/* UpdatedCredentials (publicly re-exported as UpdatedUserDetails) */

/**
 * Client-facing user-details update payload returned by
 * {@link updatePasskeyUsernames}.
 *
 * The promise-based entrypoints re-export this shape as `UpdatedUserDetails`.
 * Its runtime `_tag` remains `"UpdatedCredentials"` for backwards
 * compatibility.
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
 * Check whether an unknown value carries the runtime tag used by the public
 * `UpdatedUserDetails` payload.
 *
 * The exported type name is `UpdatedUserDetails`, but the runtime `_tag`
 * remains `"UpdatedCredentials"`. This lightweight guard only checks that
 * top-level tag.
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

const normalizeAuthorizedRpId = <Options extends { readonly rpId: string }>(options: Options) => ({
  ...options,
  rpId: options.rpId.toLowerCase(),
})

/* AuthorizedPasskeyRegistration */

/**
 * Options used by your backend to authorize a passkey registration before the
 * browser starts the WebAuthn ceremony.
 *
 * @category Passkeys
 */
export interface AuthorizePasskeyRegistrationOptions {
  /**
   * The relying party ID for this registration. Your backend chooses this
   * value for the authorized ceremony and Passlock validates it syntactically.
   * The value is normalized to lowercase before it is sent to Passlock.
   *
   * Use `"localhost"` during development, or a syntactically valid domain such
   * as `"example.com"` for staging and production. This field is independent
   * of the browser origin that later redeems the registration token.
   */
  rpId: string

  /**
   * Custom user ID from your application. This becomes the immutable Passlock
   * user ID for the passkey created from the authorized registration.
   */
  userId: string

  /**
   * Username shown by the browser or authenticator for the new passkey.
   */
  username: string

  /**
   * Optional display name shown by the browser or authenticator.
   */
  displayName?: string | undefined

  /**
   * Existing Passlock passkey record IDs to exclude from registration.
   */
  excludeCredentials?: ReadonlyArray<string> | undefined

  /**
   * Whether the device should re-authenticate the user locally before registration.
   */
  userVerification?: PasskeySchemas.UserVerification | undefined

  /**
   * Abort the browser ceremony after N milliseconds.
   */
  timeout?: number | undefined
}

/**
 * Authorized registration token returned to your backend.
 *
 * Send only the `registrationToken` to the browser. Treat it as bearer
 * authorization to create one passkey for the authorized user, and discard it
 * after the browser calls `@passlock/browser`'s `registerPasskey`.
 *
 * @category Passkeys
 */
export type AuthorizedPasskeyRegistration = {
  readonly _tag: "AuthorizedPasskeyRegistration"
  readonly expiresAt: number
  readonly registrationToken: string
}

/**
 * Type guard for {@link AuthorizedPasskeyRegistration}.
 *
 * @category Passkeys
 */
export const isAuthorizedPasskeyRegistration = (
  payload: unknown
): payload is AuthorizedPasskeyRegistration =>
  Schema.is(PasskeySchemas.AuthorizedPasskeyRegistration)(payload)

/**
 * Ensures the public AuthorizedPasskeyRegistration type matches the runtime schema.
 * @internal
 */
export type _AuthorizedPasskeyRegistration = satisfy<
  typeof PasskeySchemas.AuthorizedPasskeyRegistration.Type,
  AuthorizedPasskeyRegistration
>

/**
 * Authorize a passkey registration.
 *
 * Call this from your backend after deciding the user is allowed to create a
 * passkey and which relying party ID the WebAuthn ceremony should use. Return
 * the resulting `registrationToken` to the browser, then call `registerPasskey`
 * from `@passlock/browser`.
 *
 * The `rpId` supplied by your backend is the RP ID for the authorized ceremony.
 * It does not need to match a separate Passlock tenancy RP ID, but the
 * browser/WebAuthn platform must still allow the current origin to use that RP
 * ID.
 *
 * @param options Authorization options, including the relying party ID,
 * application user ID, username, and optional WebAuthn ceremony settings. Do
 * not include the browser origin; Passlock records the origin when the browser
 * redeems the authorized token.
 * @param config Shared Passlock configuration for the request.
 * @param fetchLayer Optional fetch service override for testing or custom runtimes.
 * @returns An Effect that succeeds with a one-time authorized registration token.
 *
 * @category Passkeys
 */
export const authorizePasskeyRegistration = (
  options: AuthorizePasskeyRegistrationOptions,
  config: AuthenticatedOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<AuthorizedPasskeyRegistration, BadRequestError | ForbiddenError> =>
  pipe(
    Effect.gen(function* () {
      const baseUrl = config.endpoint ?? "https://api.passlock.dev"
      const { tenancyId } = config

      const url = new URL(`/v2/${tenancyId}/passkey/registration/authorize`, baseUrl)

      const response = yield* fetchNetwork(url, "post", normalizeAuthorizedRpId(options), {
        headers: authorizationHeaders(config.apiKey),
      })

      const encoded: AuthorizedPasskeyRegistration | BadRequestError | ForbiddenError =
        yield* matchStatus(response, {
          "2xx": (res) => decodeResponseJson(res, PasskeySchemas.AuthorizedPasskeyRegistration),
          orElse: (res) => decodeResponseJson(res, Schema.Union(BadRequestError, ForbiddenError)),
        })

      return yield* pipe(
        Match.value(encoded),
        Match.tag("AuthorizedPasskeyRegistration", (data) => Effect.succeed(data)),
        Match.tag("@error/BadRequest", (err) => Effect.fail(err)),
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

/* AuthorizedPasskeyAuthentication */

/**
 * Options used by your backend to authorize a passkey authentication before
 * the browser starts the WebAuthn ceremony.
 *
 * For account-scoped authentication, pass `userId`, `allowCredentials`, or
 * both. For discoverable "login with passkey" flows, set `discoverable: true`
 * and omit account-scoped fields.
 *
 * @category Passkeys
 */
export interface AuthorizePasskeyAuthenticationOptions {
  /**
   * The relying party ID for this authentication. Your backend chooses this
   * value for the authorized ceremony and Passlock validates it syntactically.
   * The value is normalized to lowercase before it is sent to Passlock.
   *
   * Use `"localhost"` during development, or a syntactically valid domain such
   * as `"example.com"` for staging and production. Passlock uses this RP ID
   * when generating authentication options, including discoverable login
   * options.
   */
  rpId: string

  /**
   * Optional custom user ID from your application.
   */
  userId?: string | undefined

  /**
   * Existing Passlock passkey record IDs allowed for this authorized authentication.
   *
   * Omit this, or pass an empty array, for discoverable authentication.
   */
  allowCredentials?: ReadonlyArray<string> | undefined

  /**
   * Whether the device should re-authenticate the user locally before authentication.
   */
  userVerification?: PasskeySchemas.UserVerification | undefined

  /**
   * Abort the browser ceremony after N milliseconds.
   */
  timeout?: number | undefined

  /**
   * Allow any suitable discoverable credential for the authorized relying party.
   *
   * Set this explicitly for "login with passkey" flows where your backend does
   * not yet know the user. Leave it unset or `false` for account-scoped flows.
   */
  discoverable?: boolean | undefined

  /**
   * WebAuthn mediation mode for the authorized ceremony.
   *
   * Use `"required"` for normal authentication, or `"conditional"` for
   * autofill/conditional mediation. Conditional mediation is valid only when
   * `discoverable` is `true`.
   */
  mediation?: PasskeySchemas.PasskeyAuthenticationMediation | undefined
}

/**
 * Ensures the public AuthorizePasskeyAuthenticationOptions type matches the runtime schema.
 * @internal
 */
export type _AuthorizePasskeyAuthenticationOptions = satisfy<
  typeof PasskeySchemas.AuthorizePasskeyAuthenticationOptions.Type,
  AuthorizePasskeyAuthenticationOptions
>

/**
 * Authorized authentication token returned to your backend.
 *
 * Send only the `authenticationToken` to the browser. Treat it as bearer
 * authorization to start the authorized authentication ceremony, whether that
 * ceremony is account-scoped or discoverable. Discard it after the browser
 * calls `@passlock/browser`'s `authenticatePasskey`.
 *
 * @category Passkeys
 */
export type AuthorizedPasskeyAuthentication = {
  readonly _tag: "AuthorizedPasskeyAuthentication"
  readonly authenticationToken: string
  readonly expiresAt: number
}

/**
 * Type guard for {@link AuthorizedPasskeyAuthentication}.
 *
 * @category Passkeys
 */
export const isAuthorizedPasskeyAuthentication = (
  payload: unknown
): payload is AuthorizedPasskeyAuthentication =>
  Schema.is(PasskeySchemas.AuthorizedPasskeyAuthentication)(payload)

/**
 * Ensures the public AuthorizedPasskeyAuthentication type matches the runtime schema.
 * @internal
 */
export type _AuthorizedPasskeyAuthentication = satisfy<
  typeof PasskeySchemas.AuthorizedPasskeyAuthentication.Type,
  AuthorizedPasskeyAuthentication
>

/**
 * Authorize a passkey authentication.
 *
 * Call this from your backend after deciding the authentication policy. For
 * known-user or re-authentication flows, provide `userId`, `allowCredentials`,
 * or both. For discoverable login, set `discoverable: true`; for autofill,
 * also set `mediation: "conditional"`.
 *
 * The `rpId` supplied by your backend is the RP ID for the authorized ceremony.
 * It does not need to match a separate Passlock tenancy RP ID or related-origin
 * setting, but the browser/WebAuthn platform must still allow the current
 * origin to use that RP ID.
 *
 * Return the resulting `authenticationToken` to the browser, then call
 * `authenticatePasskey` from `@passlock/browser`.
 *
 * @param options Authorization options, including the relying party ID
 * and either account-scoped fields or explicit discoverable authentication. Do
 * not include the browser origin; Passlock records the origin when the browser
 * redeems the authorized token.
 * @param config Shared Passlock configuration for the request.
 * @param fetchLayer Optional fetch service override for testing or custom runtimes.
 * @returns An Effect that succeeds with a one-time authorized authentication token.
 *
 * @category Passkeys
 */
export const authorizePasskeyAuthentication = (
  options: AuthorizePasskeyAuthenticationOptions,
  config: AuthenticatedOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<AuthorizedPasskeyAuthentication, BadRequestError | ForbiddenError> =>
  pipe(
    Effect.gen(function* () {
      const baseUrl = config.endpoint ?? "https://api.passlock.dev"
      const { tenancyId } = config

      const url = new URL(`/v2/${tenancyId}/passkey/authentication/authorize`, baseUrl)

      const response = yield* fetchNetwork(url, "post", normalizeAuthorizedRpId(options), {
        headers: authorizationHeaders(config.apiKey),
      })

      const encoded: AuthorizedPasskeyAuthentication | BadRequestError | ForbiddenError =
        yield* matchStatus(response, {
          "2xx": (res) => decodeResponseJson(res, PasskeySchemas.AuthorizedPasskeyAuthentication),
          orElse: (res) => decodeResponseJson(res, Schema.Union(BadRequestError, ForbiddenError)),
        })

      return yield* pipe(
        Match.value(encoded),
        Match.tag("AuthorizedPasskeyAuthentication", (data) => Effect.succeed(data)),
        Match.tag("@error/BadRequest", (err) => Effect.fail(err)),
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

/* Get Passkey */

/**
 * Options for fetching a single passkey.
 *
 * @category Passkeys
 */
export interface GetPasskeyOptions {
  /**
   * Identifier of the passkey to fetch.
   */
  passkeyId: string
}

/**
 * Fetch a single passkey from the Passlock vault.
 *
 * @param options Passkey-specific request options.
 * @param config Shared Passlock configuration for the request.
 * @param fetchLayer Optional fetch service override for testing or custom runtimes.
 * @returns An Effect that succeeds with the requested passkey.
 *
 * @category Passkeys
 */
export const getPasskey = (
  options: GetPasskeyOptions,
  config: AuthenticatedOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<Passkey, NotFoundError | ForbiddenError> =>
  pipe(
    Effect.gen(function* () {
      const baseUrl = config.endpoint ?? "https://api.passlock.dev"
      const { tenancyId } = config
      const { passkeyId } = options

      const url = new URL(`/v2/${tenancyId}/passkeys/${passkeyId}`, baseUrl)

      const response = yield* fetchNetwork(url, "get", undefined, {
        headers: authorizationHeaders(config.apiKey),
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
export interface DeletePasskeyOptions {
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
 * @param options Passkey-specific request options.
 * @param config Shared Passlock configuration for the request.
 * @param fetchLayer Optional fetch service override for testing or custom runtimes.
 * @returns An Effect that succeeds with the deleted credential identifiers.
 *
 * @category Passkeys
 */
export const deletePasskey = (
  options: DeletePasskeyOptions,
  config: AuthenticatedOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<DeletedPasskey, NotFoundError | ForbiddenError> =>
  pipe(
    Effect.gen(function* () {
      const baseUrl = config.endpoint ?? "https://api.passlock.dev"
      const { tenancyId } = config
      const { passkeyId } = options

      const url = new URL(`/v2/${tenancyId}/passkeys/${passkeyId}`, baseUrl)

      const response = yield* fetchNetwork(url, "delete", undefined, {
        headers: authorizationHeaders(config.apiKey),
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

/* Update passkey */

/**
 * Options for updating a single passkey's metadata.
 *
 * @category Passkeys
 */
export interface UpdatePasskeyOptions {
  /**
   * Identifier of the passkey to update.
   */
  passkeyId: string
  /**
   * Username metadata stored alongside the passkey.
   */
  username?: string
}

/**
 * Update a single passkey's username metadata.
 *
 * @param options Passkey-specific request options.
 * @param config Shared Passlock configuration for the request.
 * @param fetchLayer Optional fetch service override for testing or custom runtimes.
 * @returns An Effect that succeeds with the updated passkey.
 *
 * @category Passkeys
 */
export const updatePasskey = (
  options: UpdatePasskeyOptions,
  config: AuthenticatedOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<Passkey, NotFoundError | ForbiddenError> =>
  pipe(
    Effect.gen(function* () {
      const baseUrl = config.endpoint ?? "https://api.passlock.dev"

      const { passkeyId, username } = options
      const { tenancyId } = config

      const url = new URL(`/v2/${tenancyId}/passkeys/${passkeyId}`, baseUrl)

      const response = yield* fetchNetwork(
        url,
        "patch",
        { username },
        {
          headers: authorizationHeaders(config.apiKey),
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

interface UpdateUserPasskeyOptions {
  userId: string
  username?: string
}

const updateUserPasskeys = (
  options: UpdateUserPasskeyOptions,
  config: AuthenticatedOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<UpdatedPasskeys, NotFoundError | ForbiddenError> =>
  pipe(
    Effect.gen(function* () {
      const baseUrl = config.endpoint ?? "https://api.passlock.dev"

      const { userId, username } = options
      const { tenancyId } = config

      const url = new URL(`/v2/${tenancyId}/users/${userId}/passkeys/`, baseUrl)

      const response = yield* fetchNetwork(
        url,
        "patch",
        { username },
        {
          headers: authorizationHeaders(config.apiKey),
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
export interface DeleteUserPasskeysOptions {
  /**
   * Custom user ID whose passkeys should be deleted.
   */
  userId: string
}

/**
 * Delete all passkeys associated with a custom user ID.
 *
 * The resulting `deleted` credentials can be passed to
 * `@passlock/browser` to remove the corresponding passkeys from the user's
 * device.
 *
 * @param options User-specific request options.
 * @param config Shared Passlock configuration for the request.
 * @param fetchLayer Optional fetch service override for testing or custom runtimes.
 * @returns An Effect that succeeds with the deleted credential identifiers.
 *
 * @category Passkeys
 */
export const deleteUserPasskeys = (
  options: DeleteUserPasskeysOptions,
  config: AuthenticatedOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<DeletedPasskeys, NotFoundError | ForbiddenError> =>
  pipe(
    Effect.gen(function* () {
      const baseUrl = config.endpoint ?? "https://api.passlock.dev"

      const { tenancyId } = config
      const { userId } = options

      const url = new URL(`/v2/${tenancyId}/users/${userId}/passkeys/`, baseUrl)

      const response = yield* fetchNetwork(
        url,
        "delete",
        { userId },
        {
          headers: authorizationHeaders(config.apiKey),
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
 * The promise-based entrypoints re-export this interface as
 * `UpdateUserDetailsOptions`.
 *
 * @category Passkeys
 */
export interface UpdateUsernamesOptions {
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
 * `@passlock/browser` so matching device credentials can be updated.
 * The optional `displayName` is not stored in Passlock; it is only copied into
 * the returned client payload.
 *
 * @param options User-specific request options.
 * @param config Shared Passlock configuration for the request.
 * @param fetchLayer Optional fetch service override for testing or custom runtimes.
 * @returns An Effect that succeeds with a user-details update payload
 * containing one credential update per updated passkey.
 *
 * @category Passkeys
 */
export const updatePasskeyUsernames = (
  options: UpdateUsernamesOptions,
  config: AuthenticatedOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<UpdatedCredentials, NotFoundError | ForbiddenError> =>
  pipe(
    updateUserPasskeys(options, config, fetchLayer),
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
 * @param config Shared Passlock configuration used for each paginated request.
 * @param fetchLayer Optional fetch service override for testing or custom runtimes.
 * @returns A stream of passkey summaries.
 *
 * @category Passkeys
 */
export const listPasskeysStream = (
  config: AuthenticatedOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Stream.Stream<PasskeySummary, ForbiddenError> =>
  pipe(
    Stream.paginateChunkEffect(null as string | null, (cursor) =>
      pipe(
        listPasskeys(cursor ? { cursor } : {}, config, fetchLayer),
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
export interface ListPasskeyOptions {
  /**
   * Pagination cursor returned from a previous {@link listPasskeys} call.
   */
  cursor?: string
}

/**
 * Fetch a single page of passkey summaries for a tenancy.
 *
 * @param options List-specific request options, including an optional pagination cursor.
 * @param config Shared Passlock configuration for the request.
 * @param fetchLayer Optional fetch service override for testing or custom runtimes.
 * @returns An Effect that succeeds with one page of passkey summaries.
 *
 * @category Passkeys
 */
export const listPasskeys = (
  options: ListPasskeyOptions,
  config: AuthenticatedOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<FindAllPasskeys, ForbiddenError> =>
  pipe(
    Effect.gen(function* () {
      const baseUrl = config.endpoint ?? "https://api.passlock.dev"
      const { tenancyId } = config

      const url = new URL(`/v2/${tenancyId}/passkeys/`, baseUrl)
      if (options.cursor) {
        url.searchParams.append("cursor", options.cursor)
      }

      const response = yield* fetchNetwork(url, "get", undefined, {
        headers: authorizationHeaders(config.apiKey),
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
