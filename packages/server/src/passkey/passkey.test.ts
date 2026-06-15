import { describe, it } from "@effect/vitest"
import { getHeaderValue } from "@test/utils.js"
import { Chunk, Effect, Layer, pipe, Schema, Stream } from "effect"
import { expect } from "vitest"
import { NetworkFetch } from "../network.js"
import type { Passkey, PasskeyEncoded } from "../schemas/passkey.js"
import type {
  AuthorizedPasskeyAuthentication,
  AuthorizedPasskeyRegistration,
  FindAllPasskeys,
  PreparedPasskeyDeletion,
  PreparedPasskeyPruning,
  PreparedPasskeyUpdate,
} from "./passkey.js"

import {
  authorizePasskeyAuthentication,
  authorizePasskeyRegistration,
  deletePasskeys,
  getPasskey,
  listPasskeys,
  listPasskeysStream,
  prunePasskeys,
  updatePasskeys,
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

const authorizedPasskeyRegistrationResponse: AuthorizedPasskeyRegistration = {
  _tag: "AuthorizedPasskeyRegistration",
  expiresAt: 1_700_000_000_000,
  registrationToken: "dummyRegistrationToken",
}

const authorizedPasskeyAuthenticationResponse: AuthorizedPasskeyAuthentication = {
  _tag: "AuthorizedPasskeyAuthentication",
  authenticationToken: "dummyAuthenticationToken",
  expiresAt: 1_700_000_000_000,
}

const preparedPasskeyUpdateResponse: PreparedPasskeyUpdate = {
  _tag: "PreparedPasskeyUpdate",
  updatePasskeysToken: "dummyUpdatePasskeysToken",
  expiresAt: 1_700_000_000_000,
  warnings: [],
}

const preparedPasskeyDeletionResponse: PreparedPasskeyDeletion = {
  _tag: "PreparedPasskeyDeletion",
  deletePasskeysToken: "dummyDeletePasskeysToken",
  expiresAt: 1_700_000_000_000,
  warnings: [
    {
      code: "PASSKEY_NOT_FOUND",
      message: "Passkey not found",
      passkeyId: "missingPasskeyId",
    },
  ],
}

const preparedPasskeyPruningResponse: PreparedPasskeyPruning = {
  _tag: "PreparedPasskeyPruning",
  prunePasskeysToken: "dummyPrunePasskeysToken",
  expiresAt: 1_700_000_000_000,
  warnings: [],
}

describe(authorizePasskeyRegistration.name, () => {
  it.effect("should authorize a registration using the v2 endpoint", () =>
    Effect.gen(function* () {
      let invokedUrl: string | undefined
      let method: string | undefined
      let authorization: string | null | undefined
      let body: unknown

      const TestLayer = Layer.succeed(NetworkFetch, (url, init) => {
        invokedUrl = String(url)
        method = init?.method
        authorization = init?.headers ? getHeaderValue(init.headers, "authorization") : undefined
        body = JSON.parse(String(init?.body))
        return Promise.resolve(
          new Response(JSON.stringify(authorizedPasskeyRegistrationResponse), {
            status: 200,
          })
        )
      })

      const result = yield* pipe(
        authorizePasskeyRegistration(
          {
            rpId: "Example.COM",
            displayName: "Dummy User",
            excludeCredentials: ["existingPasskeyId"],
            timeout: 60_000,
            userId: "dummyUserId",
            username: "dummy@example.com",
            userVerification: "preferred",
          },
          { apiKey, tenancyId },
          TestLayer
        )
      )

      expect(result).toStrictEqual(authorizedPasskeyRegistrationResponse)
      expect(invokedUrl).toEqual(
        "https://api.passlock.dev/v2/dummyTenancyId/passkey/registration/authorize"
      )
      expect(method).toEqual("POST")
      expect(authorization).toEqual("Bearer dummyApiKey")
      expect(body).toStrictEqual({
        rpId: "example.com",
        displayName: "Dummy User",
        excludeCredentials: ["existingPasskeyId"],
        timeout: 60_000,
        userId: "dummyUserId",
        username: "dummy@example.com",
        userVerification: "preferred",
      })
    })
  )
})

describe(authorizePasskeyAuthentication.name, () => {
  it.effect("should authorize an authentication using the v2 endpoint", () =>
    Effect.gen(function* () {
      let invokedUrl: string | undefined
      let method: string | undefined
      let authorization: string | null | undefined
      let body: unknown

      const TestLayer = Layer.succeed(NetworkFetch, (url, init) => {
        invokedUrl = String(url)
        method = init?.method
        authorization = init?.headers ? getHeaderValue(init.headers, "authorization") : undefined
        body = JSON.parse(String(init?.body))
        return Promise.resolve(
          new Response(JSON.stringify(authorizedPasskeyAuthenticationResponse), {
            status: 200,
          })
        )
      })

      const result = yield* pipe(
        authorizePasskeyAuthentication(
          {
            rpId: "Old.COM",
            allowCredentials: ["dummyPasskeyId"],
            timeout: 60_000,
            userId: "dummyUserId",
            userVerification: "preferred",
          },
          { apiKey, tenancyId },
          TestLayer
        )
      )

      expect(result).toStrictEqual(authorizedPasskeyAuthenticationResponse)
      expect(invokedUrl).toEqual(
        "https://api.passlock.dev/v2/dummyTenancyId/passkey/authentication/authorize"
      )
      expect(method).toEqual("POST")
      expect(authorization).toEqual("Bearer dummyApiKey")
      expect(body).toStrictEqual({
        rpId: "old.com",
        allowCredentials: ["dummyPasskeyId"],
        timeout: 60_000,
        userId: "dummyUserId",
        userVerification: "preferred",
      })
    })
  )

  it.effect("should authorize a discoverable conditional authentication", () =>
    Effect.gen(function* () {
      let body: unknown

      const TestLayer = Layer.succeed(NetworkFetch, (_url, init) => {
        body = JSON.parse(String(init?.body))
        return Promise.resolve(
          new Response(JSON.stringify(authorizedPasskeyAuthenticationResponse), {
            status: 200,
          })
        )
      })

      const result = yield* pipe(
        authorizePasskeyAuthentication(
          {
            rpId: "localhost",
            discoverable: true,
            mediation: "conditional",
            timeout: 60_000,
            userVerification: "preferred",
          },
          { apiKey, tenancyId },
          TestLayer
        )
      )

      expect(result).toStrictEqual(authorizedPasskeyAuthenticationResponse)
      expect(body).toStrictEqual({
        rpId: "localhost",
        discoverable: true,
        mediation: "conditional",
        timeout: 60_000,
        userVerification: "preferred",
      })
    })
  )
})

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

        const result = yield* pipe(listPasskeys({}, { apiKey, tenancyId }, TestLayer))

        expect(result).toStrictEqual(findAllPasskeysResponse)

        expect(invokedUrl).toEqual("https://api.passlock.dev/v2/dummyTenancyId/passkeys/")

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
          listPasskeys({ cursor: "dummyCursor" }, { apiKey, tenancyId }, TestLayer)
        )

        expect(result).toStrictEqual(findAllPasskeysResponse)

        expect(invokedUrl).toEqual(
          "https://api.passlock.dev/v2/dummyTenancyId/passkeys/?cursor=dummyCursor"
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

        const result = yield* pipe(listPasskeys({}, { apiKey, tenancyId }, TestLayer))

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
        expect(invokedUrls).toEqual(["https://api.passlock.dev/v2/dummyTenancyId/passkeys/"])
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
          "https://api.passlock.dev/v2/dummyTenancyId/passkeys/",
          "https://api.passlock.dev/v2/dummyTenancyId/passkeys/?cursor=page-two-cursor",
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

        const passkey = yield* pipe(getPasskey({ passkeyId }, { apiKey, tenancyId }, TestLayer))

        expect(passkey).toStrictEqual(expectedPasskey)

        expect(invokedUrl).toEqual(
          "https://api.passlock.dev/v2/dummyTenancyId/passkeys/dummyPasskeyId"
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
          getPasskey({ passkeyId }, { apiKey, tenancyId }, TestLayer),
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

      yield* pipe(getPasskey({ passkeyId }, { apiKey, tenancyId }, TestLayer))

      expect(invokedUrl).toEqual(
        "https://api.passlock.dev/v2/dummyTenancyId/passkeys/dummyPasskeyId"
      )
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

      yield* pipe(getPasskey({ passkeyId }, { apiKey, tenancyId }, TestLayer))

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
        getPasskey({ passkeyId }, { apiKey, tenancyId }, TestLayer),
        Effect.flip
      )

      expect(error._tag).toEqual("@error/Forbidden")
    })
  )
})

