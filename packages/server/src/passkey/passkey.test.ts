import { describe, it } from "@effect/vitest"
import { getHeaderValue } from "@test/utils.js"
import { Chunk, Effect, Layer, pipe, Schema, Stream } from "effect"
import { expect } from "vitest"
import { NetworkFetch } from "../network.js"
import type { Passkey, PasskeyEncoded } from "../schemas/passkey.js"
import type { DeletedPasskeys, FindAllPasskeys } from "./passkey.js"

import {
  assignUser,
  deletePasskey,
  deleteUserPasskeys,
  getPasskey,
  listPasskeys,
  listPasskeysStream,
  updatePasskey,
} from "./passkey.js"

const passkeyId = "dummyPasskeyId"
const tenancyId = "dummyTenancyId"
const apiKey = "dummyApiKey"
const publicKey = Uint8Array.from([1, 2, 3, 4, 5])

const passkeyResponse: PasskeyEncoded = {
  _tag: "Passkey",
  credential: {
    aaguid: "dummyAaguid",
    backedUp: true,
    counter: 0,
    deviceType: "singleDevice",
    id: "dummyWebAuthnId",
    username: "dummyWebAuthnUsername",
    transports: ["internal"],
    userId: "dummyWebAuthnUserId",
    publicKey: Schema.encodeSync(Schema.Uint8ArrayFromBase64Url)(publicKey),
    rpId: "localhost",
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

const expectedPasskey: Passkey = {
  _tag: "Passkey",
  credential: {
    aaguid: "dummyAaguid",
    backedUp: true,
    counter: 0,
    deviceType: "singleDevice",
    id: "dummyWebAuthnId",
    username: "dummyWebAuthnUsername",
    transports: ["internal"],
    userId: "dummyWebAuthnUserId",
    publicKey,
    rpId: "localhost",
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
        id: "dummyCredentialId",
        userId: "dummyCredentialUserId",
      },
      createdAt: Date.now(),
    },
  ],
}

const deletedPasskeysResponse = {
  _tag: "DeletedPasskeys",
  deleted: [passkeyResponse],
}

const expectedDeletedPasskeys: DeletedPasskeys = {
  _tag: "DeletedPasskeys",
  deleted: [
    {
      credentialId: "dummyWebAuthnId",
      userId: "dummyWebAuthnUserId",
      rpId: "localhost",
    },
  ],
}

const expectedDeletedPasskey = {
  _tag: "DeletedPasskey",
  deleted: {
    credentialId: "dummyWebAuthnId",
    userId: "dummyWebAuthnUserId",
    rpId: "localhost",
  },
} as const

