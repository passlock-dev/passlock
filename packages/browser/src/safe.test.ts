import { Micro } from "effect"
import { afterEach, describe, expect, it, vi } from "vitest"
import { deletePasskeys, isDeleteError, isDeleteSuccess, type Logger } from "./index.js"

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

describe("safe result envelopes", () => {
  it("decorates successful delete results without breaking _tag narrowing", async () => {
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
          warnings: [],
        })
      )
    )

    setPublicKeyCredential({ signalUnknownCredential })
    setFetch(fetchMock as typeof fetch)

    const result = await deletePasskeys(
      { deletePasskeysToken: "dummyDeleteToken" },
      config,
      loggerTest
    )

    expect(result.success).toBe(true)
    expect(result.failure).toBe(false)
    if (!result.success) {
      throw new Error("Expected a successful result")
    }

    expect(result.value).toBe(result)
    expect(result._tag).toEqual("DeleteSuccess")
    expect(result.warnings).toEqual([])
    expect(isDeleteSuccess(result)).toBe(true)
    expect(signalUnknownCredential).toHaveBeenCalledWith({
      credentialId: "dummyCredentialId",
      rpId: "localhost",
      userId: "dummyUserId",
    })
    expect(Object.keys(result)).not.toContain("success")
    expect(Object.keys(result)).not.toContain("failure")
    expect(Object.keys(result)).not.toContain("value")
    expect(JSON.stringify(result)).not.toContain('"success"')
    expect(JSON.stringify(result)).not.toContain('"failure"')
    expect(JSON.stringify(result)).not.toContain('"value"')
  })

  it("decorates delete errors without breaking _tag narrowing", async () => {
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

    const result = await deletePasskeys(
      { deletePasskeysToken: "dummyDeleteToken" },
      config,
      loggerTest
    )

    expect(result.success).toBe(false)
    expect(result.failure).toBe(true)
    if (result.success) {
      throw new Error("Expected an error result")
    }

    expect(result.error).toBe(result)
    expect(result._tag).toEqual("@error/Delete")
    expect(isDeleteError(result)).toBe(true)
    expect(result.error.code).toEqual("OTHER_ERROR")
    expect(result.error.message).toEqual("Invalid or expired delete token")
    expect(signalUnknownCredential).not.toHaveBeenCalled()
    expect(Object.keys(result)).not.toContain("success")
    expect(Object.keys(result)).not.toContain("failure")
    expect(Object.keys(result)).not.toContain("error")
    expect(JSON.stringify(result)).not.toContain('"success"')
    expect(JSON.stringify(result)).not.toContain('"failure"')
    expect(JSON.stringify(result)).not.toContain('"error"')
  })
})
