import { Effect, type Layer, Schema } from "effect"
import type * as Errors from "../errors.js"
import {
  fetchNetwork,
  type NetworkFetch,
  NetworkFetchLive,
  type NetworkMethod,
} from "../network.js"
import * as ErrorSchemas from "../schemas/errors.js"
import type { satisfy } from "../schemas/satisfy.js"
import * as Schemas from "../schemas/totp.js"
import { type AuthenticatedOptions, UnexpectedError } from "../shared.js"

/** Options for enrolling an authenticator. Omitted settings use their documented defaults.
 * Passlock trims the display labels and preserves `userId` exactly.
 * @category TOTP
 */
export type CreateTotpAuthenticatorOptions = {
  /** Case-sensitive application user ID from trusted server state, up to 256 UTF-8 bytes.
   * Must contain a non-whitespace character.
   */
  userId: string
  /** Brand label shown in the authenticator app. Must be 1–128 UTF-8 bytes after trimming and cannot contain colons or control characters. */
  issuer: string
  /** Account label shown in the authenticator app. Must be 1–128 UTF-8 bytes after trimming and cannot contain colons or control characters. */
  username: string
  /** Optional credential nickname. Must be 1–120 UTF-8 bytes after trimming and cannot contain control characters. */
  displayName?: string
  /** Immutable enrollment settings. Non-default settings may be ignored by some apps. */
  totp?: {
    /** HMAC algorithm. @default "SHA1" */
    algorithm?: "SHA1" | "SHA256" | "SHA512"
    /** Code length. @default 6 */
    digits?: 6 | 8
    /** Time step in seconds. @default 30 */
    period?: 30 | 60
  }
  /** Verification policy used for both confirmation and sign-in. */
  verification?: {
    /** Number of steps checked on either side of the current time step. @default 1 */
    window?: 0 | 1
  }
  /** Enrollment duration in integer seconds, from 300 to 1800. @default 900 */
  enrollmentExpiresIn?: number
}

/** Authenticator identity and code used to confirm a pending enrollment.
 * @category TOTP
 */
export type ConfirmTotpAuthenticatorOptions = GetTotpAuthenticatorOptions & {
  /** Exact ASCII digit string, preserving leading zeroes. The length must match
   * the authenticator's configured 6 or 8 digits.
   */
  code: string
}

/** Authenticator identity and code used to verify an active authenticator.
 * @category TOTP
 */
export type VerifyTotpOptions = ConfirmTotpAuthenticatorOptions

/** Identify an authenticator within the current tenancy and application user.
 * @category TOTP
 */
export type GetTotpAuthenticatorOptions = {
  /** Exact application account key resolved from trusted server state. */
  userId: string
  /** The authenticator's returned `id`, consisting of 15 lowercase ASCII letters or digits. */
  authenticatorId: string
}

/** Options for listing a user's authenticators.
 * @category TOTP
 */
export type ListTotpAuthenticatorsOptions = {
  /** Exact application account key resolved from trusted server state. */
  userId: string
  /** Opaque cursor from the preceding page for the same tenancy and user. Omit for the first page. */
  cursor?: string
}

/** Delete an authenticator owned by the specified application user.
 * @category TOTP
 */
export type DeleteTotpAuthenticatorOptions = GetTotpAuthenticatorOptions

/** Fields shared by pending and active authenticators.
 * @category TOTP
 */
export type TotpAuthenticatorDetails = {
  _tag: "TotpAuthenticator"
  id: string
  userId: string
  issuer: string
  username: string
  displayName?: string
  /** Creation timestamp in Unix milliseconds. */
  createdAt: number
  /** Effective TOTP settings, including defaults. The period is in seconds. */
  totp: { algorithm: "SHA1" | "SHA256" | "SHA512"; digits: 6 | 8; period: 30 | 60 }
  /** Effective verification policy. The window counts steps on either side of the current step. */
  verification: { window: 0 | 1 }
}

/** Type guard for {@link TotpAuthenticatorDetails}.
 * @category TOTP
 */
export const isTotpAuthenticatorDetails = (payload: unknown): payload is TotpAuthenticatorDetails =>
  Schema.is(Schemas.TotpAuthenticatorDetails)(payload)

/** An authenticator awaiting enrollment confirmation.
 * @category TOTP
 */
export type PendingTotpAuthenticator = TotpAuthenticatorDetails & {
  status: "pending"
  /** Exclusive enrollment deadline in Unix milliseconds. */
  expiresAt: number
}

