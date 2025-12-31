import type { AuthenticationResponseJSON } from "@simplewebauthn/browser"
import { Context, Micro, pipe } from "effect"
import { describe, expect, it } from "vitest"
import { Endpoint } from "../../internal/network"
import { TenancyId } from "../../internal/tenancy"
import { Logger } from "../../logger"
import { fetchOptions, verifyCredential } from "./micro"

describe(fetchOptions.name, () => {
  const tenancyId = "itTenancy"

  const loggerTest = {
    logDebug: () => Micro.void,
    logError: () => Micro.void,
    logInfo: () => Micro.void,
    logWarn: () => Micro.void,
  } satisfies typeof Logger.Service

  const endpoint = pipe(
    Micro.sync(() => process.env.PASSLOCK_ENDPOINT ?? "http://localhost:3000"),
    Micro.map((endpoint) => ({ endpoint }))
  )

  it("should fetch options from the int test env", async () => {
    const { optionsJSON, sessionToken } = await pipe(
      fetchOptions({}),
      Micro.provideServiceEffect(Endpoint, endpoint),
      Micro.provideService(Logger, loggerTest),
      Micro.provideService(TenancyId, { tenancyId }),
      Micro.runPromise
    )

    expect(sessionToken).toEqual(expect.any(String))
    expect(optionsJSON.challenge).toEqual(expect.any(String))
    expect(optionsJSON.userVerification).toEqual("preferred")
  })

  it("should respect userVerification", async () => {
    const userVerification = "required" as const

    const { optionsJSON, sessionToken } = await pipe(
      fetchOptions({ userVerification }),
      Micro.provideServiceEffect(Endpoint, endpoint),
      Micro.provideService(Logger, loggerTest),
      Micro.provideService(TenancyId, { tenancyId }),
      Micro.runPromise
    )

    expect(sessionToken).toEqual(expect.any(String))
    expect(optionsJSON.challenge).toEqual(expect.any(String))
    expect(optionsJSON.userVerification).toEqual(userVerification)
  })
})

describe(verifyCredential.name, () => {
  const tenancyId = "itTenancy"
  const endpoint = "http://localhost:3000"

  const loggerTest = {
    logDebug: () => Micro.void,
    logError: () => Micro.void,
    logInfo: () => Micro.void,
    logWarn: () => Micro.void,
  } satisfies typeof Logger.Service

  const ctx = pipe(
    Context.make(Logger, loggerTest),
    Context.add(TenancyId, { tenancyId }),
    Context.add(Endpoint, { endpoint })
  )

  it("should return an error if the passkey doesnt exist", async () => {
    const { sessionToken } = await pipe(
      fetchOptions({}),
      Micro.provideContext(ctx),
      Micro.runPromise
    )

    const response: AuthenticationResponseJSON = {
      clientExtensionResults: {},
      id: "123456",
      rawId: "123456",
      response: {
        authenticatorData: "",
        clientDataJSON: "",
        signature: "",
      },
      type: "public-key",
    }

    const error = await pipe(
      verifyCredential(sessionToken, response, {}),
      Micro.flip,
      Micro.provideContext(ctx),
      Micro.runPromise
    )

    expect(error._tag).toEqual("@error/PasskeyNotFound")
  })

  it("should return an error if the session token is wrong", async () => {
    await pipe(fetchOptions({}), Micro.provideContext(ctx), Micro.runPromise)

    const response: AuthenticationResponseJSON = {
      clientExtensionResults: {},
      id: "123456",
      rawId: "123456",
      response: {
        authenticatorData: "",
        clientDataJSON: "",
        signature: "",
      },
      type: "public-key",
    }

    const error = await pipe(
      verifyCredential("invalidSessionToken", response, {}),
      Micro.flip,
      Micro.provideContext(ctx),
      Micro.runPromise
    )

    expect(error._tag).toEqual("@error/UnexpectedError")
    expect(error.message).toEqual("Invalid challenge token")
  })
})
