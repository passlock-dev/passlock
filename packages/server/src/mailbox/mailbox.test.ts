import { describe, it, vi } from "@effect/vitest"
import { Effect, Layer, pipe } from "effect"
import { expect } from "vitest"
import { getHeaderValue } from "../../test/utils.js"
import { NetworkFetch } from "../network.js"
import {
  createMailboxChallenge,
  deleteMailboxChallenge,
  getMailboxChallenge,
  verifyMailboxChallenge,
} from "./mailbox.js"

const tenancyId = "dummyTenancyId"
const apiKey = "dummyApiKey"
const challengeId = "dummyChallengeId"
const metadata = {
  challengeExpiresAt: 123,
  nested: {
    givenName: "Test",
  },
} as const

const createdChallengeResponse = {
  _tag: "ChallengeCreated",
  challenge: {
    challengeId,
    purpose: "LOGIN_CODE",
    email: "user@example.com",
    userId: "dummyUserId",
    metadata: null,
    secret: "secret",
    code: "123456",
    createdAt: 1,
    expiresAt: 2,
  },
} as const

const readableChallenge = {
  _tag: "Challenge",
  challengeId,
  purpose: "LOGIN_CODE",
  email: "user@example.com",
  userId: "dummyUserId",
  metadata: null,
  createdAt: 1,
  expiresAt: 2,
} as const

describe(createMailboxChallenge.name, () => {
  it.effect("posts metadata and invalidateOthers with auth headers", () =>
    Effect.gen(function* () {
      let invokedUrl: string | undefined
      let method: string | undefined
      let authorizationHeader: string | null = null
      let body: string | undefined

      const responseWithMetadata = {
        _tag: "ChallengeCreated",
        challenge: {
          ...createdChallengeResponse.challenge,
          metadata,
        },
      } as const

      const testFetch = vi.fn<typeof fetch>((url, init) => {
        invokedUrl = String(url)
        method = init?.method
        body = init?.body as string | undefined

        if (init?.headers) {
          authorizationHeader = getHeaderValue(init.headers, "authorization")
        }

        return Promise.resolve(
          new Response(JSON.stringify(responseWithMetadata), {
            status: 201,
          })
        )
      })

      const result = yield* createMailboxChallenge(
        {
          apiKey,
          email: "user@example.com",
          invalidateOthers: true,
          metadata,
          purpose: "LOGIN_CODE",
          tenancyId,
          userId: "dummyUserId",
        },
        Layer.succeed(NetworkFetch, testFetch)
      )

      expect(result).toStrictEqual(responseWithMetadata)
      expect(invokedUrl).toEqual(
        `https://api.passlock.dev/${tenancyId}/challenges`
      )
      expect(method).toEqual("POST")
      expect(authorizationHeader).toEqual("Bearer dummyApiKey")
      expect(JSON.parse(body ?? "{}")).toStrictEqual({
        email: "user@example.com",
        invalidateOthers: true,
        metadata,
        purpose: "LOGIN_CODE",
        userId: "dummyUserId",
      })
    })
  )

  it.effect(
    "decodes responses when userId is omitted and metadata is null",
    () =>
      Effect.gen(function* () {
        const responseWithoutUserId = {
          _tag: "ChallengeCreated",
          challenge: {
            challengeId,
            purpose: "LOGIN_CODE",
            email: "user@example.com",
            metadata: null,
            secret: "secret",
            code: "123456",
            createdAt: 1,
            expiresAt: 2,
          },
        } as const

        let body: string | undefined

        const testFetch = vi.fn<typeof fetch>((_, init) => {
          body = init?.body as string | undefined
          return Promise.resolve(
            new Response(JSON.stringify(responseWithoutUserId), {
              status: 201,
            })
          )
        })

        const result = yield* createMailboxChallenge(
          {
            apiKey,
            email: "user@example.com",
            purpose: "LOGIN_CODE",
            tenancyId,
          },
          Layer.succeed(NetworkFetch, testFetch)
        )

        expect(result).toStrictEqual(responseWithoutUserId)
        expect(body).toEqual(
          JSON.stringify({
            email: "user@example.com",
            purpose: "LOGIN_CODE",
          })
        )
        expect(result.challenge.userId).toBeUndefined()
        expect(result.challenge.metadata).toBeNull()
      })
  )

  it.effect("returns ChallengeRateLimited errors", () =>
    Effect.gen(function* () {
      const error = yield* pipe(
        createMailboxChallenge(
          {
            apiKey,
            email: "user@example.com",
            purpose: "LOGIN_CODE",
            tenancyId,
          },
          Layer.succeed(NetworkFetch, () =>
            Promise.resolve(
              new Response(
                JSON.stringify({
                  _tag: "@error/ChallengeRateLimited",
                  message: "Too many challenges requested",
                  retryAfterSeconds: 60,
                }),
                { status: 429 }
              )
            )
          )
        ),
        Effect.flip
      )

      expect(error._tag).toEqual("@error/ChallengeRateLimited")
      if (error._tag !== "@error/ChallengeRateLimited") {
        throw new Error("Expected a ChallengeRateLimited error")
      }
      expect(error.message).toEqual("Too many challenges requested")
      expect(error.retryAfterSeconds).toEqual(60)
    })
  )
})