/** Type guard for {@link PendingTotpAuthenticator}.
 * @category TOTP
 */
export const isPendingTotpAuthenticator = (payload: unknown): payload is PendingTotpAuthenticator =>
  Schema.is(Schemas.PendingTotpAuthenticator)(payload)

/** A confirmed authenticator.
 * @category TOTP
 */
export type ActiveTotpAuthenticator = TotpAuthenticatorDetails & {
  status: "active"
  /** Enrollment confirmation timestamp in Unix milliseconds. */
  confirmedAt: number
  /** Timestamp of the last successful code verification in Unix milliseconds. Present after the first successful verification following confirmation. */
  lastUsed?: number
}

/** Type guard for {@link ActiveTotpAuthenticator}.
 * @category TOTP
 */
export const isActiveTotpAuthenticator = (payload: unknown): payload is ActiveTotpAuthenticator =>
  Schema.is(Schemas.ActiveTotpAuthenticator)(payload)

/** Authenticator metadata. Narrow by `status` to access the timestamps for
 * a pending or active authenticator. Provisioning material is returned separately in {@link TotpSetup}.
 * @category TOTP
 */
export type TotpAuthenticator = PendingTotpAuthenticator | ActiveTotpAuthenticator

/** Type guard for {@link TotpAuthenticator}.
 * @category TOTP
 */
export const isTotpAuthenticator = (payload: unknown): payload is TotpAuthenticator =>
  Schema.is(Schemas.TotpAuthenticator)(payload)

/** Provisioning material returned only when an authenticator is created.
 * Keep these values out of logs and remote QR services.
 * @category TOTP
 */
export type TotpSetup = {
  /** Unpadded Base32 provisioning secret. */
  secret: string
  /** `otpauth://totp` provisioning URI. */
  uri: string
  /** PNG data URL encoding the same URI. */
  qrCodeDataUrl: string
}

/** Type guard for {@link TotpSetup}.
 * @category TOTP
 */
export const isTotpSetup = (payload: unknown): payload is TotpSetup =>
  Schema.is(Schemas.TotpSetup)(payload)

/** A new pending authenticator and its one-time provisioning response.
 * @category TOTP
 */
export type TotpAuthenticatorCreated = {
  _tag: "TotpAuthenticatorCreated"
  authenticator: PendingTotpAuthenticator
  setup: TotpSetup
}

/** Type guard for {@link TotpAuthenticatorCreated}.
 * @category TOTP
 */
export const isTotpAuthenticatorCreated = (payload: unknown): payload is TotpAuthenticatorCreated =>
  Schema.is(Schemas.TotpAuthenticatorCreated)(payload)

/** Successful confirmation with the newly active authenticator.
 * @category TOTP
 */
export type TotpAuthenticatorConfirmed = {
  _tag: "TotpAuthenticatorConfirmed"
  authenticator: ActiveTotpAuthenticator
}

/** Type guard for {@link TotpAuthenticatorConfirmed}.
 * @category TOTP
 */
export const isTotpAuthenticatorConfirmed = (
  payload: unknown
): payload is TotpAuthenticatorConfirmed => Schema.is(Schemas.TotpAuthenticatorConfirmed)(payload)

/** Successful verification for the specified user and authenticator.
 * Use this result in your application's own sign-in flow.
 * @category TOTP
 */
export type TotpVerified = {
  _tag: "TotpVerified"
  userId: string
  authenticatorId: string
  /** Successful verification timestamp in Unix milliseconds. */
  verifiedAt: number
}

/** Type guard for {@link TotpVerified}.
 * @category TOTP
 */
export const isTotpVerified = (payload: unknown): payload is TotpVerified =>
  Schema.is(Schemas.TotpVerified)(payload)

/** A page of active authenticators and unexpired pending enrollments.
 * @category TOTP
 */
export type FindAllTotpAuthenticators = {
  _tag: "FindAllTotpAuthenticators"
  /** The records on this page. May be empty even if another page is available. */
  records: ReadonlyArray<TotpAuthenticator>
  /** Opaque continuation cursor. `null` indicates the end of the listing. */
  cursor: string | null
}

/** Type guard for {@link FindAllTotpAuthenticators}.
 * @category TOTP
 */
export const isFindAllTotpAuthenticators = (
  payload: unknown
): payload is FindAllTotpAuthenticators => Schema.is(Schemas.FindAllTotpAuthenticators)(payload)

