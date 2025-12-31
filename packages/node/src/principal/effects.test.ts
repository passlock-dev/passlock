import { FetchHttpClient } from "@effect/platform"
import { describe, it, vi } from "@effect/vitest"
import { Effect, Layer, pipe } from "effect"
import * as jose from "jose"
import { expect } from "vitest"
import { getHeaderValue } from "../testUtils.js"
import { exchangeCode, verifyIdToken } from "./effects.js"

const code = "dummyCode"
const tenancyId = "dummyTenancyId"
const apiKey = "dummyApiKey"

const principalResponse = {
  _tag: "ExtendedPrincipal",
  authenticatorId: "dummyAuthenticatorId",
  authenticatorType: "passkey",
  createdAt: Date.now(),
  expiresAt: Date.now() + 1000,
  passkey: {
    userVerified: true,
    verified: true,
  },
  userId: "dummyUserId",
  metadata: {
    ipAddress: "127.0.0.1",
    userAgent: "Safari",
  },
}

describe(exchangeCode.name, () => {
  describe("when the code is valid", () => {
    it.effect("should return the extended principal", () =>
      Effect.gen(function* () {
        let invokedUrl: string | undefined
        let method: string | undefined

        const TestLayer = pipe(
          FetchHttpClient.layer,
          Layer.provide(
            Layer.succeed(FetchHttpClient.Fetch, (url, init) => {
              invokedUrl = String(url)
              method = init?.method
              return Promise.resolve(
                new Response(JSON.stringify(principalResponse), {
                  status: 200,
                })
              )
            })
          )
        )

        const principal = yield* exchangeCode(code, { apiKey, tenancyId }, TestLayer)

        expect(principal._tag).toEqual("ExtendedPrincipal")
        expect(principal.metadata.ipAddress).toEqual("127.0.0.1")
        expect(principal.metadata.userAgent).toEqual("Safari")

        expect(invokedUrl).toEqual(`https://api.passlock.dev/${tenancyId}/principal/${code}`)

        expect(method).toEqual("GET")
      })
    )
  })

  describe("when the code is invalid", () => {
    it.effect("should return an error", () =>
      Effect.gen(function* () {
        const errorResponse = {
          _tag: "@error/InvalidCode",
          message: "Code expired",
        }

        const TestLayer = pipe(
          FetchHttpClient.layer,
          Layer.provide(
            Layer.succeed(FetchHttpClient.Fetch, () =>
              Promise.resolve(new Response(JSON.stringify(errorResponse), { status: 404 }))
            )
          )
        )

        const error = yield* pipe(exchangeCode(code, { apiKey, tenancyId }, TestLayer), Effect.flip)

        expect(error._tag).toEqual("@error/InvalidCode")
      })
    )
  })

  it.effect("should include the tenancyId in the path", () =>
    Effect.gen(function* () {
      let invokedUrl: string | null = null

      const TestLayer = pipe(
        FetchHttpClient.layer,
        Layer.provide(
          Layer.succeed(FetchHttpClient.Fetch, (url) => {
            invokedUrl = String(url)
            return Promise.resolve(
              new Response(JSON.stringify(principalResponse), {
                status: 200,
              })
            )
          })
        )
      )

      yield* exchangeCode(code, { apiKey, tenancyId }, TestLayer)

      expect(invokedUrl).toEqual(`https://api.passlock.dev/${tenancyId}/principal/${code}`)
    })
  )

  it.effect("should supply the API Key as a header", () =>
    Effect.gen(function* () {
      let authorizationHeader: string | null = null

      const TestLayer = pipe(
        FetchHttpClient.layer,
        Layer.provide(
          Layer.succeed(FetchHttpClient.Fetch, (_, init) => {
            if (init?.headers) {
              authorizationHeader = getHeaderValue(init.headers, "authorization")
            }

            return Promise.resolve(
              new Response(JSON.stringify(principalResponse), {
                status: 200,
              })
            )
          })
        )
      )

      yield* exchangeCode(code, { apiKey, tenancyId }, TestLayer)

      expect(authorizationHeader).toEqual("Bearer dummyApiKey")
    })
  )

  it.effect("should return forbidden if the API key is invalid", () =>
    Effect.gen(function* () {
      const forbiddenResponse = {
        _tag: "@error/Forbidden",
        message: "Go away",
      }

      const TestLayer = pipe(
        FetchHttpClient.layer,
        Layer.provide(
          Layer.succeed(FetchHttpClient.Fetch, () =>
            Promise.resolve(new Response(JSON.stringify(forbiddenResponse), { status: 403 }))
          )
        )
      )

      const error = yield* pipe(exchangeCode(code, { apiKey, tenancyId }, TestLayer), Effect.flip)

      expect(error._tag).toEqual("@error/Forbidden")
    })
  )
})

describe(verifyIdToken.name, () => {
  it.effect("should return the principal for a valid token", () =>
    Effect.gen(function* () {
      const { privateKey, publicKey } = yield* Effect.tryPromise(() =>
        jose.generateKeyPair("RS256")
      )

      const publicJwk = yield* Effect.tryPromise(() => jose.exportJWK(publicKey))
      publicJwk.kid = "test-kid"
      publicJwk.alg = "RS256"
      const jwks = { keys: [publicJwk] }

      const issuedAt = Math.floor(Date.now() / 1000)
      const expiresAt = issuedAt + 60

      const token = yield* Effect.tryPromise(() =>
        new jose.SignJWT({
          "a:id": "dummyAuthenticatorId",
          "a:typ": "passkey",
          aud: tenancyId,
          iss: "passlock.dev",
          jti: "dummyJti",
          "pk:uv": true,
          sub: "dummyUserId",
        })
          .setProtectedHeader({ alg: "RS256", ...(publicJwk.kid ? { kid: publicJwk.kid } : {}) })
          .setIssuedAt(issuedAt)
          .setExpirationTime(expiresAt)
          .sign(privateKey)
      )

      const mockGlobalFetch = Effect.sync(() => {
        const originalFetch = globalThis.fetch

        globalThis.fetch = vi.fn<typeof fetch>(() =>
          Promise.resolve(
            new Response(JSON.stringify(jwks), {
              headers: { "Content-Type": "application/json" },
              status: 200,
            })
          )
        )

        return originalFetch
      })

      const restoreGlobalFetch = (originalFetch: typeof fetch) =>
        Effect.sync(() => {
          globalThis.fetch = originalFetch
        })

      const principal = yield* Effect.acquireUseRelease(
        mockGlobalFetch,
        () => verifyIdToken(token, { tenancyId }),
        restoreGlobalFetch
      )

      expect(principal._tag).toEqual("Principal")
      expect(principal.userId).toEqual("dummyUserId")
      expect(principal.authenticatorId).toEqual("dummyAuthenticatorId")
      expect(principal.passkey?.verified).toBe(true)
      expect(principal.passkey?.userVerified).toBe(true)
    })
  )
})
