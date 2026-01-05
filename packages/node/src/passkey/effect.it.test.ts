import { describe, it } from "@effect/vitest"
import { Effect, pipe, Redacted } from "effect"
import { expect } from "vitest"
import { intTestConfig } from "../testUtils.js"
import { assignUser, getPasskey } from "./effects.js"

describe("Passkey API", () => {
  describe(getPasskey.name, () => {
    describe("when the passkey exists", () => {
      it.effect("should return it", () =>
        Effect.gen(function* () {
          const { tenancyId, passkeyId, apiKey, endpoint } = yield* intTestConfig

          const passkey = yield* pipe(
            getPasskey(passkeyId, { apiKey: Redacted.value(apiKey), endpoint, tenancyId })
          )
          expect(passkey._tag).toEqual("Passkey")
          expect(passkey.id).toEqual(passkeyId)
        })
      )
    })

    describe("when the passkey does not exist", () => {
      it.effect("should return an error", () =>
        Effect.gen(function* () {
          const { tenancyId, apiKey, endpoint } = yield* intTestConfig

          const error = yield* pipe(
            getPasskey("junkPasskeyId", { apiKey: Redacted.value(apiKey), endpoint, tenancyId }),
            Effect.flip
          )
          expect(error._tag).toEqual("@error/NotFound")
        })
      )
    })

    it.effect("should return forbidden if the API key is invalid", () =>
      Effect.gen(function* () {
        const { tenancyId, passkeyId, endpoint } = yield* intTestConfig

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
          const { tenancyId, passkeyId, apiKey, endpoint } = yield* intTestConfig

          const result = yield* assignUser({
            apiKey: Redacted.value(apiKey),
            endpoint,
            passkeyId,
            tenancyId,
            userId,
          })

          expect(result.userId).toEqual(userId)

          // fetch again
          const fetched = yield* getPasskey(passkeyId, {
            apiKey: Redacted.value(apiKey),
            endpoint,
            tenancyId,
          })

          expect(fetched.userId).toEqual(userId)
        })
      )
    })

    describe("when the passkey does not exist", () => {
      it.effect("should return an error", () =>
        Effect.gen(function* () {
          const { tenancyId, apiKey, endpoint } = yield* intTestConfig

          const error = yield* pipe(
            assignUser({
              apiKey: Redacted.value(apiKey),
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
