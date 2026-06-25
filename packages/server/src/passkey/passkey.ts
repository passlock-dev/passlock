import { Chunk, Effect, type Layer, Match, Option, pipe, Schema, Stream } from "effect"
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

/* PasskeyManagementWarning */

/**
 * Non-fatal warning returned by passkey management prepare operations.
 *
 * Warnings describe no-op or partial cases, such as missing passkeys, that did
 * not prevent the prepared-token flow from completing.
 *
 * @category Passkeys
 */
export type PasskeyManagementWarning = {
  readonly code: PasskeySchemas.PasskeyManagementWarningCode
  readonly message: string
  readonly passkeyId?: string | undefined
}

/**
 * Ensures the public PasskeyManagementWarning type matches the runtime schema.
 * @internal
 */
export type _PasskeyManagementWarning = satisfy<
  typeof PasskeySchemas.PasskeyManagementWarning.Type,
  PasskeyManagementWarning
>

/* PreparedPasskeyUpdate */

/**
 * Result payload returned after preparing passkey username and display-name
 * update instructions.
 *
 * Send only `updatePasskeysToken` to the browser helper. The token is
 * short-lived bearer data that snapshots the WebAuthn signal payload chosen by
 * your backend.
 *
 * @category Passkeys
 */
export type PreparedPasskeyUpdate = {
  readonly _tag: "PreparedPasskeyUpdate"
  readonly updatePasskeysToken: string
  readonly expiresAt: number
  readonly warnings: ReadonlyArray<PasskeyManagementWarning>
}

/**
 * Type guard for {@link PreparedPasskeyUpdate}.
 *
 * @category Passkeys
 */
export const isPreparedPasskeyUpdate = (payload: unknown): payload is PreparedPasskeyUpdate =>
  Schema.is(PasskeySchemas.PreparedPasskeyUpdate)(payload)

/**
 * Ensures the public PreparedPasskeyUpdate type matches the runtime schema.
 * @internal
 */
export type _PreparedPasskeyUpdate = satisfy<
  typeof PasskeySchemas.PreparedPasskeyUpdate.Type,
  PreparedPasskeyUpdate
>

/* PreparedPasskeyDeletion */

/**
 * Result payload returned after preparing passkey deletion instructions.
 *
 * Send only `deletePasskeysToken` to the browser helper. The token is
 * short-lived bearer data that snapshots browser signal data before any found
 * vault records are deleted.
 *
 * @category Passkeys
 */
export type PreparedPasskeyDeletion = {
  readonly _tag: "PreparedPasskeyDeletion"
  readonly deletePasskeysToken: string
  readonly expiresAt: number
  readonly warnings: ReadonlyArray<PasskeyManagementWarning>
}

/**
 * Type guard for {@link PreparedPasskeyDeletion}.
 *
 * @category Passkeys
 */
export const isPreparedPasskeyDeletion = (payload: unknown): payload is PreparedPasskeyDeletion =>
  Schema.is(PasskeySchemas.PreparedPasskeyDeletion)(payload)

/**
 * Ensures the public PreparedPasskeyDeletion type matches the runtime schema.
 * @internal
 */
export type _PreparedPasskeyDeletion = satisfy<
  typeof PasskeySchemas.PreparedPasskeyDeletion.Type,
  PreparedPasskeyDeletion
>

/* PreparedPasskeyPruning */

/**
 * Result payload returned after preparing passkey pruning instructions.
 *
 * Send only `prunePasskeysToken` to the browser helper. The token is
 * short-lived bearer data that snapshots the currently accepted credential IDs
 * for the selected user.
 *
 * @category Passkeys
 */
export type PreparedPasskeyPruning = {
  readonly _tag: "PreparedPasskeyPruning"
  readonly prunePasskeysToken: string
  readonly expiresAt: number
  readonly warnings: ReadonlyArray<PasskeyManagementWarning>
}

/**
 * Type guard for {@link PreparedPasskeyPruning}.
 *
 * @category Passkeys
 */
export const isPreparedPasskeyPruning = (payload: unknown): payload is PreparedPasskeyPruning =>
  Schema.is(PasskeySchemas.PreparedPasskeyPruning)(payload)

