import { Context, pipe, Layer, Micro } from "effect"
import { describe, expect, it } from "vitest"
import { Endpoint } from "../../internal/network"
import { TenancyId } from "../../internal/tenancy"
import { Logger } from "../../logger"
import { fetchOptions } from "./micro"

describe(fetchOptions.name, () => {
  const tenancyId = "itTenancy"
  const username = "jdoe@gmail.com"
  const userDisplayName = "John Doe"

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
      fetchOptions({ userDisplayName, username }),
      Micro.provideServiceEffect(Endpoint, endpoint),
      Micro.provideService(Logger, loggerTest),
      Micro.provideService(TenancyId, { tenancyId }),
      Micro.runPromise
    )

    expect(sessionToken).toEqual(expect.any(String))
    expect(optionsJSON.challenge).toEqual(expect.any(String))
    expect(optionsJSON.rp.name).toEqual("passlock.dev")
    expect(optionsJSON.rp.id).toEqual("localhost")
    expect(optionsJSON.user.name).toEqual(username)
    expect(optionsJSON.user.displayName).toEqual(userDisplayName)

    const { authenticatorSelection } = optionsJSON
    expect(authenticatorSelection?.residentKey).toEqual("preferred")
    expect(authenticatorSelection?.userVerification).toEqual("preferred")
    expect(authenticatorSelection?.authenticatorAttachment).toEqual("platform")
    expect(authenticatorSelection?.requireResidentKey).toEqual(false)
  })
})
