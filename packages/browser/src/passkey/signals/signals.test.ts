import { Micro, pipe } from "effect"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Logger } from "../../logger.js"
import { DeleteError } from "../errors.js"
import { deletePasskeys, prunePasskeys, updatePasskeys } from "./signals.js"

const originalFetch = globalThis.fetch
const originalPublicKeyCredential = globalThis.PublicKeyCredential

const loggerTest = {
  logDebug: () => Micro.void,
  logError: () => Micro.void,
  logInfo: () => Micro.void,
  logWarn: () => Micro.void,
} satisfies typeof Logger.Service

const config = {
  endpoint: "https://example.test",
  tenancyId: "dummyTenancyId",
} as const

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json",
    },
    status,
  })

const setPublicKeyCredential = (value: unknown) => {
  Object.defineProperty(globalThis, "PublicKeyCredential", {
    configurable: true,
    value,
    writable: true,
  })
}

const setFetch = (value: typeof fetch) => {
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    value,
    writable: true,
  })
}

afterEach(() => {
  if (originalPublicKeyCredential === undefined) {
    setPublicKeyCredential(undefined)
  } else {
    setPublicKeyCredential(originalPublicKeyCredential)
  }

  setFetch(originalFetch)
  vi.restoreAllMocks()
})

describe(updatePasskeys.name, () => {
  it("exchanges an update token and signals each instruction", async () => {
    const signalCurrentUserDetails = vi.fn(() => Promise.resolve())
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        jsonResponse({
          _tag: "PasskeyUpdateInstructions",
          instructions: [
            {
              displayName: "New User",
              rpId: "localhost",
              userId: "dummyUserId",
              username: "new@example.com",
            },
          ],
          warnings: [],
        })
      )
    )

    setPublicKeyCredential({ signalCurrentUserDetails })
    setFetch(fetchMock as typeof fetch)

    const result = await pipe(
      updatePasskeys({ updatePasskeysToken: "dummyUpdateToken" }, config),
      Micro.provideService(Logger, loggerTest),
      Micro.runPromise
    )

    expect(result).toEqual({ _tag: "UpdateSuccess", warnings: [] })
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("https://example.test/v2/dummyTenancyId/passkeys/update/exchange"),
      expect.objectContaining({
        body: JSON.stringify({ updatePasskeysToken: "dummyUpdateToken" }),
        method: "post",
      })
    )
    expect(signalCurrentUserDetails).toHaveBeenCalledWith({
      displayName: "New User",
      name: "new@example.com",
      rpId: "localhost",
      userId: "dummyUserId",
    })
  })

  it("returns an unsupported warning without exchanging the token", async () => {
    const fetchMock = vi.fn()

    setPublicKeyCredential(undefined)
    setFetch(fetchMock as typeof fetch)

    const result = await pipe(
      updatePasskeys({ updatePasskeysToken: "dummyUpdateToken" }, config),
      Micro.provideService(Logger, loggerTest),
      Micro.runPromise
    )

    expect(result).toEqual({
      _tag: "UpdateSuccess",
      warnings: [
        {
          code: "BROWSER_SIGNAL_UNSUPPORTED",
          message: "Passkey update not supported on this device",
        },
      ],
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe(deletePasskeys.name, () => {
  it("exchanges a deletion token and signals each instruction", async () => {
    const signalUnknownCredential = vi.fn(() => Promise.resolve())
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        jsonResponse({
          _tag: "PasskeyDeletionInstructions",
          instructions: [
            {
              credentialId: "dummyCredentialId",
              rpId: "localhost",
              userId: "dummyUserId",
            },
          ],
          warnings: [
            {
              code: "PASSKEY_NOT_FOUND",
              message: "Passkey not found",
              passkeyId: "missingPasskeyId",
            },
          ],
        })
      )
    )

    setPublicKeyCredential({ signalUnknownCredential })
    setFetch(fetchMock as typeof fetch)

    const result = await pipe(
      deletePasskeys({ deletePasskeysToken: "dummyDeleteToken" }, config),
      Micro.provideService(Logger, loggerTest),
      Micro.runPromise
    )

    expect(result).toEqual({
      _tag: "DeleteSuccess",
      warnings: [
        {
          code: "PASSKEY_NOT_FOUND",
          message: "Passkey not found",
          passkeyId: "missingPasskeyId",
        },
      ],
    })
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("https://example.test/v2/dummyTenancyId/passkeys/delete/exchange"),
      expect.objectContaining({
        body: JSON.stringify({ deletePasskeysToken: "dummyDeleteToken" }),
        method: "post",
      })
    )
    expect(signalUnknownCredential).toHaveBeenCalledWith({
      credentialId: "dummyCredentialId",
      rpId: "localhost",
      userId: "dummyUserId",
    })
  })

  it("returns an empty payload warning for no-op deletion instructions", async () => {
    const signalUnknownCredential = vi.fn(() => Promise.resolve())
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        jsonResponse({
          _tag: "PasskeyDeletionInstructions",
          instructions: [],
          warnings: [],
        })
      )
    )

    setPublicKeyCredential({ signalUnknownCredential })
    setFetch(fetchMock as typeof fetch)

    const result = await pipe(
      deletePasskeys({ deletePasskeysToken: "dummyDeleteToken" }, config),
      Micro.provideService(Logger, loggerTest),
      Micro.runPromise
    )

    expect(result).toEqual({
      _tag: "DeleteSuccess",
      warnings: [
        {
          code: "EMPTY_SIGNAL_PAYLOAD",
          message: "No passkey deletion instructions were returned",
        },
      ],
    })
    expect(signalUnknownCredential).not.toHaveBeenCalled()
  })

  it("turns signal failures into warnings", async () => {
    const signalUnknownCredential = vi.fn(() => Promise.reject(new Error("signal failed")))
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        jsonResponse({
          _tag: "PasskeyDeletionInstructions",
          instructions: [
            {
              credentialId: "dummyCredentialId",
              rpId: "localhost",
              userId: "dummyUserId",
            },
          ],
          warnings: [],
        })
      )
    )

    setPublicKeyCredential({ signalUnknownCredential })
    setFetch(fetchMock as typeof fetch)

    const result = await pipe(
      deletePasskeys({ deletePasskeysToken: "dummyDeleteToken" }, config),
      Micro.provideService(Logger, loggerTest),
      Micro.runPromise
    )

    expect(result).toEqual({
      _tag: "DeleteSuccess",
      warnings: [
        {
          code: "BROWSER_SIGNAL_FAILED",
          message: "signal failed",
        },
      ],
    })
  })

  it("fails clearly when token exchange fails", async () => {
    const signalUnknownCredential = vi.fn(() => Promise.resolve())
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        jsonResponse(
          {
            _tag: "@error/BadRequest",
            message: "Invalid or expired delete token",
          },
          400
        )
      )
    )

    setPublicKeyCredential({ signalUnknownCredential })
    setFetch(fetchMock as typeof fetch)

    const error = await pipe(
      deletePasskeys({ deletePasskeysToken: "dummyDeleteToken" }, config),
      Micro.flip,
      Micro.provideService(Logger, loggerTest),
      Micro.runPromise
    )

    expect(error).toBeInstanceOf(DeleteError)
    expect(error.code).toEqual("OTHER_ERROR")
    expect(error.message).toEqual("Invalid or expired delete token")
    expect(signalUnknownCredential).not.toHaveBeenCalled()
  })
})

