import type {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser"
import fetchMock from "@fetch-mock/vitest"
import { Context, Micro, pipe } from "effect"
import { afterAll, describe, expect, it, vi } from "vitest"
import { Logger } from "../logger"
import { Endpoint } from "../shared/network"
import { TenancyId } from "../shared/tenancy"
import { PasskeyUnsupportedError } from "./errors"
import {
  fetchOptions,
  RegistrationHelper,
  registerPasskey,
  startRegistration,
  verifyCredential,
} from "./registration"

const loggerTest = {
  logDebug: () => Micro.void,
  logError: () => Micro.void,
  logInfo: () => Micro.void,
  logWarn: () => Micro.void,
} satisfies typeof Logger.Service

describe(fetchOptions.name, () => {
  const endpoint = "https://api.passlock.dev"
  const tenancyId = "dummyTenancyId"
  const username = "dummyUsername"
  const userDisplayName = "dummyDisplayName"
  const userId = "dummyUserId"

  const ctx = pipe(
    Context.make(Endpoint, { endpoint }),
    Context.add(Logger, loggerTest),
    Context.add(TenancyId, { tenancyId })
  )

  const expectedRoute = `${endpoint}/${tenancyId}/passkey/registration/options`

  const mockResponse = {
    optionsJSON: {},
    sessionToken: "dummySessionToken",
  }

  describe("given an empty set of options", () => {
    it("should fetch some PublicKeyCredentialCreationOptions", async () => {
      fetchMock.mockGlobal().postOnce(expectedRoute, mockResponse)

      const result = await pipe(
        fetchOptions({ username }),
        Micro.provideContext(ctx),
        Micro.runPromise
      )

      expect(result.sessionToken).toBeTruthy()
      expect(result.optionsJSON).toBeTruthy()
    })
  })

  describe("given a username", () => {
    it("should send it to the backend", async () => {
      fetchMock.mockGlobal().postOnce(expectedRoute, mockResponse)

      await pipe(fetchOptions({ username }), Micro.provideContext(ctx), Micro.runPromise)

      expect(fetchMock).toHavePosted(expectedRoute, { body: { username } })
    })
  })

  describe("given a userDisplayName", () => {
    it("should send it to the backend", async () => {
      fetchMock.mockGlobal().postOnce(expectedRoute, mockResponse)

      await pipe(
        fetchOptions({ userDisplayName, username }),
        Micro.provideContext(ctx),
        Micro.runPromise
      )

      expect(fetchMock).toHavePosted(expectedRoute, {
        body: { userDisplayName, username },
      })
    })
  })

  describe("given a userId", () => {
    it("should send it to the backend", async () => {
      fetchMock.mockGlobal().postOnce(expectedRoute, mockResponse)

      await pipe(fetchOptions({ userId, username }), Micro.provideContext(ctx), Micro.runPromise)

      expect(fetchMock).toHavePosted(expectedRoute, {
        body: { userId, username },
      })
    })
  })

  describe("given a list of excludeCredentials", () => {
    const excludeCredentials = ["dummyCredential"]

    it("should send them to the backend", async () => {
      fetchMock.mockGlobal().postOnce(expectedRoute, mockResponse)

      await pipe(
        fetchOptions({ excludeCredentials, username }),
        Micro.provideContext(ctx),
        Micro.runPromise
      )

      expect(fetchMock).toHavePosted(expectedRoute, {
        body: { excludeCredentials, username },
      })
    })
  })

  describe("given a userVerification", () => {
    const userVerification = "required" as const

    it("should send it to the backend", async () => {
      fetchMock.mockGlobal().postOnce(expectedRoute, mockResponse)

      await pipe(
        fetchOptions({ username, userVerification }),
        Micro.provideContext(ctx),
        Micro.runPromise
      )

      expect(fetchMock).toHavePosted(expectedRoute, {
        body: { username, userVerification },
      })
    })
  })

  it("should invoke the onEvent handler", async () => {
    fetchMock.mockGlobal().postOnce(expectedRoute, mockResponse)

    const onEvent = vi.fn()

    await pipe(fetchOptions({ onEvent, username }), Micro.provideContext(ctx), Micro.runPromise)

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

  const expectedRoute = `${endpoint}/${tenancyId}/passkey/registration/verification`

  describe("when the passkey exists", () => {
    const mockResponse = {
      _tag: "RegistrationSuccess",
      code: "dummyCode",
      id_token: "dummyIdToken",
      principal: {
        authenticatorId: "dummyPasskeyId",
      },
    }

    it("should return a successful response", async () => {
      fetchMock.mockGlobal().postOnce(expectedRoute, mockResponse)

      const result = await pipe(
        verifyCredential("dummySessionToken", {} as RegistrationResponseJSON, {}),
        Micro.provideContext(ctx),
        Micro.runPromise
      )

      expect(result).toStrictEqual(mockResponse)
    })
  })
})

describe(registerPasskey.name, () => {
  const endpoint = "https://api.passlock.dev"
  const tenancyId = "dummyTenancyId"
  const username = "dummyUsername"

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

  const optionsRoute = `${endpoint}/${tenancyId}/passkey/registration/options`

  const optionsResponse = {
    optionsJSON: {},
    sessionToken: "dummySessionToken",
  }

  const verificationRoute = `${endpoint}/${tenancyId}/passkey/registration/verification`

  const verificationResponse = {
    _tag: "RegistrationSuccess",
    code: "dummyCode",
    id_token: "dummyIdToken",
    principal: {
      authenticatorId: "dummyPasskeyId",
    },
  }

  it("should fetch the options and kick off the registration", async () => {
    fetchMock.mockGlobal().postOnce(optionsRoute, optionsResponse)
    fetchMock.mockGlobal().postOnce(verificationRoute, verificationResponse)

    pipe(registerPasskey({ tenancyId, username }), Micro.provideContext(ctx), Micro.runPromise)
  })
})

afterAll(() => {
  fetchMock.unmockGlobal()
})
