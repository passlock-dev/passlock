import { afterEach, describe, expect, it, vi } from "vitest"

const code = "dummyCode"
const tenancyId = "dummyTenancyId"
const apiKey = "dummyApiKey"
const originalFetch = globalThis.fetch

const principalResponse = {
  _tag: "ExtendedPrincipal",
  id: "dummyAuthenticatorId",
  authenticatorId: "dummyAuthenticatorId",
  authenticatorType: "passkey",
  createdAt: Date.now(),
  expiresAt: Date.now() + 1000,
  passkey: {
    userVerified: true,
    verified: true,
  },
  userId: "dummyUserId",
  metadata: {
    ipAddress: "127.0.0.1",
    userAgent: "Safari",
  },
} as const

afterEach(() => {
  globalThis.fetch = originalFetch
  vi.resetModules()
  vi.restoreAllMocks()
})

describe("safe result envelopes", () => {
  it("decorates successful results without breaking _tag narrowing", async () => {
    globalThis.fetch = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        new Response(JSON.stringify(principalResponse), {
          status: 200,
        })
      )
    )

    const { exchangeCode, isExtendedPrincipal } = await import("./safe.js")
    const result = await exchangeCode({ apiKey, code, tenancyId })

    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error("Expected a successful result")
    }
    expect(result.value).toBe(result)
    expect(result._tag).toEqual("ExtendedPrincipal")
    expect(isExtendedPrincipal(result)).toBe(true)
    expect(result.value.id).toEqual("dummyAuthenticatorId")
    expect(Object.keys(result)).not.toContain("success")
    expect(Object.keys(result)).not.toContain("value")
    expect(JSON.stringify(result)).not.toContain('"success"')
    expect(JSON.stringify(result)).not.toContain('"value"')
  })

  it("decorates expected errors without breaking _tag narrowing", async () => {
    globalThis.fetch = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            _tag: "@error/InvalidCode",
            message: "Code expired",
          }),
          { status: 404 }
        )
      )
    )

    const { exchangeCode, isInvalidCodeError } = await import("./safe.js")
    const result = await exchangeCode({ apiKey, code, tenancyId })

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error("Expected an error result")
    }
    expect(result.error).toBe(result)
    expect(result._tag).toEqual("@error/InvalidCode")
    expect(isInvalidCodeError(result)).toBe(true)
    expect(result.error.message).toEqual("Code expired")
    expect(Object.keys(result)).not.toContain("success")
    expect(Object.keys(result)).not.toContain("error")
    expect(JSON.stringify(result)).not.toContain('"success"')
    expect(JSON.stringify(result)).not.toContain('"error"')
  })
})
