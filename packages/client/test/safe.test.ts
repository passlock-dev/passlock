import { Micro } from "effect"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  deletePasskey,
  isDeleteError,
  isDeleteSuccess,
  Logger,
} from "../src/safe.js"

const originalPublicKeyCredential = globalThis.PublicKeyCredential

const loggerTest = {
  logDebug: () => Micro.void,
  logError: () => Micro.void,
  logInfo: () => Micro.void,
  logWarn: () => Micro.void,
} satisfies typeof Logger.Service

const deleteOptions = {
  credentialId: "dummyCredentialId",
  endpoint: "https://api.passlock.dev",
  rpId: "localhost",
  tenancyId: "dummyTenancyId",
  userId: "dummyUserId",
} as const

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

describe("safe result envelopes", () => {
  it("decorates successful delete results without breaking _tag narrowing", async () => {
    const signalUnknownCredential = vi.fn(() => Promise.resolve())

    setPublicKeyCredential({
      signalUnknownCredential,
    })

    const result = await deletePasskey(deleteOptions, loggerTest)

    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error("Expected a successful result")
    }

    expect(result.value).toBe(result)
    expect(result._tag).toEqual("DeleteSuccess")
    expect(isDeleteSuccess(result)).toBe(true)
    await vi.waitFor(() =>
      expect(signalUnknownCredential).toHaveBeenCalledWith(
        expect.objectContaining({
          credentialId: "dummyCredentialId",
          rpId: "localhost",
          userId: "dummyUserId",
        })
      )
    )
    expect(Object.keys(result)).not.toContain("success")
    expect(Object.keys(result)).not.toContain("value")
    expect(JSON.stringify(result)).not.toContain('"success"')
    expect(JSON.stringify(result)).not.toContain('"value"')
  })

  it("decorates delete errors without breaking _tag narrowing", async () => {
    setPublicKeyCredential(undefined)

    const result = await deletePasskey(deleteOptions, loggerTest)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error("Expected an error result")
    }

    expect(result.error).toBe(result)
    expect(result._tag).toEqual("@error/Delete")
    expect(isDeleteError(result)).toBe(true)
    expect(result.error.code).toEqual("PASSKEY_DELETION_UNSUPPORTED")
    expect(Object.keys(result)).not.toContain("success")
    expect(Object.keys(result)).not.toContain("error")
    expect(JSON.stringify(result)).not.toContain('"success"')
    expect(JSON.stringify(result)).not.toContain('"error"')
  })
})
