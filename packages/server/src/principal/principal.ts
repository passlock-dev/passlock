import { Data, Effect, type Layer, Match, pipe, Schema } from "effect"

import * as jose from "jose"
import {
  fetchNetwork,
  matchStatus,
  type NetworkFetch,
  NetworkFetchLive,
  type NetworkPayloadError,
  type NetworkRequestError,
  type NetworkResponseError,
} from "../network.js"
import { ForbiddenError, InvalidCodeError } from "../schemas/errors.js"
import {
  type ExtendedPrincipal,
  ExtendedPrincipalSchema,
  IdTokenSchema,
  type Principal,
} from "../schemas/principal.js"

import type { AuthenticatedOptions, PasslockOptions } from "../shared.js"

/**
 * Options for exchanging a short-lived Passlock code for an
 * {@link ExtendedPrincipal}.
 *
 * @category Principal
 */
export interface ExchangeCodeOptions extends AuthenticatedOptions {
  /**
   * Short-lived code emitted by `@passlock/client`.
   */
  code: string
}

/**
 * Exchange a short-lived Passlock code for details about the completed
 * registration or authentication operation.
 *
 * @param options Request options including the code to exchange.
 * @param fetchLayer Optional fetch service override for testing or custom runtimes.
 * @returns An Effect that succeeds with the resolved {@link ExtendedPrincipal}.
 *
 * @category Principal
 */
export const exchangeCode = (
  options: ExchangeCodeOptions,
  fetchLayer: Layer.Layer<NetworkFetch> = NetworkFetchLive
): Effect.Effect<ExtendedPrincipal, InvalidCodeError | ForbiddenError> =>
  pipe(
    Effect.gen(function* () {
      const baseUrl = options.endpoint ?? "https://api.passlock.dev"
      const { tenancyId, code } = options

      const url = new URL(`/${tenancyId}/principal/${code}`, baseUrl)

      const response = yield* fetchNetwork(url, "get", undefined, {
        headers: {
          authorization: `Bearer ${options.apiKey}`,
        },
      })

      const encoded: ExtendedPrincipal | InvalidCodeError | ForbiddenError =
        yield* matchStatus(response, {
          "2xx": ({ json }) =>
            pipe(
              json,
              Effect.flatMap(Schema.decodeUnknown(ExtendedPrincipalSchema))
            ),
          orElse: ({ json }) =>
            pipe(
              json,
              Effect.flatMap(
                Schema.decodeUnknown(
                  Schema.Union(InvalidCodeError, ForbiddenError)
                )
              )
            ),
        })

      return yield* pipe(
        Match.value(encoded),
        Match.tag("ExtendedPrincipal", (principal) =>
          Effect.succeed(principal)
        ),
        Match.tag("@error/InvalidCode", (err) => Effect.fail(err)),
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

/**
 * Error returned when `verifyIdToken` cannot decode or validate the supplied
 * token.
 *
 * @category Principal
 */
export class VerificationError extends Data.TaggedError("@error/Verification")<{
  message: string
}> {}

/**
 * Options for locally verifying a Passlock `id_token`.
 *
 * @category Principal
 */
export interface VerifyIdTokenOptions extends PasslockOptions {
  /**
   * JWT to decode and verify.
   */
  token: string
}

/**
 * Decode and verify a Passlock `id_token` using the Passlock JWKS endpoint.
 *
 * The JWKS endpoint is derived from `endpoint` and cached between calls in the
 * current process.
 *
 * @param options Request options including the token to verify.
 * @returns An Effect that succeeds with a decoded {@link Principal}.
 *
 * @category Principal
 */
export const verifyIdToken = (
  options: VerifyIdTokenOptions
): Effect.Effect<Principal, VerificationError> =>
  pipe(
    Effect.gen(function* () {
      const JWKS = yield* createCachedRemoteJwks(options.endpoint)

      const { payload } = yield* Effect.tryPromise({
        catch: (err) => {
          return err instanceof Error
            ? new VerificationError({ message: err.message })
            : new VerificationError({ message: String(err) })
        },
        try: () =>
          jose.jwtVerify(options.token, JWKS, {
            audience: options.tenancyId,
            issuer: "passlock.dev",
          }),
      })

      const idToken = yield* Schema.decodeUnknown(IdTokenSchema)({
        ...payload,
        _tag: "IdToken",
      })

      const principal: Principal = {
        _tag: "Principal",
        id: idToken["jti"],
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

const createJwks = (endpoint?: string) =>
  Effect.sync(() => {
    const baseUrl = endpoint ?? "https://api.passlock.dev"

    return jose.createRemoteJWKSet(new URL("/.well-known/jwks.json", baseUrl))
  })

const createCachedRemoteJwks = pipe(
  Effect.cachedFunction(createJwks),
  Effect.runSync
)