/** Successful deletion acknowledgement.
 * @category TOTP
 */
export type TotpAuthenticatorDeleted = { _tag: "TotpAuthenticatorDeleted" }

/** Type guard for {@link TotpAuthenticatorDeleted}.
 * @category TOTP
 */
export const isTotpAuthenticatorDeleted = (payload: unknown): payload is TotpAuthenticatorDeleted =>
  Schema.is(Schemas.TotpAuthenticatorDeleted)(payload)

// Preserve the HTTP message field; legacy auth decoders only retain the tag.
const Unauthorized = Schema.TaggedStruct("@error/Unauthorized", { message: Schema.String })
const Forbidden = Schema.TaggedStruct("@error/Forbidden", { message: Schema.String })

/** Expected failures returned in the result of starting enrollment.
 * @category TOTP
 */
export type CreateTotpAuthenticatorError =
  | Errors.UnauthorizedError
  | Errors.ForbiddenError
  | Errors.BadRequestError
  | Errors.TotpRateLimitedError
  | Errors.TotpAuthenticatorLimitError
const CreateTotpAuthenticatorErrorSchema = Schema.Union([
  Unauthorized,
  Forbidden,
  ErrorSchemas.BadRequestError,
  ErrorSchemas.TotpRateLimitedError,
  ErrorSchemas.TotpAuthenticatorLimitError,
])

/** Expected failures returned in the result of confirming enrollment.
 * @category TOTP
 */
export type ConfirmTotpAuthenticatorError =
  | Errors.UnauthorizedError
  | Errors.ForbiddenError
  | Errors.BadRequestError
  | Errors.NotFoundError
  | Errors.InvalidTotpCodeError
  | Errors.TotpCodeAlreadyUsedError
  | Errors.TotpRateLimitedError
  | Errors.TotpEnrollmentExpiredError
  | Errors.TotpAuthenticatorAlreadyActiveError
  | Errors.TotpAuthenticatorLimitError
const ConfirmTotpAuthenticatorErrorSchema = Schema.Union([
  Unauthorized,
  Forbidden,
  ErrorSchemas.BadRequestError,
  ErrorSchemas.NotFoundError,
  ErrorSchemas.InvalidTotpCodeError,
  ErrorSchemas.TotpCodeAlreadyUsedError,
  ErrorSchemas.TotpRateLimitedError,
  ErrorSchemas.TotpEnrollmentExpiredError,
  ErrorSchemas.TotpAuthenticatorAlreadyActiveError,
  ErrorSchemas.TotpAuthenticatorLimitError,
])

/** Expected failures returned in the result of verifying a code.
 * @category TOTP
 */
export type VerifyTotpError =
  | Errors.UnauthorizedError
  | Errors.ForbiddenError
  | Errors.BadRequestError
  | Errors.NotFoundError
  | Errors.InvalidTotpCodeError
  | Errors.TotpCodeAlreadyUsedError
  | Errors.TotpRateLimitedError
  | Errors.TotpAuthenticatorNotActiveError
const VerifyTotpErrorSchema = Schema.Union([
  Unauthorized,
  Forbidden,
  ErrorSchemas.BadRequestError,
  ErrorSchemas.NotFoundError,
  ErrorSchemas.InvalidTotpCodeError,
  ErrorSchemas.TotpCodeAlreadyUsedError,
  ErrorSchemas.TotpRateLimitedError,
  ErrorSchemas.TotpAuthenticatorNotActiveError,
])

/** Expected failures returned in the result of fetching an authenticator.
 * @category TOTP
 */
export type GetTotpAuthenticatorError =
  | Errors.UnauthorizedError
  | Errors.ForbiddenError
  | Errors.BadRequestError
  | Errors.NotFoundError
const GetTotpAuthenticatorErrorSchema = Schema.Union([
  Unauthorized,
  Forbidden,
  ErrorSchemas.BadRequestError,
  ErrorSchemas.NotFoundError,
])

/** Expected failures returned in the result of listing authenticators.
 * @category TOTP
 */
export type ListTotpAuthenticatorsError =
  | Errors.UnauthorizedError
  | Errors.ForbiddenError
  | Errors.BadRequestError
const ListTotpAuthenticatorsErrorSchema = Schema.Union([
  Unauthorized,
  Forbidden,
  ErrorSchemas.BadRequestError,
])

/** Expected failures returned in the result of deleting an authenticator.
 * @category TOTP
 */