describe(prunePasskeys.name, () => {
  it("exchanges a pruning token and signals each instruction", async () => {
    const signalAllAcceptedCredentials = vi.fn(() => Promise.resolve())
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        jsonResponse({
          _tag: "PasskeyPruningInstructions",
          instructions: [
            {
              allAcceptedCredentialIds: ["dummyCredentialId"],
              rpId: "localhost",
              userId: "dummyUserId",
            },
          ],
          warnings: [],
        })
      )
    )

    setPublicKeyCredential({ signalAllAcceptedCredentials })
    setFetch(fetchMock as typeof fetch)

    const result = await pipe(
      prunePasskeys({ prunePasskeysToken: "dummyPruneToken" }, config),
      Micro.provideService(Logger, loggerTest),
      Micro.runPromise
    )

    expect(result).toEqual({ _tag: "PruningSuccess", warnings: [] })
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("https://example.test/v2/dummyTenancyId/passkeys/prune/exchange"),
      expect.objectContaining({
        body: JSON.stringify({ prunePasskeysToken: "dummyPruneToken" }),
        method: "post",
      })
    )
    expect(signalAllAcceptedCredentials).toHaveBeenCalledWith({
      allAcceptedCredentialIds: ["dummyCredentialId"],
      rpId: "localhost",
      userId: "dummyUserId",
    })
  })
})
