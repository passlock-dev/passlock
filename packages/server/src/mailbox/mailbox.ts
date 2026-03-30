import { Effect, type Layer, Match, pipe, Schema } from "effect"
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
import * as ChallengeSchemas from "../schemas/challenge.js"
import {
  ChallengeAttemptsExceededError,
  ChallengeExpiredError,
  ChallengeRateLimitedError,
  ForbiddenError,
  InvalidChallengeCodeError,
  InvalidChallengeError,
  NotFoundError,
} from "../schemas/errors.js"
import type { satisfy } from "../schemas/satisfy.js"
import type { AuthenticatedOptions } from "../shared.js"

/**
 * JSON-compatible metadata stored alongside a mailbox challenge.
 *
 * @category Mailbox
 */
export type MailboxChallengeMetadataValue =
  | string
  | number
  | boolean
  | null
  | ReadonlyArray<MailboxChallengeMetadataValue>
  | MailboxChallengeMetadata

/**
 * JSON-compatible metadata stored alongside a mailbox challenge.
 *
 * @category Mailbox
 */
export interface MailboxChallengeMetadata {
  readonly [key: string]: MailboxChallengeMetadataValue
}

/**
 * needed to ensure the MailboxChallengeMetadata === MailboxChallengeMetadata.Type
 * @internal
 */
export type _MailboxChallengeMetadata = satisfy<
  typeof ChallengeSchemas.MailboxChallengeMetadata.Type,
  MailboxChallengeMetadata
>

/**
 * Readable mailbox challenge details returned by read and verify operations.
 *
 * This tagged representation excludes the secret and one-time code.
 *
 * @category Mailbox
 */
export type MailboxChallengeDetails = {
  _tag: "Challenge"
  challengeId: string
  purpose: string
  email: string
  userId?: string | undefined
  createdAt: number
  expiresAt: number
  metadata: MailboxChallengeMetadata | null
}

/**
 * Type guard for {@link MailboxChallengeDetails}.
 *
 * @category Mailbox
 */
export const isMailboxChallengeDetails = (
  payload: unknown
): payload is MailboxChallengeDetails =>
  Schema.is(ChallengeSchemas.MailboxChallengeDetails)(payload)

/**
 * needed to ensure the MailboxChallengeDetails === MailboxChallengeDetails.Type
 * @internal
 */
export type _MailboxChallengeDetails = satisfy<
  typeof ChallengeSchemas.MailboxChallengeDetails.Type,
  MailboxChallengeDetails
>

/**
 * A mailbox one-time-code challenge.
 *
 * @category Mailbox
 */
export type MailboxChallenge = {
  challengeId: string
  purpose: string
  email: string
  userId?: string | undefined
  metadata: MailboxChallengeMetadata | null
  secret: string
  code: string
  createdAt: number
  expiresAt: number
}

/**
 * Type guard for {@link MailboxChallenge}.
 *
 * @category Mailbox
 */
export const isMailboxChallenge = (
  payload: unknown
): payload is MailboxChallenge =>
  Schema.is(ChallengeSchemas.MailboxChallenge)(payload)

/**
 * needed to ensure the MailboxChallenge === MailboxChallenge.Type
 * @internal
 */
export type _MailboxChallenge = satisfy<
  typeof ChallengeSchemas.MailboxChallenge.Type,
  MailboxChallenge
>

/**
 * Result payload returned when a mailbox challenge is created.
 *
 * @category Mailbox
 */
export type MailboxChallengeCreated = {
  _tag: "ChallengeCreated"
  challenge: MailboxChallenge
}

/**
 * Type guard for {@link MailboxChallengeCreated}.
 *
 * @category Mailbox
 */
export const isMailboxChallengeCreated = (
  payload: unknown
): payload is MailboxChallengeCreated =>
  Schema.is(ChallengeSchemas.MailboxChallengeCreated)(payload)

/**
 * needed to ensure the MailboxChallengeCreated === MailboxChallengeCreated.Type
 * @internal
 */
export type _MailboxChallengeCreated = satisfy<
  typeof ChallengeSchemas.MailboxChallengeCreated.Type,
  MailboxChallengeCreated
>

/**
 * Result payload returned when a mailbox challenge is verified.
 *
 * @category Mailbox
 */
export type MailboxChallengeVerified = {
  _tag: "ChallengeVerified"
  challenge: MailboxChallengeDetails
}

/**
 * Type guard for {@link MailboxChallengeVerified}.
 *
 * @category Mailbox
 */
export const isMailboxChallengeVerified = (
  payload: unknown
): payload is MailboxChallengeVerified =>
  Schema.is(ChallengeSchemas.MailboxChallengeVerified)(payload)

/**
 * needed to ensure the MailboxChallengeVerified === MailboxChallengeVerified.Type
 * @internal
 */
