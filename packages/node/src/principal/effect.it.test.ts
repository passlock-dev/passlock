import { describe, it } from "@effect/vitest"
import { Config, Effect, pipe } from "effect"
import { expect } from "vitest"
import { exchangeCode } from "./effects.js"

const passkeyId = "itPasskey"
const code = "itPrincipal"
const tenancyId = "itTenancy"
const apiKey = "itApiKey"

const lookupEndpoint = pipe(
  Config.string("PASSLOCK_ENDPOINT"),
  Config.withDefault("http://localhost:3000")
)

describe("Principal", () => {
  describe(exchangeCode.name, () => {
    describe("when the principal exists", () => {
      it.effect("should return it", () =>
        Effect.gen(function* () {
          const endpoint = yield* lookupEndpoint
          const principal = yield* pipe(exchangeCode(code, { apiKey, endpoint, tenancyId }))
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
          const endpoint = yield* lookupEndpoint
          const error = yield* pipe(
            exchangeCode("junkCode", { apiKey, endpoint, tenancyId }),
            Effect.flip
          )
          expect(error._tag).toEqual("@error/InvalidCode")
        })
      )
    })

    it.effect("should return forbidden if the API key is invalid", () =>
      Effect.gen(function* () {
        const endpoint = yield* lookupEndpoint
        const error = yield* pipe(
          exchangeCode(code, { apiKey: "junk", endpoint, tenancyId }),
          Effect.flip
        )

        expect(error._tag).toEqual("@error/Forbidden")
      })
    )
  })
})