export type DeleteTotpAuthenticatorError =
  | Errors.UnauthorizedError
  | Errors.ForbiddenError
  | Errors.BadRequestError
  | Errors.NotFoundError
const DeleteTotpAuthenticatorErrorSchema = Schema.Union([
  Unauthorized,
  Forbidden,
  ErrorSchemas.BadRequestError,
  ErrorSchemas.NotFoundError,
])

const statusByTag: Readonly<Record<string, number>> = {
  "@error/Unauthorized": 401,
  "@error/Forbidden": 403,
  "@error/BadRequest": 400,
  "@error/NotFound": 404,
  "@error/InvalidTotpCode": 400,
  "@error/TotpCodeAlreadyUsed": 409,
  "@error/TotpAuthenticatorNotActive": 409,
  "@error/TotpAuthenticatorAlreadyActive": 409,
  "@error/TotpAuthenticatorLimit": 409,
  "@error/TotpEnrollmentExpired": 410,
  "@error/TotpRateLimited": 429,
}
const unexpected = () =>
  new UnexpectedError({ _tag: "@error/Unexpected", message: "TOTP request failed" })
const parse = <S extends Schema.ConstraintDecoder<object>>(schema: S, input: unknown) =>
  Schema.decodeUnknownEffect(schema)(input, { onExcessProperty: "error" }).pipe(
    Effect.mapError(() => new ErrorSchemas.BadRequestError({ message: "Invalid TOTP request" }))
  )

// Neither schema diagnostics nor network errors may expose inputs, responses or URLs.
const boundary = <A, E>(
  effect: Effect.Effect<A, E, NetworkFetch>,
  fetchLayer: Layer.Layer<NetworkFetch>
) =>
  effect.pipe(
    Effect.catchDefect(() => Effect.die(unexpected())),
    Effect.provide(fetchLayer)
  )

const request = <
  S extends Schema.ConstraintDecoder<object>,
  E extends Schema.ConstraintDecoder<{ _tag: string; message: string }>,
>(
  config: AuthenticatedOptions,
  suffix: string,
  method: NetworkMethod,
  body: unknown,
  query: Record<string, string> | undefined,
  success: S,
  errors: E,
  status: number
) =>
  Effect.gen(function* () {
    const url = new URL(
      `/v2/${encodeURIComponent(config.tenancyId)}/totp${suffix}`,
      config.endpoint ?? "https://api.passlock.dev"
    )
    if (query) url.search = new URLSearchParams(query).toString()
    const response = yield* fetchNetwork(url, method, body, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
      redirect: "error",
    }).pipe(Effect.catch(() => Effect.die(unexpected())))
    // Unknown 5xx, redirects and transport failures stay outside operation error unions.
    if (response.status !== status && !Object.values(statusByTag).includes(response.status))
      return yield* Effect.die(unexpected())
    const json = yield* response.json.pipe(Effect.catch(() => Effect.die(unexpected())))
    if (response.status === status)
      return yield* Schema.decodeUnknownEffect(success)(json).pipe(
        Effect.catch(() => Effect.die(unexpected()))
      )
    const failure = yield* Schema.decodeUnknownEffect(errors)(json).pipe(
      Effect.catch(() => Effect.die(unexpected()))
    )
    if (statusByTag[failure._tag] !== response.status) return yield* Effect.die(unexpected())
    return yield* Effect.fail(failure)
  })

