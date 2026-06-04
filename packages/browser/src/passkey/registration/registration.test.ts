import fetchMock from "@fetch-mock/vitest"
import type {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser"
import { Context, Micro, pipe } from "effect"
import { afterAll, describe, expect, it, vi } from "vitest"
import { Endpoint, TenancyId } from "../../internal/index.js"
import { Logger } from "../../logger.js"
import { PasskeyUnsupportedError } from "../errors.js"
import {
  fetchOptions,
  RegistrationHelper,
  registerPasskey,
  startRegistration,
  verifyCredential,
} from "./registration.js"

const loggerTest = {
  logDebug: () => Micro.void,
  logError: () => Micro.void,
  logInfo: () => Micro.void,
  logWarn: () => Micro.void,
} satisfies typeof Logger.Service

describe(fetchOptions.name, () => {
  const endpoint = "https://api.passlock.dev"
  const tenancyId = "dummyTenancyId"
  const registrationToken = "dummyRegistrationToken"

  const ctx = pipe(
    Context.make(Endpoint, { endpoint }),
    Context.add(Logger, loggerTest),
    Context.add(TenancyId, { tenancyId })
  )

  const expectedRoute = `${endpoint}/v2/${tenancyId}/passkey/registration/options`

  const mockResponse = {
    optionsJSON: {},
    sessionToken: "dummySessionToken",
  }

  it("should redeem the registration token", async () => {
    fetchMock.mockGlobal().postOnce(expectedRoute, mockResponse)

    const result = await pipe(
      fetchOptions({ registrationToken }),
      Micro.provideContext(ctx),
      Micro.runPromise
    )

    expect(result.sessionToken).toBeTruthy()
    expect(result.optionsJSON).toBeTruthy()
    expect(fetchMock).toHavePosted(expectedRoute, { body: { registrationToken } })
  })

  it("should invoke the onEvent handler", async () => {
    fetchMock.mockGlobal().postOnce(expectedRoute, mockResponse)

    const onEvent = vi.fn()

    await pipe(
      fetchOptions({ onEvent, registrationToken }),
      Micro.provideContext(ctx),
      Micro.runPromise
    )

    expect(onEvent).toHaveBeenCalledWith("optionsRequest")
  })
})

describe(startRegistration.name, () => {
  describe("given valid options", () => {
    const registrationHelperTest = {
      browserSupportsWebAuthn: () => true,
      startRegistration: () => Promise.resolve({} as RegistrationResponseJSON),
    } satisfies typeof RegistrationHelper.Service

    it("should invoke the underlying startRegistration function", async () => {
      await pipe(
        startRegistration({} as PublicKeyCredentialCreationOptionsJSON, {}),
        Micro.provideService(Logger, loggerTest),
        Micro.provideService(RegistrationHelper, registrationHelperTest),
        Micro.runPromise
      )
    })
  })

  describe("if the device does not support passkeys", () => {
    const registrationHelperTest = {
      browserSupportsWebAuthn: () => false,
      startRegistration: () => Promise.resolve({} as RegistrationResponseJSON),
    } satisfies typeof RegistrationHelper.Service

    it("should return an error", async () => {
      const result = await pipe(
        startRegistration({} as PublicKeyCredentialCreationOptionsJSON, {}),
        Micro.flip,
        Micro.provideService(Logger, loggerTest),
        Micro.provideService(RegistrationHelper, registrationHelperTest),
        Micro.runPromise
      )

      expect(result).toBeInstanceOf(PasskeyUnsupportedError)
    })
  })
})

describe(verifyCredential.name, () => {
  const endpoint = "https://api.passlock.dev"
  const tenancyId = "dummyTenancyId"

  const ctx = pipe(
    Context.make(Endpoint, { endpoint }),
    Context.add(Logger, loggerTest),
    Context.add(TenancyId, { tenancyId })
  )

  const expectedRoute = `${endpoint}/v2/${tenancyId}/passkey/registration/verification`

  const mockResponse = {
    _tag: "RegistrationSuccess",
    code: "dummyCode",
    id_token: "dummyIdToken",
    principal: {
      authenticatorId: "dummyPasskeyId",
    },
  }

  it("should verify the registration credential", async () => {
    fetchMock.mockGlobal().postOnce(expectedRoute, mockResponse)

    const result = await pipe(
      verifyCredential("dummySessionToken", {} as RegistrationResponseJSON, {}),
      Micro.provideContext(ctx),
      Micro.runPromise
    )

    expect(result).toStrictEqual(mockResponse)
  })
})

describe(registerPasskey.name, () => {
  const endpoint = "https://api.passlock.dev"
  const tenancyId = "dummyTenancyId"
  const registrationToken = "dummyRegistrationToken"

  const registrationHelperTest = {
    browserSupportsWebAuthn: () => true,
    startRegistration: () => Promise.resolve({} as RegistrationResponseJSON),
  } satisfies typeof RegistrationHelper.Service

  const ctx = pipe(
    Context.make(Endpoint, { endpoint }),
    Context.add(Logger, loggerTest),
    Context.add(TenancyId, { tenancyId }),
    Context.add(RegistrationHelper, registrationHelperTest)
  )

  const optionsRoute = `${endpoint}/v2/${tenancyId}/passkey/registration/options`

  const optionsResponse = {
    optionsJSON: {},
    sessionToken: "dummySessionToken",
  }

  const verificationRoute = `${endpoint}/v2/${tenancyId}/passkey/registration/verification`

  const verificationResponse = {
    _tag: "RegistrationSuccess",
    code: "dummyCode",
    id_token: "dummyIdToken",
    principal: {
      authenticatorId: "dummyPasskeyId",
    },
  }

  it("should redeem the token and kick off the registration", async () => {
    fetchMock.mockGlobal().postOnce(optionsRoute, optionsResponse)
    fetchMock.mockGlobal().postOnce(verificationRoute, verificationResponse)

    await pipe(
      registerPasskey({ registrationToken }, { tenancyId }),
      Micro.provideContext(ctx),
      Micro.runPromise
    )
  })
})

afterAll(() => {
  fetchMock.unmockGlobal()
})
