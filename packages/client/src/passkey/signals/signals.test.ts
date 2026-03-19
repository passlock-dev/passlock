import { Micro, pipe } from "effect"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Logger } from "../../logger.js"
import { DeleteError } from "../errors.js"
import { deleteUserPasskeys } from "./signals.js"

const originalPublicKeyCredential = globalThis.PublicKeyCredential

const loggerTest = {
  logDebug: () => Micro.void,
  logError: () => Micro.void,
  logInfo: () => Micro.void,
  logWarn: () => Micro.void,
} satisfies typeof Logger.Service

const deleteCredentials = [
  {
    credentialId: "dummyCredentialId",
    rpId: "localhost",
    userId: "dummyUserId",
  },
  {
    credentialId: "dummyCredentialId2",
    rpId: "localhost",
    userId: "dummyUserId",
  },
] as const

const setPublicKeyCredential = (value: unknown) => {
  Object.defineProperty(globalThis, "PublicKeyCredential", {
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

  vi.restoreAllMocks()
})

describe(deleteUserPasskeys.name, () => {
  it("signals removal for each credential", async () => {
    const signalUnknownCredential = vi.fn(() => Promise.resolve())

    setPublicKeyCredential({
      signalUnknownCredential,
    })

    const result = await pipe(
      deleteUserPasskeys(deleteCredentials),
      Micro.provideService(Logger, loggerTest),
      Micro.runPromise
    )

    expect(result).toEqual({ _tag: "DeleteSuccess" })
    await vi.waitFor(() =>
      expect(signalUnknownCredential).toHaveBeenCalledTimes(2)
    )
    expect(signalUnknownCredential).toHaveBeenNthCalledWith(
      1,
      deleteCredentials[0]
    )
    expect(signalUnknownCredential).toHaveBeenNthCalledWith(
      2,
      deleteCredentials[1]
    )
  })

  it("returns a deletion unsupported error when the device does not support passkey deletion", async () => {
    setPublicKeyCredential(undefined)

    const error = await pipe(
      deleteUserPasskeys(deleteCredentials),
      Micro.flip,
      Micro.provideService(Logger, loggerTest),
      Micro.runPromise
    )

    expect(error).toBeInstanceOf(DeleteError)
    expect(error.code).toEqual("PASSKEY_DELETION_UNSUPPORTED")
  })

  it("treats an empty array as a no-op", async () => {
    const signalUnknownCredential = vi.fn(() => Promise.resolve())

    setPublicKeyCredential({
      signalUnknownCredential,
    })

    const result = await pipe(
      deleteUserPasskeys([]),
      Micro.provideService(Logger, loggerTest),
      Micro.runPromise
    )

    expect(result).toEqual({ _tag: "DeleteSuccess" })
    expect(signalUnknownCredential).not.toHaveBeenCalled()
  })
})
