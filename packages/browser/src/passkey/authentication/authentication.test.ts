import fetchMock from "@fetch-mock/vitest"
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser"
import { Context, Micro, pipe } from "effect"
import { afterAll, describe, expect, it, vi } from "vitest"
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
    optionsJSON: {},
    sessionToken: "dummySessionToken",
  }

  describe("given a minimal set of options", () => {
    it("should fetch some PublicKeyCredentialCreationOptions", async () => {
      fetchMock.mockGlobal().postOnce(expectedRoute, mockResponse)

      const result = await pipe(
        fetchOptions({ rpId: "localhost" }),
        Micro.provideContext(ctx),
        Micro.runPromise
      )

      expect(result.sessionToken).toBeTruthy()
      expect(result.optionsJSON).toBeTruthy()
    })
  })

  describe("given a list of allowCredentials", () => {
    const allowCredentials = ["dummyCredential"]

    it("should send them to the backend", async () => {
      fetchMock.mockGlobal().postOnce(expectedRoute, mockResponse)

      await pipe(
        fetchOptions({ rpId: "localhost", allowCredentials }),
        Micro.provideContext(ctx),
        Micro.runPromise
      )

      expect(fetchMock).toHavePosted(expectedRoute, {
        body: { allowCredentials, rpId: "localhost" },
      })
    })
  })

  describe("given a userVerification", () => {
    const userVerification = "required" as const

    it("should send it to the backend", async () => {
      fetchMock.mockGlobal().postOnce(expectedRoute, mockResponse)

      await pipe(
        fetchOptions({ rpId: "localhost", userVerification }),
        Micro.provideContext(ctx),
        Micro.runPromise
      )

      expect(fetchMock).toHavePosted(expectedRoute, {
        body: { rpId: "localhost", userVerification },
      })
    })
  })

  describe("given an authenticationToken", () => {
    const authenticationToken = "dummyAuthenticationToken"

    it("should send only the token to the backend", async () => {
      fetchMock.mockGlobal().postOnce(expectedRoute, mockResponse)

      await pipe(fetchOptions({ authenticationToken }), Micro.provideContext(ctx), Micro.runPromise)

      expect(fetchMock).toHavePosted(expectedRoute, {
        body: { authenticationToken },
      })
    })
  })

  it("should invoke the onEvent handler", async () => {
    fetchMock.mockGlobal().postOnce(expectedRoute, mockResponse)

    const onEvent = vi.fn()

    await pipe(
      fetchOptions({ rpId: "localhost", onEvent }),
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
    optionsJSON: {},
    sessionToken: "dummySessionToken",
  }

  const verificationRoute = `${endpoint}/v2/${tenancyId}/passkey/authentication/verification`

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

    await pipe(
      authenticatePasskey({ rpId: "localhost" }, { tenancyId }),
      Micro.provideContext(ctx),
      Micro.runPromise
    )
  })

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

  it("should reject prepared authentication with autofill", async () => {
    const error = await pipe(
      authenticatePasskey(
        { authenticationToken: "dummyAuthenticationToken", autofill: true } as never,
        { tenancyId }
      ),
      Micro.flip,
      Micro.provideContext(ctx),
      Micro.runPromise
    )

    expect(error).toBeInstanceOf(OtherPasskeyError)
  })
})

afterAll(() => {
  fetchMock.unmockGlobal()
})
