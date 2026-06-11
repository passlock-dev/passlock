import fetchMock from "@fetch-mock/vitest"
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser"
import { Context, Micro, pipe } from "effect"
import { afterAll, afterEach, describe, expect, it, vi } from "vitest"
import { Endpoint, TenancyId } from "../../internal/index.js"
import { Logger } from "../../logger.js"
import { OrphanedPasskeyError, OtherPasskeyError, PasskeyUnsupportedError } from "../errors.js"
import {
  AuthenticationHelper,
  authenticatePasskey,
  fetchOptions,
  startAuthentication,
  verifyCredential,
} from "./authentication.js"

const loggerTest = {
  logDebug: () => Micro.void,
  logError: () => Micro.void,
  logInfo: () => Micro.void,
  logWarn: () => Micro.void,
} satisfies typeof Logger.Service

afterEach(() => {
  fetchMock.callHistory.clear()
  fetchMock.removeRoutes()
})

describe(fetchOptions.name, () => {
  const endpoint = "https://api.passlock.dev"
  const tenancyId = "dummyTenancyId"

  const ctx = pipe(
    Context.make(Endpoint, { endpoint }),
    Context.add(Logger, loggerTest),
    Context.add(TenancyId, { tenancyId })
  )

  const expectedRoute = `${endpoint}/v2/${tenancyId}/passkey/authentication/options`

  const mockResponse = {
    mediation: "required",
    optionsJSON: {},
    sessionToken: "dummySessionToken",
  } as const

  describe("given an authenticationToken", () => {
    const authenticationToken = "dummyAuthenticationToken"

    it("should send only the token to the backend", async () => {
      fetchMock.mockGlobal().postOnce(expectedRoute, mockResponse)

      const result = await pipe(
        fetchOptions({ authenticationToken }),
        Micro.provideContext(ctx),
        Micro.runPromise
      )

      expect(result).toStrictEqual(mockResponse)

      expect(fetchMock).toHavePosted(expectedRoute, {
        body: { authenticationToken },
      })
    })
  })

  it("should reject browser-started options before making a request", async () => {
    const error = await pipe(
      fetchOptions({ rpId: "localhost" } as never),
      Micro.flip,
      Micro.provideContext(ctx),
      Micro.runPromise
    )

    expect(error).toBeInstanceOf(OtherPasskeyError)
    expect(error.message).toContain("browser-started option")
    expect(fetchMock.callHistory.calls(expectedRoute)).toHaveLength(0)
  })

  it("should invoke the onEvent handler", async () => {
    fetchMock.mockGlobal().postOnce(expectedRoute, mockResponse)

    const onEvent = vi.fn()

    await pipe(
      fetchOptions({ authenticationToken: "dummyAuthenticationToken", onEvent }),
      Micro.provideContext(ctx),
      Micro.runPromise
    )

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

  const expectedRoute = `${endpoint}/v2/${tenancyId}/passkey/authentication/verification`

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

      expect(error).toBeInstanceOf(OrphanedPasskeyError)
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

  const optionsRoute = `${endpoint}/v2/${tenancyId}/passkey/authentication/options`

  const optionsResponse = {
    mediation: "required",
    optionsJSON: {},
    sessionToken: "dummySessionToken",
  } as const

  const verificationRoute = `${endpoint}/v2/${tenancyId}/passkey/authentication/verification`

  const verificationResponse = {
    _tag: "AuthenticationSuccess",
    code: "dummyCode",
    id_token: "dummyIdToken",
    principal: {
      authenticatorId: "dummyPasskeyId",
    },
  }

  it("should authenticate with a prepared authentication token", async () => {
    fetchMock.mockGlobal().postOnce(optionsRoute, optionsResponse)
    fetchMock.mockGlobal().postOnce(verificationRoute, verificationResponse)

    await pipe(
      authenticatePasskey({ authenticationToken: "dummyAuthenticationToken" }, { tenancyId }),
      Micro.provideContext(ctx),
      Micro.runPromise
    )

    expect(fetchMock).toHavePosted(optionsRoute, {
      body: { authenticationToken: "dummyAuthenticationToken" },
    })
  })

  it("should use browser autofill when the options response requests conditional mediation", async () => {
    const startAuthentication = vi.fn(() => Promise.resolve({} as AuthenticationResponseJSON))
    const conditionalAuthenticationHelperTest = {
      browserSupportsWebAuthn: () => true,
      startAuthentication,
    } satisfies typeof AuthenticationHelper.Service

    fetchMock.mockGlobal().postOnce(optionsRoute, {
      ...optionsResponse,
      mediation: "conditional",
    })
    fetchMock.mockGlobal().postOnce(verificationRoute, verificationResponse)

    await pipe(
      authenticatePasskey({ authenticationToken: "dummyAuthenticationToken" }, { tenancyId }),
      Micro.provideService(AuthenticationHelper, conditionalAuthenticationHelperTest),
      Micro.provideContext(ctx),
      Micro.runPromise
    )

    expect(startAuthentication).toHaveBeenCalledWith({
      optionsJSON: {},
      useBrowserAutofill: true,
    })
  })

  it("should reject browser-started options before making a request", async () => {
    const error = await pipe(
      authenticatePasskey({ rpId: "localhost" } as never, { tenancyId }),
      Micro.flip,
      Micro.provideContext(ctx),
      Micro.runPromise
    )

    expect(error).toBeInstanceOf(OtherPasskeyError)
    expect(error.message).toContain("browser-started option")
    expect(fetchMock.callHistory.calls(optionsRoute)).toHaveLength(0)
  })
})

afterAll(() => {
  fetchMock.unmockGlobal()
})