describe(listPasskeys.name, () => {
  describe("when no cursor is provided", () => {
    it.effect("should not send it", () =>
      Effect.gen(function* () {
        let invokedUrl: string | undefined
        let method: string | undefined

        const TestLayer = Layer.succeed(NetworkFetch, (url, init) => {
          invokedUrl = String(url)
          method = init?.method
          return Promise.resolve(
            new Response(JSON.stringify(findAllPasskeysResponse), {
              status: 200,
            })
          )
        })

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

        const TestLayer = Layer.succeed(NetworkFetch, (url, init) => {
          invokedUrl = String(url)
          method = init?.method
          return Promise.resolve(
            new Response(JSON.stringify(findAllPasskeysResponse), {
              status: 200,
            })
          )
        })

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
        const TestLayer = Layer.succeed(NetworkFetch, () => {
          return Promise.resolve(
            new Response(JSON.stringify(findAllPasskeysResponse), {
              status: 200,
            })
          )
        })

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
                id: "dummyCredentialId",
                userId: "dummyCredentialUserId",
              },
              createdAt: 1,
            },
          ],
        }

        let fetchCount = 0
        const invokedUrls: string[] = []

        const TestLayer = Layer.succeed(NetworkFetch, (url) => {
          fetchCount++
          invokedUrls.push(String(url))
          return Promise.resolve(
            new Response(JSON.stringify(singlePageResponse), {
              status: 200,
            })
          )
        })

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
                id: "dummyCredentialId",
                userId: "dummyCredentialUserId",
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
                id: "dummyCredentialId",
                userId: "dummyCredentialUserId",
              },
              createdAt: 2,
            },
          ],
        }

        let fetchCount = 0
        const invokedUrls: string[] = []
        const responses = [firstPageResponse, secondPageResponse]

        const TestLayer = Layer.succeed(NetworkFetch, (url) => {
          invokedUrls.push(String(url))
          const response = responses[fetchCount] ?? secondPageResponse
          fetchCount++
          return Promise.resolve(
            new Response(JSON.stringify(response), {
              status: 200,
            })
          )
        })

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

        const TestLayer = Layer.succeed(NetworkFetch, (url, init) => {
          invokedUrl = String(url)
          method = init?.method
          return Promise.resolve(new Response(JSON.stringify(passkeyResponse), { status: 200 }))
        })

        const passkey = yield* pipe(getPasskey({ passkeyId, apiKey, tenancyId }, TestLayer))

        expect(passkey).toStrictEqual(expectedPasskey)

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

        const TestLayer = Layer.succeed(NetworkFetch, () =>
          Promise.resolve(new Response(JSON.stringify(errorResponse), { status: 404 }))
        )

        const error = yield* pipe(
          getPasskey({ passkeyId, apiKey, tenancyId }, TestLayer),
          Effect.flip
        )

        expect(error._tag).toEqual("@error/NotFound")
      })
    )
  })

  it.effect("should include the tenancyId in the path", () =>
    Effect.gen(function* () {
      let invokedUrl: string | null = null

      const TestLayer = Layer.succeed(NetworkFetch, (url) => {
        invokedUrl = String(url)
        return Promise.resolve(new Response(JSON.stringify(passkeyResponse), { status: 200 }))
      })

      yield* pipe(getPasskey({ passkeyId, apiKey, tenancyId }, TestLayer))

      expect(invokedUrl).toEqual("https://api.passlock.dev/dummyTenancyId/passkeys/dummyPasskeyId")
    })
  )

  it.effect("should supply the API Key as a header", () =>
    Effect.gen(function* () {
      let authorizationHeader: string | null = null

      const TestLayer = Layer.succeed(NetworkFetch, (_, init) => {
        if (init?.headers) {
          authorizationHeader = getHeaderValue(init.headers, "authorization")
        }

        return Promise.resolve(new Response(JSON.stringify(passkeyResponse), { status: 200 }))
      })

      yield* pipe(getPasskey({ passkeyId, apiKey, tenancyId }, TestLayer))

      expect(authorizationHeader).toEqual("Bearer dummyApiKey")
    })
  )

  it.effect("should return forbidden if the API key is invalid", () =>
    Effect.gen(function* () {
      const forbiddenResponse = {
        _tag: "@error/Forbidden",
        message: "Go away",
      }

      const TestLayer = Layer.succeed(NetworkFetch, () =>
        Promise.resolve(new Response(JSON.stringify(forbiddenResponse), { status: 403 }))
      )

      const error = yield* pipe(
        getPasskey({ passkeyId, apiKey, tenancyId }, TestLayer),
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

        const TestLayer = Layer.succeed(NetworkFetch, (url, init) => {
          invokedUrl = String(url)
          method = init?.method
          return Promise.resolve(
            new Response(JSON.stringify(passkeyResponse), {
              status: 202,
            })
          )
        })

        const result = yield* pipe(deletePasskey({ passkeyId, apiKey, tenancyId }, TestLayer))

        expect(result).toStrictEqual(expectedDeletedPasskey)

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

        const TestLayer = Layer.succeed(NetworkFetch, () =>
          Promise.resolve(new Response(JSON.stringify(errorResponse), { status: 404 }))
        )

        const error = yield* pipe(
          deletePasskey({ passkeyId, apiKey, tenancyId }, TestLayer),
          Effect.flip
        )

        expect(error._tag).toEqual("@error/NotFound")
      })
    )
  })
})

