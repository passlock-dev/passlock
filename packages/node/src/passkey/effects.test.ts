import type { DeletedPasskey, FindAllPasskeys, Passkey } from "../schemas/index.js"
import { FetchHttpClient } from "@effect/platform"
import { describe, it } from "@effect/vitest"
import { Chunk, Effect, Layer, pipe, Stream } from "effect"
import { expect } from "vitest"
import { getHeaderValue } from "../testUtils.js"
import {
  assignUser,
  deletePasskey,
  getPasskey,
  listPasskeys,
  listPasskeysStream,
} from "./effects.js"

const passkeyId = "dummyPasskeyId"
const tenancyId = "dummyTenancyId"
const apiKey = "dummyApiKey"
const credentialId = "webAuthnId"
const rpId = "localhost"

const passkeyResponse: Passkey = {
  _tag: "Passkey",
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
  platform: {
    icon: "/12345.png",
    name: "Apple Passwords",
  },
  createdAt: Date.now(),
}

const deletedPasskeyResponse: DeletedPasskey = {
  _tag: "DeletedPasskey",
  passkeyId,
  credentialId,
  rpId,
}

const findAllPasskeysResponse: FindAllPasskeys = {
  _tag: "FindAllPasskeys",
  cursor: "dummyCursor",
  records: [
    {
      _tag: "PasskeySummary",
      id: "dummyPasskeyId",
      userId: "dummyUserId",
      enabled: true,
      credential: {
        aaguid: "dummyAaguid",
      },
      createdAt: Date.now(),
    },
  ],
}

describe(listPasskeys.name, () => {
  describe("when no cursor is provided", () => {
    it.effect("should not send it", () =>
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
                new Response(JSON.stringify(findAllPasskeysResponse), { status: 200 })
              )
            })
          )
        )

        const result = yield* pipe(listPasskeys({ apiKey, tenancyId }, TestLayer))

        expect(result).toStrictEqual(findAllPasskeysResponse)

        expect(invokedUrl).toEqual("https://api.passlock.dev/dummyTenancyId/passkeys/")

        expect(method).toEqual("GET")
      })
    )
  })

  describe("when a cursor is provided", () => {
    it.effect("should send it", () =>
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
                new Response(JSON.stringify(findAllPasskeysResponse), { status: 200 })
              )
            })
          )
        )

        const result = yield* pipe(
          listPasskeys({ apiKey, tenancyId, cursor: "dummyCursor" }, TestLayer)
        )

        expect(result).toStrictEqual(findAllPasskeysResponse)

        expect(invokedUrl).toEqual(
          "https://api.passlock.dev/dummyTenancyId/passkeys/?cursor=dummyCursor"
        )

        expect(method).toEqual("GET")
      })
    )
  })

  describe("when the api returns a cursor", () => {
    it.effect("should return it", () =>
      Effect.gen(function* () {
        const TestLayer = pipe(
          FetchHttpClient.layer,
          Layer.provide(
            Layer.succeed(FetchHttpClient.Fetch, () => {
              return Promise.resolve(
                new Response(JSON.stringify(findAllPasskeysResponse), { status: 200 })
              )
            })
          )
        )

        const result = yield* pipe(listPasskeys({ apiKey, tenancyId }, TestLayer))

        expect(result.cursor).toEqual("dummyCursor")
      })
    )
  })
})

describe(listPasskeysStream.name, () => {
  describe("when no cursor is returned from the API", () => {
    it.effect("should fetch a single page of data", () =>
      Effect.gen(function* () {
        const singlePageResponse: FindAllPasskeys = {
          _tag: "FindAllPasskeys",
          cursor: null,
          records: [
            {
              _tag: "PasskeySummary",
              id: "single-page-passkey-id",
              userId: "single-page-user-id",
              enabled: true,
              credential: {
                aaguid: "single-page-aaguid",
              },
              createdAt: 1,
            },
          ],
        }

        let fetchCount = 0
        const invokedUrls: string[] = []

        const TestLayer = pipe(
          FetchHttpClient.layer,
          Layer.provide(
            Layer.succeed(FetchHttpClient.Fetch, (url) => {
              fetchCount++
              invokedUrls.push(String(url))
              return Promise.resolve(
                new Response(JSON.stringify(singlePageResponse), {
                  status: 200,
                })
              )
            })
          )
        )

        const summaries = yield* pipe(
          listPasskeysStream({ apiKey, tenancyId }, TestLayer),
          Stream.runCollect,
          Effect.map(Chunk.toReadonlyArray)
        )

        expect(fetchCount).toEqual(1)
        expect(invokedUrls).toEqual(["https://api.passlock.dev/dummyTenancyId/passkeys/"])
        expect(summaries).toEqual(singlePageResponse.records)
      })
    )
  })

  describe("when a cursor is returned from the API", () => {
    it.effect("should fetch multiple pages of data", () =>
      Effect.gen(function* () {
        const firstPageResponse: FindAllPasskeys = {
          _tag: "FindAllPasskeys",
          cursor: "page-two-cursor",
          records: [
            {
              _tag: "PasskeySummary",
              id: "first-page-passkey-id",
              userId: "first-page-user-id",
              enabled: true,
              credential: {
                aaguid: "first-page-aaguid",
              },
              createdAt: 1,
            },
          ],
        }

        const secondPageResponse: FindAllPasskeys = {
          _tag: "FindAllPasskeys",
          cursor: null,
          records: [
            {
              _tag: "PasskeySummary",
              id: "second-page-passkey-id",
              userId: "second-page-user-id",
              enabled: false,
              credential: {
                aaguid: "second-page-aaguid",
              },
              createdAt: 2,
            },
          ],
        }

        let fetchCount = 0
        const invokedUrls: string[] = []
        const responses = [firstPageResponse, secondPageResponse]

        const TestLayer = pipe(
          FetchHttpClient.layer,
          Layer.provide(
            Layer.succeed(FetchHttpClient.Fetch, (url) => {
              invokedUrls.push(String(url))
              const response = responses[fetchCount] ?? secondPageResponse
              fetchCount++
              return Promise.resolve(
                new Response(JSON.stringify(response), {
                  status: 200,
                })
              )
            })
          )
        )

        const summaries = yield* pipe(
          listPasskeysStream({ apiKey, tenancyId }, TestLayer),
          Stream.runCollect,
          Effect.map(Chunk.toReadonlyArray)
        )

        expect(fetchCount).toEqual(2)
        expect(invokedUrls).toEqual([
          "https://api.passlock.dev/dummyTenancyId/passkeys/",
          "https://api.passlock.dev/dummyTenancyId/passkeys/?cursor=page-two-cursor",
        ])
        expect(summaries).toEqual([...firstPageResponse.records, ...secondPageResponse.records])
      })
    )
  })
})

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

        expect(passkey).toStrictEqual(passkeyResponse)

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
              return Promise.resolve(
                new Response(JSON.stringify(deletedPasskeyResponse), { status: 202 })
              )
            })
          )
        )

        const result = yield* pipe(deletePasskey(passkeyId, { apiKey, tenancyId }, TestLayer))

        expect(result).toStrictEqual(deletedPasskeyResponse)

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