/**
 * Ensures the public PreparedPasskeyPruning type matches the runtime schema.
 * @internal
 */
export type _PreparedPasskeyPruning = satisfy<
  typeof PasskeySchemas.PreparedPasskeyPruning.Type,
  PreparedPasskeyPruning
>

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
   * Human-readable relying party name shown by the browser or authenticator
   * during registration. Passlock rejects missing, empty, or whitespace-only
   * values and stores the trimmed value for this authorized ceremony.
   */
  rpName: string

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
 * Ensures the public AuthorizePasskeyRegistrationOptions type matches the runtime schema.
 * @internal
 */
export type _AuthorizePasskeyRegistrationOptions = satisfy<
  typeof PasskeySchemas.AuthorizePasskeyRegistrationOptions.Type,
  AuthorizePasskeyRegistrationOptions
>

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
 * passkey and which relying party ID and name the WebAuthn ceremony should
 * use. Return the resulting `registrationToken` to the browser, then call
 * `registerPasskey` from `@passlock/browser`.
 *
 * The `rpId` and `rpName` supplied by your backend are used for the authorized
 * ceremony. Choose the RP ID at the call site; Passlock does not read it from
 * tenancy passkey settings. If the browser origin differs from the RP ID, the
 * RP ID domain's `/.well-known/webauthn` file must allow the ceremony.
 *
 * @param options Authorization options, including the relying party ID and name,
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
 * Choose it at the call site; Passlock does not read it from tenancy passkey
 * settings. If the browser origin differs from the RP ID, the RP ID domain's
 * `/.well-known/webauthn` file must allow the ceremony.
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

/* Update Passkeys */

/**
 * Options for preparing username and display-name updates for all passkeys that
 * share a custom user ID.
 *
 * @category Passkeys
 */
export interface UpdatePasskeysOptions {
  /**
   * Custom user ID whose passkeys should be updated.
   */
  userId: string
  /**
   * Username to write back to each stored passkey and include in browser update
   * instructions.
   */
  username: string
  /**
   * Optional display name to include in the browser update instructions.
   *
   * This value is snapshotted into the prepared token but is not persisted as
   * durable passkey metadata.
   */
  displayName?: string | undefined
}

/**
 * Prepare passkey username and display-name update instructions for a user.
 *
 * The server-side operation updates stored usernames for the user's Passlock
 * vault records and returns a short-lived token. The optional display name is
 * included in the token's browser instructions but is not persisted as durable
 * passkey metadata. Send only `updatePasskeysToken` to the browser and call
 * `@passlock/browser`'s `updatePasskeys` helper to signal local password
 * managers.
 *
 * @param options User-specific update request options.
 * @param config Shared Passlock configuration for the request.
 * @param fetchLayer Optional fetch service override for testing or custom runtimes.
 * @returns An Effect that succeeds with a prepared passkey update token.
 *
 * @category Passkeys
 */