export type _MailboxChallengeVerified = satisfy<
  typeof ChallengeSchemas.MailboxChallengeVerified.Type,
  MailboxChallengeVerified
>

/**
 * Result payload returned when a mailbox challenge is deleted.
 *
 * @category Mailbox
 */
export type MailboxChallengeDeleted = {
  _tag: "ChallengeDeleted"
}

/**
 * Type guard for {@link MailboxChallengeDeleted}.
 *
 * @category Mailbox
 */
export const isMailboxChallengeDeleted = (
  payload: unknown
): payload is MailboxChallengeDeleted =>
  Schema.is(ChallengeSchemas.MailboxChallengeDeleted)(payload)

/**
 * needed to ensure the MailboxChallengeDeleted === MailboxChallengeDeleted.Type
 * @internal
 */
export type _MailboxChallengeDeleted = satisfy<
  typeof ChallengeSchemas.MailboxChallengeDeleted.Type,
  MailboxChallengeDeleted
>

const authorizationHeaders = (apiKey: string) => ({
  authorization: `Bearer ${apiKey}`,
})

const decodeResponseJson = <A, I, R>(
  response: NetworkResponse,
  schema: Schema.Schema<A, I, R>
) => pipe(response.json, Effect.flatMap(Schema.decodeUnknown(schema)))

/**
 * Options for creating a mailbox challenge.
 *
 * @category Mailbox
 */
export interface CreateMailboxChallengeOptions extends AuthenticatedOptions {
  /**
   * Email address to send the challenge to.
   */
  email: string

  /**
   * Application-defined purpose for the challenge.
   */
  purpose: string

  /**
   * Optional user ID associated with the challenge.
   */
  userId?: string | undefined

  /**
   * Optional opaque application metadata stored on the challenge.
   */
  metadata?: MailboxChallengeMetadata | undefined

  /**
   * Invalidate other pending challenges for the same purpose and subject.
   *
   * When a user ID is supplied, invalidation scopes by user ID. Otherwise it
   * scopes by email.
   */
  invalidateOthers?: boolean | undefined
}

/**
 * Create a mailbox one-time-code challenge.
 *
 * @param options Request options including challenge details.
 * @param fetchLayer Optional fetch service override for testing or custom runtimes.
 * @returns An Effect that succeeds with the created mailbox challenge payload.
 *
 * @category Mailbox
 */
