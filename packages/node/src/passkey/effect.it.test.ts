import { describe, it } from "@effect/vitest"
import { Config, Effect, pipe } from "effect"
import { expect } from "vitest"
import { assignUser, getPasskey } from "./effects.js"

const passkeyId = "itPasskey"
const tenancyId = "itTenancy"
const apiKey = "itApiKey"

const lookupEndpoint = pipe(
  Config.string("PASSLOCK_ENDPOINT"),
  Config.withDefault("http://localhost:3000")
)

describe("Passkey API", () => {
  describe(getPasskey.name, () => {
    describe("when the passkey exists", () => {
      it.effect("should return it", () =>
        Effect.gen(function* () {
          const endpoint = yield* lookupEndpoint
          const passkey = yield* pipe(getPasskey(passkeyId, { apiKey, endpoint, tenancyId }))
          expect(passkey._tag).toEqual("Passkey")
          expect(passkey.id).toEqual(passkeyId)
        })
      )
    })

    describe("when the passkey does not exist", () => {
      it.effect("should return an error", () =>
        Effect.gen(function* () {
          const endpoint = yield* lookupEndpoint
          const error = yield* pipe(
            getPasskey("junkPasskeyId", { apiKey, endpoint, tenancyId }),
            Effect.flip
          )
          expect(error._tag).toEqual("@error/NotFound")
        })
      )
    })

    it.effect("should return forbidden if the API key is invalid", () =>
      Effect.gen(function* () {
        const endpoint = yield* lookupEndpoint
        const error = yield* pipe(
          getPasskey(passkeyId, { apiKey: "junk", endpoint, tenancyId }),
          Effect.flip
        )

        expect(error._tag).toEqual("@error/Forbidden")
      })
    )
  })

  const randomString = (length = 10): string => {
    return Math.random()
      .toString(36)
      .substring(2, 2 + length)
  }

  describe(assignUser.name, () => {
    describe("when the passkey exists", () => {
      it.effect("should return the updated passkey", () =>
        Effect.gen(function* () {
          const userId = randomString()
          const endpoint = yield* lookupEndpoint

          const result = yield* assignUser({
            apiKey,
            endpoint,
            passkeyId,
            tenancyId,
            userId,
          })

          expect(result.userId).toEqual(userId)

          // fetch again
          const fetched = yield* getPasskey(passkeyId, { apiKey, endpoint, tenancyId })

          expect(fetched.userId).toEqual(userId)
        })
      )
    })

    describe("when the passkey does not exist", () => {
      it.effect("should return an error", () =>
        Effect.gen(function* () {
          const endpoint = yield* lookupEndpoint

          const error = yield* pipe(
            assignUser({
              apiKey,
              endpoint,
              passkeyId: "junkPasskeyId",
              tenancyId,
              userId: "newUserId",
            }),
            Effect.flip
          )

          expect(error._tag).toEqual("@error/NotFound")
        })
      )
    })
  })
})
