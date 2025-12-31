import type { Passkey } from "../schemas/index.js"
import { FetchHttpClient } from "@effect/platform"
import { describe, it } from "@effect/vitest"
import { Effect, Either, Layer, pipe } from "effect"
import { expect } from "vitest"
import { getHeaderValue } from "../testUtils.js"
import { assignUser, deletePasskey, getPasskey } from "./effects.js"

const passkeyId = "dummyPasskeyId"
const tenancyId = "dummyTenancyId"
const apiKey = "dummyApiKey"

const passkeyResponse: Passkey = {
  _tag: "Passkey",
  createdAt: Date.now(),
  credential: {
    aaguid: "dummyAaguid",
    backedUp: true,
    counter: 0,
    deviceType: "singleDevice",
    id: "dummyWebAuthnId",
    transports: ["internal"],
    userId: "dummyWebAuthnUserId",
  },
  enabled: true,
  id: "dummyPasskeyId",
  updatedAt: Date.now(),
  userId: "dummyUserId",
}

describe(getPasskey.name, () => {
  describe("when the passkey exists", () => {
    it.effect("should return it", () =>
      Effect.gen(function* () {
        let invokedUrl: string | undefined
        let method: string | undefined

        const TestLayer = pipe(
          FetchHttpClient.layer,
          Layer.provide(
            Layer.succeed(FetchHttpClient.Fetch, (url, init) => {
              invokedUrl = String(url)
              method = init?.method
              return Promise.resolve(new Response(JSON.stringify(passkeyResponse), { status: 200 }))
            })
          )
        )

        const passkey = yield* pipe(getPasskey(passkeyId, { apiKey, tenancyId }, TestLayer))

        expect(passkey._tag).toEqual("Passkey")

        expect(invokedUrl).toEqual(
          "https://api.passlock.dev/dummyTenancyId/passkeys/dummyPasskeyId"
        )

        expect(method).toEqual("GET")
      })
    )
  })

  describe("when the passkey does not exist", () => {
    it.effect("should return an error", () =>
      Effect.gen(function* () {
        const errorResponse = {
          _tag: "@error/NotFound",
          message: "Passkey not found",
        }

        const TestLayer = pipe(
          FetchHttpClient.layer,
          Layer.provide(
            Layer.succeed(FetchHttpClient.Fetch, () =>
              Promise.resolve(new Response(JSON.stringify(errorResponse), { status: 404 }))
            )
          )
        )

        const error = yield* pipe(
          getPasskey(passkeyId, { apiKey, tenancyId }, TestLayer),
          Effect.flip
        )

        expect(error._tag).toEqual("@error/NotFound")
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
            return Promise.resolve(new Response(JSON.stringify(passkeyResponse), { status: 200 }))
          })
        )
      )

      yield* pipe(getPasskey(passkeyId, { apiKey, tenancyId }, TestLayer))

      expect(invokedUrl).toEqual("https://api.passlock.dev/dummyTenancyId/passkeys/dummyPasskeyId")
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

            return Promise.resolve(new Response(JSON.stringify(passkeyResponse), { status: 200 }))
          })
        )
      )

      yield* pipe(getPasskey(passkeyId, { apiKey, tenancyId }, TestLayer))

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

      const error = yield* pipe(
        getPasskey(passkeyId, { apiKey, tenancyId }, TestLayer),
        Effect.flip
      )

      expect(error._tag).toEqual("@error/Forbidden")
    })
  )
})

describe(deletePasskey.name, () => {
  describe("when the passkey exists", () => {
    it.effect("should delete it", () =>
      Effect.gen(function* () {
        let invokedUrl: string | undefined
        let method: string | undefined

        const TestLayer = pipe(
          FetchHttpClient.layer,
          Layer.provide(
            Layer.succeed(FetchHttpClient.Fetch, (url, init) => {
              invokedUrl = String(url)
              method = init?.method
              return Promise.resolve(new Response(JSON.stringify({ passkeyId }), { status: 202 }))
            })
          )
        )

        const result = yield* pipe(
          deletePasskey(passkeyId, { apiKey, tenancyId }, TestLayer),
          Effect.either
        )

        expect(Either.isRight(result)).toBe(true)

        expect(invokedUrl).toEqual(
          "https://api.passlock.dev/dummyTenancyId/passkeys/dummyPasskeyId"
        )

        expect(method).toEqual("DELETE")
      })
    )
  })

  describe("when the passkey does not exist", () => {
    it.effect("should return an error", () =>
      Effect.gen(function* () {
        const errorResponse = {
          _tag: "@error/NotFound",
          message: "Passkey not found",
        }

        const TestLayer = pipe(
          FetchHttpClient.layer,
          Layer.provide(
            Layer.succeed(FetchHttpClient.Fetch, () =>
              Promise.resolve(new Response(JSON.stringify(errorResponse), { status: 404 }))
            )
          )
        )

        const error = yield* pipe(
          deletePasskey(passkeyId, { apiKey, tenancyId }, TestLayer),
          Effect.flip
        )

        expect(error._tag).toEqual("@error/NotFound")
      })
    )
  })
})

describe(assignUser.name, () => {
  describe("when the passkey exists", () => {
    it.effect("should return the updated passkey", () =>
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
                new Response(JSON.stringify({ ...passkeyResponse, userId: "newUserId" }), {
                  status: 202,
                })
              )
            })
          )
        )

        const result = yield* assignUser(
          { apiKey, passkeyId, tenancyId, userId: "newUserId" },
          TestLayer
        )

        expect(result.userId).toEqual("newUserId")

        expect(invokedUrl).toEqual(
          "https://api.passlock.dev/dummyTenancyId/passkeys/dummyPasskeyId"
        )

        expect(method).toEqual("PATCH")
      })
    )
  })

  describe("when the passkey does not exist", () => {
    it.effect("should return an error", () =>
      Effect.gen(function* () {
        const errorResponse = {
          _tag: "@error/NotFound",
          message: "Passkey not found",
        }

        const TestLayer = pipe(
          FetchHttpClient.layer,
          Layer.provide(
            Layer.succeed(FetchHttpClient.Fetch, () =>
              Promise.resolve(new Response(JSON.stringify(errorResponse), { status: 404 }))
            )
          )
        )

        const error = yield* pipe(
          assignUser({ apiKey, passkeyId, tenancyId, userId: "newUserId" }, TestLayer),
          Effect.flip
        )

        expect(error._tag).toEqual("@error/NotFound")
      })
    )
  })
})