export const createMailboxChallenge = (
  options: CreateMailboxChallengeOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<
  MailboxChallengeCreated,
  ForbiddenError | ChallengeRateLimitedError
> =>
  pipe(
    Effect.gen(function* () {
      const baseUrl = options.endpoint ?? "https://api.passlock.dev"
      const { tenancyId, email, purpose, userId, metadata, invalidateOthers } =
        options

      const url = new URL(`/${tenancyId}/challenges`, baseUrl)
      const response = yield* fetchNetwork(
        url,
        "post",
        { email, purpose, userId, metadata, invalidateOthers },
        {
          headers: authorizationHeaders(options.apiKey),
        }
      )

      const encoded:
        | MailboxChallengeCreated
        | ForbiddenError
        | ChallengeRateLimitedError = yield* matchStatus(response, {
        "2xx": (res) =>
          decodeResponseJson(res, ChallengeSchemas.MailboxChallengeCreated),
        orElse: (res) =>
          decodeResponseJson(
            res,
            Schema.Union(ForbiddenError, ChallengeRateLimitedError)
          ),
      })

      return yield* pipe(
        Match.value(encoded),
        Match.tag("ChallengeCreated", (result) => Effect.succeed(result)),
        Match.tag("@error/Forbidden", (err) => Effect.fail(err)),
        Match.tag("@error/ChallengeRateLimited", (err) => Effect.fail(err)),
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

/**
 * Options for fetching a mailbox challenge.
 *
 * @category Mailbox
 */
export interface GetMailboxChallengeOptions extends AuthenticatedOptions {
  /**
   * Identifier of the challenge to fetch.
   */
  challengeId: string
}

/**
 * Fetch a mailbox one-time-code challenge.
 *
 * The returned challenge is a readable tagged object and therefore excludes
 * the secret and one-time code.
 *
 * @param options Request options including the challenge identifier.
 * @param fetchLayer Optional fetch service override for testing or custom runtimes.
 * @returns An Effect that succeeds with the readable challenge payload.
 *
 * @category Mailbox
 */
export const getMailboxChallenge = (
  options: GetMailboxChallengeOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<MailboxChallengeDetails, ForbiddenError | NotFoundError> =>
  pipe(
    Effect.gen(function* () {
      const baseUrl = options.endpoint ?? "https://api.passlock.dev"
      const { tenancyId, challengeId } = options

      const url = new URL(`/${tenancyId}/challenges/${challengeId}`, baseUrl)
      const response = yield* fetchNetwork(url, "get", undefined, {
        headers: authorizationHeaders(options.apiKey),
      })

      const encoded: MailboxChallengeDetails | ForbiddenError | NotFoundError =
        yield* matchStatus(response, {
          "2xx": (res) =>
            decodeResponseJson(res, ChallengeSchemas.MailboxChallengeDetails),
          orElse: (res) =>
            decodeResponseJson(
              res,
              Schema.Union(ForbiddenError, NotFoundError)
            ),
        })

      return yield* pipe(
        Match.value(encoded),
        Match.tag("Challenge", (result) => Effect.succeed(result)),
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

/**
 * Options for verifying a mailbox challenge.
 *
 * @category Mailbox
 */
export interface VerifyMailboxChallengeOptions extends AuthenticatedOptions {
  /**
   * Identifier returned when the challenge was created.
   */
  challengeId: string

  /**
   * Challenge secret returned when the challenge was created.
   */
  secret: string

  /**
   * One-time code supplied by the end user.
   */
  code: string
}

/**
 * Verify a mailbox one-time-code challenge.
 *
 * @param options Request options including the challenge identifier, secret,
 * and code.
 * @param fetchLayer Optional fetch service override for testing or custom runtimes.
 * @returns An Effect that succeeds with the verified readable challenge
 * payload.
 *
 * @category Mailbox
 */
export const verifyMailboxChallenge = (
  options: VerifyMailboxChallengeOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<
  MailboxChallengeVerified,
  | ForbiddenError
  | InvalidChallengeError
  | InvalidChallengeCodeError
  | ChallengeExpiredError
  | ChallengeAttemptsExceededError
> =>
  pipe(
    Effect.gen(function* () {
      const baseUrl = options.endpoint ?? "https://api.passlock.dev"
      const { tenancyId, challengeId, secret, code } = options

      const url = new URL(`/${tenancyId}/challenges/verify`, baseUrl)
      const response = yield* fetchNetwork(
        url,
        "post",
        { challengeId, secret, code },
        {
          headers: authorizationHeaders(options.apiKey),
        }
      )

      const encoded:
        | MailboxChallengeVerified
        | ForbiddenError
        | InvalidChallengeError
        | InvalidChallengeCodeError
        | ChallengeExpiredError
        | ChallengeAttemptsExceededError = yield* matchStatus(response, {
        "2xx": (res) =>
          decodeResponseJson(res, ChallengeSchemas.MailboxChallengeVerified),
        orElse: (res) =>
          decodeResponseJson(
            res,
            Schema.Union(
              ForbiddenError,
              InvalidChallengeError,
              InvalidChallengeCodeError,
              ChallengeExpiredError,
              ChallengeAttemptsExceededError
            )
          ),
      })

      return yield* pipe(
        Match.value(encoded),
        Match.tag("ChallengeVerified", (result) => Effect.succeed(result)),
        Match.tag("@error/Forbidden", (err) => Effect.fail(err)),
        Match.tag("@error/InvalidChallenge", (err) => Effect.fail(err)),
        Match.tag("@error/InvalidChallengeCode", (err) => Effect.fail(err)),
        Match.tag("@error/ChallengeExpired", (err) => Effect.fail(err)),
        Match.tag("@error/ChallengeAttemptsExceeded", (err) =>
          Effect.fail(err)
        ),
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

/**
 * Options for deleting a mailbox challenge.
 *
 * @category Mailbox
 */
export interface DeleteMailboxChallengeOptions extends AuthenticatedOptions {
  /**
   * Identifier of the challenge to delete.
   */
  challengeId: string
}

/**
 * Delete a mailbox one-time-code challenge.
 *
 * @param options Request options including the challenge identifier.
 * @param fetchLayer Optional fetch service override for testing or custom runtimes.
 * @returns An Effect that succeeds when the challenge has been deleted.
 *
 * @category Mailbox
 */
export const deleteMailboxChallenge = (
  options: DeleteMailboxChallengeOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<MailboxChallengeDeleted, ForbiddenError> =>
  pipe(
    Effect.gen(function* () {
      const baseUrl = options.endpoint ?? "https://api.passlock.dev"
      const { tenancyId, challengeId } = options

      const url = new URL(`/${tenancyId}/challenges/${challengeId}`, baseUrl)
      const response = yield* fetchNetwork(url, "delete", undefined, {
        headers: authorizationHeaders(options.apiKey),
      })

      const encoded: MailboxChallengeDeleted | ForbiddenError =
        yield* matchStatus(response, {
          "2xx": (res) =>
            decodeResponseJson(res, ChallengeSchemas.MailboxChallengeDeleted),
          orElse: (res) => decodeResponseJson(res, ForbiddenError),
        })

      return yield* pipe(
        Match.value(encoded),
        Match.tag("ChallengeDeleted", (result) => Effect.succeed(result)),
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