describe(deleteUserPasskeys.name, () => {
  describe("when the user exists", () => {
    it.effect("should delete all passkeys for the user", () =>
      Effect.gen(function* () {
        let invokedUrl: string | undefined
        let method: string | undefined
        let authorizationHeader: string | null = null
        let requestBody: unknown

        const TestLayer = Layer.succeed(NetworkFetch, (url, init) => {
          invokedUrl = String(url)
          method = init?.method
          if (init?.headers) {
            authorizationHeader = getHeaderValue(init.headers, "authorization")
          }
          if (typeof init?.body === "string") {
            requestBody = JSON.parse(init.body)
          }

          return Promise.resolve(
            new Response(JSON.stringify(deletedPasskeysResponse), {
              status: 202,
            })
          )
        })

        const result = yield* pipe(
          deleteUserPasskeys({ apiKey, tenancyId, userId: "dummyUserId" }, TestLayer)
        )

        expect(result).toStrictEqual(expectedDeletedPasskeys)
        expect(invokedUrl).toEqual(
          "https://api.passlock.dev/dummyTenancyId/users/dummyUserId/passkeys/"
        )
        expect(method).toEqual("DELETE")
        expect(authorizationHeader).toEqual("Bearer dummyApiKey")
        expect(requestBody).toStrictEqual({ userId: "dummyUserId" })
      })
    )
  })

  describe("when the user does not exist", () => {
    it.effect("should return an error", () =>
      Effect.gen(function* () {
        const errorResponse = {
          _tag: "@error/NotFound",
          message: "User not found",
        }

        const TestLayer = Layer.succeed(NetworkFetch, () =>
          Promise.resolve(new Response(JSON.stringify(errorResponse), { status: 404 }))
        )

        const error = yield* pipe(
          deleteUserPasskeys({ apiKey, tenancyId, userId: "dummyUserId" }, TestLayer),
          Effect.flip
        )

        expect(error._tag).toEqual("@error/NotFound")
      })
    )
  })

  describe("when the API key is invalid", () => {
    it.effect("should return forbidden", () =>
      Effect.gen(function* () {
        const forbiddenResponse = {
          _tag: "@error/Forbidden",
          message: "Go away",
        }

        const TestLayer = Layer.succeed(NetworkFetch, () =>
          Promise.resolve(new Response(JSON.stringify(forbiddenResponse), { status: 403 }))
        )

        const error = yield* pipe(
          deleteUserPasskeys({ apiKey, tenancyId, userId: "dummyUserId" }, TestLayer),
          Effect.flip
        )

        expect(error._tag).toEqual("@error/Forbidden")
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

        const TestLayer = Layer.succeed(NetworkFetch, (url, init) => {
          invokedUrl = String(url)
          method = init?.method
          return Promise.resolve(
            new Response(JSON.stringify({ ...passkeyResponse, userId: "newUserId" }), {
              status: 202,
            })
          )
        })

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

        const TestLayer = Layer.succeed(NetworkFetch, () =>
          Promise.resolve(new Response(JSON.stringify(errorResponse), { status: 404 }))
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

describe(updatePasskey.name, () => {
  describe("when the passkey exists", () => {
    it.effect("should return the updated passkey", () =>
      Effect.gen(function* () {
        let invokedUrl: string | undefined
        let method: string | undefined

        const TestLayer = Layer.succeed(NetworkFetch, (url, init) => {
          invokedUrl = String(url)
          method = init?.method
          return Promise.resolve(
            new Response(
              JSON.stringify({
                ...passkeyResponse,
                userId: "newUserId",
                credential: {
                  ...passkeyResponse.credential,
                  username: "newUsername",
                },
              }),
              {
                status: 202,
              }
            )
          )
        })

        const result = yield* updatePasskey(
          {
            apiKey,
            passkeyId,
            tenancyId,
            userId: "newUserId",
            username: "newUsername",
          },
          TestLayer
        )

        expect(result.userId).toEqual("newUserId")
        expect(result.credential.username).toEqual("newUsername")

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

        const TestLayer = Layer.succeed(NetworkFetch, () =>
          Promise.resolve(new Response(JSON.stringify(errorResponse), { status: 404 }))
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
