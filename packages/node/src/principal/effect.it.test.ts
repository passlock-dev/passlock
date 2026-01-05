import { describe, it } from "@effect/vitest"
import { Effect, pipe, Redacted } from "effect"
import { expect } from "vitest"
import { intTestConfig } from "../testUtils.js"
import { exchangeCode } from "./effects.js"

describe("Principal", () => {
  describe(exchangeCode.name, () => {
    describe("when the principal exists", () => {
      it.effect("should return it", () =>
        Effect.gen(function* () {
          const { tenancyId, passkeyId, code, apiKey, endpoint } = yield* intTestConfig

          const principal = yield* pipe(
            exchangeCode(code, { apiKey: Redacted.value(apiKey), endpoint, tenancyId })
          )
          expect(principal._tag).toEqual("ExtendedPrincipal")
          expect(principal.authenticatorId).toEqual(passkeyId)
          expect(principal.metadata?.ipAddress).toEqual("127.0.0.1")
          expect(principal.metadata.userAgent).toEqual("Safari")
        })
      )
    })

    describe("when the principal does not exist", () => {
      it.effect("should return an error", () =>
        Effect.gen(function* () {
          const { tenancyId, apiKey, endpoint } = yield* intTestConfig

          const error = yield* pipe(
            exchangeCode("junkCode", { apiKey: Redacted.value(apiKey), endpoint, tenancyId }),
            Effect.flip
          )
          expect(error._tag).toEqual("@error/InvalidCode")
        })
      )
    })

    it.effect("should return forbidden if the API key is invalid", () =>
      Effect.gen(function* () {
        const { tenancyId, code, endpoint } = yield* intTestConfig

        const error = yield* pipe(
          exchangeCode(code, { apiKey: "junk", endpoint, tenancyId }),
          Effect.flip
        )

        expect(error._tag).toEqual("@error/Forbidden")
      })
    )
  })
})