/** @internal */
export const createTotpAuthenticator = (
  options: CreateTotpAuthenticatorOptions,
  config: AuthenticatedOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<TotpAuthenticatorCreated, CreateTotpAuthenticatorError> =>
  boundary(
    Effect.gen(function* () {
      const input = yield* parse(Schemas.CreateTotpAuthenticatorOptions, options)
      return yield* request(
        config,
        "/authenticators",
        "post",
        input,
        undefined,
        Schemas.TotpAuthenticatorCreated,
        CreateTotpAuthenticatorErrorSchema,
        201
      )
    }),
    fetchLayer
  )

/** @internal */
export const confirmTotpAuthenticator = (
  options: ConfirmTotpAuthenticatorOptions,
  config: AuthenticatedOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<TotpAuthenticatorConfirmed, ConfirmTotpAuthenticatorError> =>
  boundary(
    Effect.gen(function* () {
      const input = yield* parse(Schemas.ConfirmTotpAuthenticatorOptions, options)
      return yield* request(
        config,
        `/authenticators/${encodeURIComponent(input.authenticatorId)}/confirm`,
        "post",
        { userId: input.userId, code: input.code },
        undefined,
        Schemas.TotpAuthenticatorConfirmed,
        ConfirmTotpAuthenticatorErrorSchema,
        200
      )
    }),
    fetchLayer
  )

/** @internal */
export const verifyTotp = (
  options: VerifyTotpOptions,
  config: AuthenticatedOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<TotpVerified, VerifyTotpError> =>
  boundary(
    Effect.gen(function* () {
      const input = yield* parse(Schemas.VerifyTotpOptions, options)
      return yield* request(
        config,
        "/verify",
        "post",
        input,
        undefined,
        Schemas.TotpVerified,
        VerifyTotpErrorSchema,
        200
      )
    }),
    fetchLayer
  )

/** @internal */
export const getTotpAuthenticator = (
  options: GetTotpAuthenticatorOptions,
  config: AuthenticatedOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<TotpAuthenticator, GetTotpAuthenticatorError> =>
  boundary(
    Effect.gen(function* () {
      const input = yield* parse(Schemas.GetTotpAuthenticatorOptions, options)
      return yield* request(
        config,
        `/authenticators/${encodeURIComponent(input.authenticatorId)}`,
        "get",
        undefined,
        { userId: input.userId },
        Schemas.TotpAuthenticator,
        GetTotpAuthenticatorErrorSchema,
        200
      )
    }),
    fetchLayer
  )

/** @internal */
export const listTotpAuthenticators = (
  options: ListTotpAuthenticatorsOptions,
  config: AuthenticatedOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<FindAllTotpAuthenticators, ListTotpAuthenticatorsError> =>
  boundary(
    Effect.gen(function* () {
      const input = yield* parse(Schemas.ListTotpAuthenticatorsOptions, options)
      return yield* request(
        config,
        "/authenticators",
        "get",
        undefined,
        { userId: input.userId, ...(input.cursor !== undefined ? { cursor: input.cursor } : {}) },
        Schemas.FindAllTotpAuthenticators,
        ListTotpAuthenticatorsErrorSchema,
        200
      )
    }),
    fetchLayer
  )

/** @internal */
export const deleteTotpAuthenticator = (
  options: DeleteTotpAuthenticatorOptions,
  config: AuthenticatedOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<TotpAuthenticatorDeleted, DeleteTotpAuthenticatorError> =>
  boundary(
    Effect.gen(function* () {
      const input = yield* parse(Schemas.DeleteTotpAuthenticatorOptions, options)
      return yield* request(
        config,
        `/authenticators/${encodeURIComponent(input.authenticatorId)}`,
        "delete",
        undefined,
        { userId: input.userId },
        Schemas.TotpAuthenticatorDeleted,
        DeleteTotpAuthenticatorErrorSchema,
        200
      )
    }),
    fetchLayer
  )

/** @internal */
export type _CreateTotpAuthenticatorOptions = satisfy<
  typeof Schemas.CreateTotpAuthenticatorOptions.Type,
  CreateTotpAuthenticatorOptions
>
/** @internal */
export type _CreateTotpAuthenticatorOptionsDecoded = satisfy<
  CreateTotpAuthenticatorOptions,
  typeof Schemas.CreateTotpAuthenticatorOptions.Type
>

/** @internal */
export type _GetTotpAuthenticatorOptions = satisfy<
  typeof Schemas.GetTotpAuthenticatorOptions.Type,
  GetTotpAuthenticatorOptions
>
/** @internal */
export type _GetTotpAuthenticatorOptionsDecoded = satisfy<
  GetTotpAuthenticatorOptions,
  typeof Schemas.GetTotpAuthenticatorOptions.Type
>

/** @internal */
export type _ConfirmTotpAuthenticatorOptions = satisfy<
  typeof Schemas.ConfirmTotpAuthenticatorOptions.Type,
  ConfirmTotpAuthenticatorOptions
>
/** @internal */
export type _ConfirmTotpAuthenticatorOptionsDecoded = satisfy<
  ConfirmTotpAuthenticatorOptions,
  typeof Schemas.ConfirmTotpAuthenticatorOptions.Type
>

/** @internal */
export type _VerifyTotpOptions = satisfy<typeof Schemas.VerifyTotpOptions.Type, VerifyTotpOptions>
/** @internal */
export type _VerifyTotpOptionsDecoded = satisfy<
  VerifyTotpOptions,
  typeof Schemas.VerifyTotpOptions.Type
>

/** @internal */
export type _DeleteTotpAuthenticatorOptions = satisfy<
  typeof Schemas.DeleteTotpAuthenticatorOptions.Type,
  DeleteTotpAuthenticatorOptions
>
/** @internal */
export type _DeleteTotpAuthenticatorOptionsDecoded = satisfy<
  DeleteTotpAuthenticatorOptions,
  typeof Schemas.DeleteTotpAuthenticatorOptions.Type
>

/** @internal */
export type _ListTotpAuthenticatorsOptions = satisfy<
  typeof Schemas.ListTotpAuthenticatorsOptions.Type,
  ListTotpAuthenticatorsOptions
>
/** @internal */
export type _ListTotpAuthenticatorsOptionsDecoded = satisfy<
  ListTotpAuthenticatorsOptions,
  typeof Schemas.ListTotpAuthenticatorsOptions.Type
>

/** @internal */
export type _TotpAuthenticatorDetails = satisfy<
  typeof Schemas.TotpAuthenticatorDetails.Type,
  TotpAuthenticatorDetails
>
/** @internal */
export type _TotpAuthenticatorDetailsDecoded = satisfy<
  TotpAuthenticatorDetails,
  typeof Schemas.TotpAuthenticatorDetails.Type
>

/** @internal */
export type _PendingTotpAuthenticator = satisfy<
  typeof Schemas.PendingTotpAuthenticator.Type,
  PendingTotpAuthenticator
>
/** @internal */
export type _PendingTotpAuthenticatorDecoded = satisfy<
  PendingTotpAuthenticator,
  typeof Schemas.PendingTotpAuthenticator.Type
>

/** @internal */
export type _ActiveTotpAuthenticator = satisfy<
  typeof Schemas.ActiveTotpAuthenticator.Type,
  ActiveTotpAuthenticator
>
/** @internal */
export type _ActiveTotpAuthenticatorDecoded = satisfy<
  ActiveTotpAuthenticator,
  typeof Schemas.ActiveTotpAuthenticator.Type
>

/** @internal */
export type _TotpAuthenticator = satisfy<typeof Schemas.TotpAuthenticator.Type, TotpAuthenticator>
/** @internal */
export type _TotpAuthenticatorDecoded = satisfy<
  TotpAuthenticator,
  typeof Schemas.TotpAuthenticator.Type
>

/** @internal */
export type _TotpSetup = satisfy<typeof Schemas.TotpSetup.Type, TotpSetup>
/** @internal */
export type _TotpSetupDecoded = satisfy<TotpSetup, typeof Schemas.TotpSetup.Type>

/** @internal */
export type _TotpAuthenticatorCreated = satisfy<
  typeof Schemas.TotpAuthenticatorCreated.Type,
  TotpAuthenticatorCreated
>
/** @internal */
export type _TotpAuthenticatorCreatedDecoded = satisfy<
  TotpAuthenticatorCreated,
  typeof Schemas.TotpAuthenticatorCreated.Type
>

/** @internal */
export type _TotpAuthenticatorConfirmed = satisfy<
  typeof Schemas.TotpAuthenticatorConfirmed.Type,
  TotpAuthenticatorConfirmed
>
/** @internal */
export type _TotpAuthenticatorConfirmedDecoded = satisfy<
  TotpAuthenticatorConfirmed,
  typeof Schemas.TotpAuthenticatorConfirmed.Type
>

/** @internal */
export type _TotpVerified = satisfy<typeof Schemas.TotpVerified.Type, TotpVerified>
/** @internal */
export type _TotpVerifiedDecoded = satisfy<TotpVerified, typeof Schemas.TotpVerified.Type>

/** @internal */
export type _FindAllTotpAuthenticators = satisfy<
  typeof Schemas.FindAllTotpAuthenticators.Type,
  FindAllTotpAuthenticators
>
/** @internal */
export type _FindAllTotpAuthenticatorsDecoded = satisfy<
  FindAllTotpAuthenticators,
  typeof Schemas.FindAllTotpAuthenticators.Type
>

/** @internal */
export type _TotpAuthenticatorDeleted = satisfy<
  typeof Schemas.TotpAuthenticatorDeleted.Type,
  TotpAuthenticatorDeleted
>
/** @internal */
export type _TotpAuthenticatorDeletedDecoded = satisfy<
  TotpAuthenticatorDeleted,
  typeof Schemas.TotpAuthenticatorDeleted.Type
>