describe(updatePasskeys.name, () => {
  it.effect("should prepare a passkey update token", () =>
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
          new Response(JSON.stringify(preparedPasskeyUpdateResponse), {
            status: 200,
          })
        )
      })

      const result = yield* pipe(
        updatePasskeys(
          {
            userId: "dummyUserId",
            username: "newUsername",
            displayName: "New User",
          },
          { apiKey, tenancyId },
          TestLayer
        )
      )

      expect(result).toStrictEqual(preparedPasskeyUpdateResponse)
      expect(invokedUrl).toEqual("https://api.passlock.dev/v2/dummyTenancyId/passkeys/update")
      expect(method).toEqual("POST")
      expect(authorizationHeader).toEqual("Bearer dummyApiKey")
      expect(requestBody).toStrictEqual({
        userId: "dummyUserId",
        username: "newUsername",
        displayName: "New User",
      })
    })
  )

  it.effect("should return bad request for invalid update input", () =>
    Effect.gen(function* () {
      const errorResponse = {
        _tag: "@error/BadRequest",
        message: "Invalid passkey update request",
      }

      const TestLayer = Layer.succeed(NetworkFetch, () =>
        Promise.resolve(new Response(JSON.stringify(errorResponse), { status: 400 }))
      )

      const error = yield* pipe(
        updatePasskeys(
          { userId: "dummyUserId", username: "newUsername" },
          { apiKey, tenancyId },
          TestLayer
        ),
        Effect.flip
      )

      expect(error._tag).toEqual("@error/BadRequest")
    })
  )
})