export const updatePasskeys = (
  options: UpdatePasskeysOptions,
  config: AuthenticatedOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<PreparedPasskeyUpdate, BadRequestError | ForbiddenError> =>
  pipe(
    Effect.gen(function* () {
      const baseUrl = config.endpoint ?? "https://api.passlock.dev"
      const { tenancyId } = config

      const url = new URL(`/v2/${tenancyId}/passkeys/update`, baseUrl)

      const response = yield* fetchNetwork(url, "post", options, {
        headers: authorizationHeaders(config.apiKey),
      })

      const encoded: PreparedPasskeyUpdate | BadRequestError | ForbiddenError = yield* matchStatus(
        response,
        {
          "2xx": (res) => decodeResponseJson(res, PasskeySchemas.PreparedPasskeyUpdate),
          orElse: (res) => decodeResponseJson(res, Schema.Union(BadRequestError, ForbiddenError)),
        }
      )

      return yield* pipe(
        Match.value(encoded),
        Match.tag("PreparedPasskeyUpdate", (data) => Effect.succeed(data)),
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

/* Delete Passkeys */

/**
 * Options for preparing passkey deletion instructions.
 *
 * Pass either `passkeyIds` or `userId`, never both.
 * Empty `passkeyIds` arrays are invalid.
 *
 * @category Passkeys
 */
export type DeletePasskeysOptions =
  | {
      /**
       * Passlock passkey record IDs to delete.
       */
      passkeyIds: ReadonlyArray<string>
      userId?: never
    }
  | {
      /**
       * Custom user ID whose passkeys should be deleted.
       */
      userId: string
      passkeyIds?: never
    }

/**
 * Prepare passkey deletion instructions.
 *
 * The server-side operation removes matching Passlock vault records and returns
 * a short-lived token containing snapshotted browser cleanup instructions. Send
 * only `deletePasskeysToken` to the browser and call `@passlock/browser`'s
 * `deletePasskeys` helper. Missing passkey IDs and user-scoped no-op deletes
 * are reported as non-fatal warnings.
 *
 * @param options Passkey deletion selector options.
 * @param config Shared Passlock configuration for the request.
 * @param fetchLayer Optional fetch service override for testing or custom runtimes.
 * @returns An Effect that succeeds with a prepared passkey deletion token.
 *
 * @category Passkeys
 */
export const deletePasskeys = (
  options: DeletePasskeysOptions,
  config: AuthenticatedOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<PreparedPasskeyDeletion, BadRequestError | ForbiddenError> =>
  pipe(
    Effect.gen(function* () {
      const baseUrl = config.endpoint ?? "https://api.passlock.dev"
      const { tenancyId } = config

      const url = new URL(`/v2/${tenancyId}/passkeys/delete`, baseUrl)

      const response = yield* fetchNetwork(url, "post", options, {
        headers: authorizationHeaders(config.apiKey),
      })

      const encoded: PreparedPasskeyDeletion | BadRequestError | ForbiddenError =
        yield* matchStatus(response, {
          "2xx": (res) => decodeResponseJson(res, PasskeySchemas.PreparedPasskeyDeletion),
          orElse: (res) => decodeResponseJson(res, Schema.Union(BadRequestError, ForbiddenError)),
        })

      return yield* pipe(
        Match.value(encoded),
        Match.tag("PreparedPasskeyDeletion", (data) => Effect.succeed(data)),
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

/* Prune Passkeys */

/**
 * Options for preparing accepted-passkey pruning instructions.
 *
 * @category Passkeys
 */
export interface PrunePasskeysOptions {
  /**
   * Custom user ID whose currently accepted passkeys should be snapshotted.
   */
  userId: string
}

/**
 * Prepare passkey pruning instructions for a user.
 *
 * The server-side operation returns a short-lived token containing the
 * currently accepted credential IDs for the user. It does not delete Passlock
 * vault records. Send only
 * `prunePasskeysToken` to the browser and call `@passlock/browser`'s
 * `prunePasskeys` helper.
 *
 * @param options User-specific prune request options.
 * @param config Shared Passlock configuration for the request.
 * @param fetchLayer Optional fetch service override for testing or custom runtimes.
 * @returns An Effect that succeeds with a prepared passkey pruning token.
 *
 * @category Passkeys
 */
export const prunePasskeys = (
  options: PrunePasskeysOptions,
  config: AuthenticatedOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<PreparedPasskeyPruning, BadRequestError | ForbiddenError> =>
  pipe(
    Effect.gen(function* () {
      const baseUrl = config.endpoint ?? "https://api.passlock.dev"
      const { tenancyId } = config

      const url = new URL(`/v2/${tenancyId}/passkeys/prune`, baseUrl)

      const response = yield* fetchNetwork(url, "post", options, {
        headers: authorizationHeaders(config.apiKey),
      })

      const encoded: PreparedPasskeyPruning | BadRequestError | ForbiddenError = yield* matchStatus(
        response,
        {
          "2xx": (res) => decodeResponseJson(res, PasskeySchemas.PreparedPasskeyPruning),
          orElse: (res) => decodeResponseJson(res, Schema.Union(BadRequestError, ForbiddenError)),
        }
      )

      return yield* pipe(
        Match.value(encoded),
        Match.tag("PreparedPasskeyPruning", (data) => Effect.succeed(data)),
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
