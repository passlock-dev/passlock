import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser"
import fetchMock from "@fetch-mock/vitest"
import { Context, Micro, pipe } from "effect"
import { afterAll, describe, expect, it, vi } from "vitest"
import { Endpoint } from "../../internal/network"
import { TenancyId } from "../../internal/tenancy"
import { Logger } from "../../logger"
import { PasskeysUnsupportedError } from "../errors"
import {
  AuthenticationHelper,
  authenticatePasskey,
  fetchOptions,
  startAuthentication,
  verifyCredential,
} from "./micro"

const loggerTest = {
  logDebug: () => Micro.void,
  logError: () => Micro.void,
  logInfo: () => Micro.void,
  logWarn: () => Micro.void,
} satisfies typeof Logger.Service

describe(fetchOptions.name, () => {
  const endpoint = "https://api.passlock.dev"
  const tenancyId = "dummyTenancyId"

  const ctx = pipe(
    Context.make(Endpoint, { endpoint }),
    Context.add(Logger, loggerTest),
    Context.add(TenancyId, { tenancyId })
  )

  const expectedRoute = `${endpoint}/${tenancyId}/passkey/authentication/options`

  const mockResponse = {
    optionsJSON: {},
    sessionToken: "dummySessionToken",
  }

  describe("given an empty set of options", () => {
    it("should fetch some PublicKeyCredentialCreationOptions", async () => {
      fetchMock.mockGlobal().postOnce(expectedRoute, mockResponse)

      const result = await pipe(fetchOptions({}), Micro.provideContext(ctx), Micro.runPromise)

      expect(result.sessionToken).toBeTruthy()
      expect(result.optionsJSON).toBeTruthy()
    })
  })

  describe("given a userId", () => {
    const userId = "dummyUserId"

    it("should send it to the backend", async () => {
      fetchMock.mockGlobal().postOnce(expectedRoute, mockResponse)

      await pipe(fetchOptions({ userId }), Micro.provideContext(ctx), Micro.runPromise)

      expect(fetchMock).toHavePosted(expectedRoute, { body: { userId } })
    })
  })

  describe("given a list of allowCredentials", () => {
    const allowCredentials = ["dummyCredential"]

    it("should send them to the backend", async () => {
      fetchMock.mockGlobal().postOnce(expectedRoute, mockResponse)

      await pipe(fetchOptions({ allowCredentials }), Micro.provideContext(ctx), Micro.runPromise)

      expect(fetchMock).toHavePosted(expectedRoute, {
        body: { allowCredentials },
      })
    })
  })

  describe("given a userVerification", () => {
    const userVerification = "required" as const

    it("should send it to the backend", async () => {
      fetchMock.mockGlobal().postOnce(expectedRoute, mockResponse)

      await pipe(fetchOptions({ userVerification }), Micro.provideContext(ctx), Micro.runPromise)

      expect(fetchMock).toHavePosted(expectedRoute, {
        body: { userVerification },
      })
    })
  })

  it("should invoke the onEvent handler", async () => {
    fetchMock.mockGlobal().postOnce(expectedRoute, mockResponse)

    const onEvent = vi.fn()

    await pipe(fetchOptions({ onEvent }), Micro.provideContext(ctx), Micro.runPromise)

    expect(onEvent).toHaveBeenCalledWith("optionsRequest")
  })
})

describe(startAuthentication.name, () => {
  describe("given valid options", () => {
    const authenticationHelperTest = {
      browserSupportsWebAuthn: () => true,
      startAuthentication: () => Promise.resolve({} as AuthenticationResponseJSON),
    } satisfies typeof AuthenticationHelper.Service

    it("should invoke the underlying startAuthentication function", async () => {
      await pipe(
        startAuthentication({} as PublicKeyCredentialRequestOptionsJSON, {
          useBrowserAutofill: false,
        }),
        Micro.provideService(Logger, loggerTest),
        Micro.provideService(AuthenticationHelper, authenticationHelperTest),
        Micro.runPromise
      )
    })
  })

  describe("if the device does not support passkeys", () => {
    const authenticationHelperTest = {
      browserSupportsWebAuthn: () => false,
      startAuthentication: () => Promise.resolve({} as AuthenticationResponseJSON),
    } satisfies typeof AuthenticationHelper.Service

    it("should return an error", async () => {
      const result = await pipe(
        startAuthentication({} as PublicKeyCredentialRequestOptionsJSON, {
          useBrowserAutofill: false,
        }),
        Micro.flip,
        Micro.provideService(Logger, loggerTest),
        Micro.provideService(AuthenticationHelper, authenticationHelperTest),
        Micro.runPromise
      )

      expect(result).toBeInstanceOf(PasskeysUnsupportedError)
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

  const expectedRoute = `${endpoint}/${tenancyId}/passkey/authentication/verification`

  describe("when the passkey exists", () => {
    const mockResponse = {
      _tag: "AuthenticationSuccess",
      code: "dummyCode",
      id_token: "dummyIdToken",
      principal: {
        authenticatorId: "dummyPasskeyId",
      },
    }

    it("should return a successful response", async () => {
      fetchMock.mockGlobal().postOnce(expectedRoute, mockResponse)

      const result = await pipe(
        verifyCredential("dummySessionToken", {} as AuthenticationResponseJSON, {}),
        Micro.provideContext(ctx),
        Micro.runPromise
      )

      expect(result).toStrictEqual(mockResponse)
    })
  })

  describe("when the backend says the passkey does not exist", () => {
    it("should return an error", async () => {
      const mockResponse = {
        _tag: "@error/PasskeyNotFound",
        credentialId: "dummyWebAuthnId",
        message: "oops",
        rpId: "localhost",
      }

      fetchMock.mockGlobal().postOnce(expectedRoute, { body: mockResponse, status: 400 })

      const error = await pipe(
        verifyCredential("dummySessionToken", {} as AuthenticationResponseJSON, {}),
        Micro.flip,
        Micro.provideContext(ctx),
        Micro.runPromise
      )

      expect(error).toStrictEqual(mockResponse)
    })
  })
})

describe(authenticatePasskey.name, () => {
  const endpoint = "https://api.passlock.dev"
  const tenancyId = "dummyTenancyId"

  const authenticationHelperTest = {
    browserSupportsWebAuthn: () => true,
    startAuthentication: () => Promise.resolve({} as AuthenticationResponseJSON),
  } satisfies typeof AuthenticationHelper.Service

  const ctx = pipe(
    Context.make(Endpoint, { endpoint }),
    Context.add(Logger, loggerTest),
    Context.add(TenancyId, { tenancyId }),
    Context.add(AuthenticationHelper, authenticationHelperTest)
  )

  const optionsRoute = `${endpoint}/${tenancyId}/passkey/authentication/options`

  const optionsResponse = {
    optionsJSON: {},
    sessionToken: "dummySessionToken",
  }

  const verificationRoute = `${endpoint}/${tenancyId}/passkey/authentication/verification`

  const verificationResponse = {
    _tag: "AuthenticationSuccess",
    code: "dummyCode",
    id_token: "dummyIdToken",
    principal: {
      authenticatorId: "dummyPasskeyId",
    },
  }

  it("should fetch the options and kick off the authentication", async () => {
    fetchMock.mockGlobal().postOnce(optionsRoute, optionsResponse)
    fetchMock.mockGlobal().postOnce(verificationRoute, verificationResponse)

    pipe(authenticatePasskey({ tenancyId }), Micro.provideContext(ctx), Micro.runPromise)
  })
})

afterAll(() => {
  fetchMock.unmockGlobal()
})