describe(deletePasskeys.name, () => {
  it.effect("should prepare a passkey deletion token by passkey IDs", () =>
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
          new Response(JSON.stringify(preparedPasskeyDeletionResponse), {
            status: 202,
          })
        )
      })

      const result = yield* pipe(
        deletePasskeys(
          { passkeyIds: ["dummyPasskeyId", "missingPasskeyId"] },
          { apiKey, tenancyId },
          TestLayer
        )
      )

      expect(result).toStrictEqual(preparedPasskeyDeletionResponse)
      expect(invokedUrl).toEqual("https://api.passlock.dev/v2/dummyTenancyId/passkeys/delete")
      expect(method).toEqual("POST")
      expect(authorizationHeader).toEqual("Bearer dummyApiKey")
      expect(requestBody).toStrictEqual({
        passkeyIds: ["dummyPasskeyId", "missingPasskeyId"],
      })
    })
  )

  it.effect("should prepare a passkey deletion token by user ID", () =>
    Effect.gen(function* () {
      let requestBody: unknown

      const TestLayer = Layer.succeed(NetworkFetch, (_url, init) => {
        if (typeof init?.body === "string") {
          requestBody = JSON.parse(init.body)
        }

        return Promise.resolve(
          new Response(JSON.stringify(preparedPasskeyDeletionResponse), {
            status: 202,
          })
        )
      })

      const result = yield* pipe(
        deletePasskeys({ userId: "dummyUserId" }, { apiKey, tenancyId }, TestLayer)
      )

      expect(result).toStrictEqual(preparedPasskeyDeletionResponse)
      expect(requestBody).toStrictEqual({ userId: "dummyUserId" })
    })
  )

  it.effect("should return forbidden when the API key is invalid", () =>
    Effect.gen(function* () {
      const forbiddenResponse = {
        _tag: "@error/Forbidden",
        message: "Go away",
      }

      const TestLayer = Layer.succeed(NetworkFetch, () =>
        Promise.resolve(new Response(JSON.stringify(forbiddenResponse), { status: 403 }))
      )

      const error = yield* pipe(
        deletePasskeys({ userId: "dummyUserId" }, { apiKey, tenancyId }, TestLayer),
        Effect.flip
      )

      expect(error._tag).toEqual("@error/Forbidden")
    })
  )
})

describe(prunePasskeys.name, () => {
  it.effect("should prepare a passkey pruning token", () =>
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
          new Response(JSON.stringify(preparedPasskeyPruningResponse), {
            status: 200,
          })
        )
      })

      const result = yield* pipe(
        prunePasskeys({ userId: "dummyUserId" }, { apiKey, tenancyId }, TestLayer)
      )

      expect(result).toStrictEqual(preparedPasskeyPruningResponse)
      expect(invokedUrl).toEqual("https://api.passlock.dev/v2/dummyTenancyId/passkeys/prune")
      expect(method).toEqual("POST")
      expect(authorizationHeader).toEqual("Bearer dummyApiKey")
      expect(requestBody).toStrictEqual({ userId: "dummyUserId" })
    })
  )
})
