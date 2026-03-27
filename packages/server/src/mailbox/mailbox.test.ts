import { describe, it, vi } from "@effect/vitest"
import { Effect, Layer, pipe } from "effect"
import { expect } from "vitest"
import { getHeaderValue } from "../../test/utils.js"
import { NetworkFetch } from "../network.js"
import {
  createMailboxChallenge,
  deleteMailboxChallenge,
  verifyMailboxChallenge,
} from "./mailbox.js"

const tenancyId = "dummyTenancyId"
const apiKey = "dummyApiKey"
const challengeId = "dummyChallengeId"

const createdChallengeResponse = {
  _tag: "ChallengeCreated",
  challenge: {
    id: challengeId,
    purpose: "LOGIN_CODE",
    email: "user@example.com",
    userId: "dummyUserId",
    token: `${challengeId}.secret`,
    code: "123456",
    createdAt: 1,
    expiresAt: 2,
  },
} as const

describe(createMailboxChallenge.name, () => {
  it.effect("posts to the challenges endpoint with auth headers", () =>
    Effect.gen(function* () {
      let invokedUrl: string | undefined
      let method: string | undefined
      let authorizationHeader: string | null = null
      let body: string | undefined

      const testFetch = vi.fn<typeof fetch>((url, init) => {
        invokedUrl = String(url)
        method = init?.method
        body = init?.body as string | undefined

        if (init?.headers) {
          authorizationHeader = getHeaderValue(init.headers, "authorization")
        }

        return Promise.resolve(
          new Response(JSON.stringify(createdChallengeResponse), {
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
          userId: "dummyUserId",
        },
        Layer.succeed(NetworkFetch, testFetch)
      )

      expect(result).toStrictEqual(createdChallengeResponse)
      expect(invokedUrl).toEqual(
        `https://api.passlock.dev/${tenancyId}/challenges`
      )
      expect(method).toEqual("POST")
      expect(authorizationHeader).toEqual("Bearer dummyApiKey")
      expect(body).toEqual(
        JSON.stringify({
          email: "user@example.com",
          purpose: "LOGIN_CODE",
          userId: "dummyUserId",
        })
      )
    })
  )

  it.effect("decodes responses when userId is omitted", () =>
    Effect.gen(function* () {
      const responseWithoutUserId = {
        _tag: "ChallengeCreated",
        challenge: {
          id: challengeId,
          purpose: "LOGIN_CODE",
          email: "user@example.com",
          token: `${challengeId}.secret`,
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
    })
  )
})

describe(verifyMailboxChallenge.name, () => {
  it.effect("posts the token and code to the verify endpoint", () =>
    Effect.gen(function* () {
      let invokedUrl: string | undefined
      let method: string | undefined
      let body: string | undefined
      let authorizationHeader: string | null = null

      const testFetch = vi.fn<typeof fetch>((url, init) => {
        invokedUrl = String(url)
        method = init?.method
        body = init?.body as string | undefined

        if (init?.headers) {
          authorizationHeader = getHeaderValue(init.headers, "authorization")
        }

        return Promise.resolve(
          new Response(JSON.stringify({ _tag: "ChallengeVerified" }), {
            status: 200,
          })
        )
      })

      const result = yield* verifyMailboxChallenge(
        {
          apiKey,
          code: "123456",
          tenancyId,
          token: `${challengeId}.secret`,
        },
        Layer.succeed(NetworkFetch, testFetch)
      )

      expect(result).toStrictEqual({ _tag: "ChallengeVerified" })
      expect(invokedUrl).toEqual(
        `https://api.passlock.dev/${tenancyId}/challenges/verify`
      )
      expect(method).toEqual("POST")
      expect(authorizationHeader).toEqual("Bearer dummyApiKey")
      expect(body).toEqual(
        JSON.stringify({
          token: `${challengeId}.secret`,
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
            code: "000000",
            tenancyId,
            token: `${challengeId}.secret`,
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