describe(getMailboxChallenge.name, () => {
  it.effect("gets a tagged readable challenge with auth headers", () =>
    Effect.gen(function* () {
      let invokedUrl: string | undefined
      let method: string | undefined
      let authorizationHeader: string | null = null

      const testFetch = vi.fn<typeof fetch>((url, init) => {
        invokedUrl = String(url)
        method = init?.method

        if (init?.headers) {
          authorizationHeader = getHeaderValue(init.headers, "authorization")
        }

        return Promise.resolve(
          new Response(JSON.stringify(readableChallenge), {
            status: 200,
          })
        )
      })

      const result = yield* getMailboxChallenge(
        { apiKey, challengeId, tenancyId },
        Layer.succeed(NetworkFetch, testFetch)
      )

      expect(result).toStrictEqual(readableChallenge)
      expect(invokedUrl).toEqual(
        `https://api.passlock.dev/${tenancyId}/challenges/${challengeId}`
      )
      expect(method).toEqual("GET")
      expect(authorizationHeader).toEqual("Bearer dummyApiKey")
    })
  )

  it.effect("returns NotFound errors", () =>
    Effect.gen(function* () {
      const error = yield* pipe(
        getMailboxChallenge(
          { apiKey, challengeId, tenancyId },
          Layer.succeed(NetworkFetch, () =>
            Promise.resolve(
              new Response(
                JSON.stringify({
                  _tag: "@error/NotFound",
                  message: "Challenge not found",
                }),
                { status: 404 }
              )
            )
          )
        ),
        Effect.flip
      )

      expect(error._tag).toEqual("@error/NotFound")
      expect(error.message).toEqual("Challenge not found")
    })
  )
})

describe(verifyMailboxChallenge.name, () => {
  it.effect(
    "posts the challenge identifier, secret, and code to the verify endpoint",
    () =>
      Effect.gen(function* () {
        let invokedUrl: string | undefined
        let method: string | undefined
        let body: string | undefined
        let authorizationHeader: string | null = null

        const verifiedChallengeResponse = {
          _tag: "ChallengeVerified",
          challenge: readableChallenge,
        } as const

        const testFetch = vi.fn<typeof fetch>((url, init) => {
          invokedUrl = String(url)
          method = init?.method
          body = init?.body as string | undefined

          if (init?.headers) {
            authorizationHeader = getHeaderValue(init.headers, "authorization")
          }

          return Promise.resolve(
            new Response(JSON.stringify(verifiedChallengeResponse), {
              status: 200,
            })
          )
        })

        const result = yield* verifyMailboxChallenge(
          {
            apiKey,
            challengeId,
            code: "123456",
            secret: "secret",
            tenancyId,
          },
          Layer.succeed(NetworkFetch, testFetch)
        )

        expect(result).toStrictEqual(verifiedChallengeResponse)
        expect(invokedUrl).toEqual(
          `https://api.passlock.dev/${tenancyId}/challenges/verify`
        )
        expect(method).toEqual("POST")
        expect(authorizationHeader).toEqual("Bearer dummyApiKey")
        expect(body).toEqual(
          JSON.stringify({
            challengeId,
            secret: "secret",
            code: "123456",
          })
        )
      })
  )

  it.effect("returns InvalidChallengeCode errors", () =>
    Effect.gen(function* () {
      const error = yield* pipe(
        verifyMailboxChallenge(
          {
            apiKey,
            challengeId,
            code: "000000",
            secret: "secret",
            tenancyId,
          },
          Layer.succeed(NetworkFetch, () =>
            Promise.resolve(
              new Response(
                JSON.stringify({
                  _tag: "@error/InvalidChallengeCode",
                  message: "Invalid challenge code",
                }),
                { status: 400 }
              )
            )
          )
        ),
        Effect.flip
      )

      expect(error._tag).toEqual("@error/InvalidChallengeCode")
      expect(error.message).toEqual("Invalid challenge code")
    })
  )

  it.effect("returns InvalidChallenge errors", () =>
    Effect.gen(function* () {
      const error = yield* pipe(
        verifyMailboxChallenge(
          {
            apiKey,
            challengeId,
            code: "123456",
            secret: "wrong-secret",
            tenancyId,
          },
          Layer.succeed(NetworkFetch, () =>
            Promise.resolve(
              new Response(
                JSON.stringify({
                  _tag: "@error/InvalidChallenge",
                  message: "Invalid challenge",
                }),
                { status: 400 }
              )
            )
          )
        ),
        Effect.flip
      )

      expect(error._tag).toEqual("@error/InvalidChallenge")
      expect(error.message).toEqual("Invalid challenge")
    })
  )
})

describe(deleteMailboxChallenge.name, () => {
  it.effect("deletes the challenge with auth headers", () =>
    Effect.gen(function* () {
      let invokedUrl: string | undefined
      let method: string | undefined
      let authorizationHeader: string | null = null

      const testFetch = vi.fn<typeof fetch>((url, init) => {
        invokedUrl = String(url)
        method = init?.method

        if (init?.headers) {
          authorizationHeader = getHeaderValue(init.headers, "authorization")
        }

        return Promise.resolve(
          new Response(JSON.stringify({ _tag: "ChallengeDeleted" }), {
            status: 202,
          })
        )
      })

      const result = yield* deleteMailboxChallenge(
        { apiKey, challengeId, tenancyId },
        Layer.succeed(NetworkFetch, testFetch)
      )

      expect(result).toStrictEqual({ _tag: "ChallengeDeleted" })
      expect(invokedUrl).toEqual(
        `https://api.passlock.dev/${tenancyId}/challenges/${challengeId}`
      )
      expect(method).toEqual("DELETE")
      expect(authorizationHeader).toEqual("Bearer dummyApiKey")
    })
  )
})
