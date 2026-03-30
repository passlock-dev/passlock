import { afterEach, describe, expect, it, vi } from "vitest"

const code = "dummyCode"
const tenancyId = "dummyTenancyId"
const apiKey = "dummyApiKey"
const challengeId = "dummyChallengeId"
const originalFetch = globalThis.fetch
const readableChallenge = {
  _tag: "Challenge",
  challengeId,
  purpose: "LOGIN_CODE",
  email: "user@example.com",
  metadata: null,
  createdAt: 1,
  expiresAt: 2,
} as const

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
    expect(result.failure).toBe(false)
    if (!result.success) {
      throw new Error("Expected a successful result")
    }
    expect(result.value).toBe(result)
    expect(result._tag).toEqual("ExtendedPrincipal")
    expect(isExtendedPrincipal(result)).toBe(true)
    expect(result.value.id).toEqual("dummyAuthenticatorId")
    expect(Object.keys(result)).not.toContain("success")
    expect(Object.keys(result)).not.toContain("failure")
    expect(Object.keys(result)).not.toContain("value")
    expect(JSON.stringify(result)).not.toContain('"success"')
    expect(JSON.stringify(result)).not.toContain('"failure"')
    expect(JSON.stringify(result)).not.toContain('"value"')
  })

  it("decorates mailbox challenge creation results without breaking _tag narrowing", async () => {
    globalThis.fetch = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            _tag: "ChallengeCreated",
            challenge: {
              challengeId,
              purpose: "LOGIN_CODE",
              email: "user@example.com",
              metadata: null,
              secret: "secret",
              code: "123456",
              createdAt: 1,
              expiresAt: 2,
            },
          }),
          { status: 201 }
        )
      )
    )

    const { createMailboxChallenge, isMailboxChallengeCreated } = await import(
      "./safe.js"
    )
    const result = await createMailboxChallenge({
      apiKey,
      email: "user@example.com",
      purpose: "LOGIN_CODE",
      tenancyId,
    })

    expect(result.success).toBe(true)
    expect(result.failure).toBe(false)
    if (!result.success) {
      throw new Error("Expected a successful result")
    }
    expect(result.value).toBe(result)
    expect(result._tag).toEqual("ChallengeCreated")
    expect(isMailboxChallengeCreated(result)).toBe(true)
    expect(result.challenge.challengeId).toEqual(challengeId)
    expect(Object.keys(result)).not.toContain("success")
    expect(Object.keys(result)).not.toContain("failure")
    expect(Object.keys(result)).not.toContain("value")
  })

  it("decorates mailbox creation rate-limit errors without breaking _tag narrowing", async () => {
    globalThis.fetch = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            _tag: "@error/ChallengeRateLimited",
            message: "Too many challenges requested",
            retryAfterSeconds: 60,
          }),
          { status: 429 }
        )
      )
    )

    const { createMailboxChallenge, isChallengeRateLimitedError } =
      await import("./safe.js")
    const result = await createMailboxChallenge({
      apiKey,
      email: "user@example.com",
      purpose: "LOGIN_CODE",
      tenancyId,
    })

    expect(result.success).toBe(false)
    expect(result.failure).toBe(true)
    if (result.success) {
      throw new Error("Expected an error result")
    }
    expect(result.error).toBe(result)
    expect(result._tag).toEqual("@error/ChallengeRateLimited")
    expect(isChallengeRateLimitedError(result)).toBe(true)
    if (result._tag !== "@error/ChallengeRateLimited") {
      throw new Error("Expected a ChallengeRateLimited error")
    }
    expect(result.message).toEqual("Too many challenges requested")
    expect(result.retryAfterSeconds).toEqual(60)
    expect(Object.keys(result)).not.toContain("success")
    expect(Object.keys(result)).not.toContain("failure")
    expect(Object.keys(result)).not.toContain("error")
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
    expect(result.failure).toBe(true)
    if (result.success) {
      throw new Error("Expected an error result")
    }
    expect(result.error).toBe(result)
    expect(result._tag).toEqual("@error/InvalidCode")
    expect(isInvalidCodeError(result)).toBe(true)
    expect(result.error.message).toEqual("Code expired")
    expect(Object.keys(result)).not.toContain("success")
    expect(Object.keys(result)).not.toContain("failure")
    expect(Object.keys(result)).not.toContain("error")
    expect(JSON.stringify(result)).not.toContain('"success"')
    expect(JSON.stringify(result)).not.toContain('"failure"')
    expect(JSON.stringify(result)).not.toContain('"error"')
  })

  it("decorates mailbox verification errors without breaking _tag narrowing", async () => {
    globalThis.fetch = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            _tag: "@error/InvalidChallengeCode",
            message: "Invalid challenge code",
          }),
          { status: 400 }
        )
      )
    )

    const { isInvalidChallengeCodeError, verifyMailboxChallenge } =
      await import("./safe.js")
    const result = await verifyMailboxChallenge({
      apiKey,
      challengeId,
      code: "000000",
      secret: "secret",
      tenancyId,
    })

    expect(result.success).toBe(false)
    expect(result.failure).toBe(true)
    if (result.success) {
      throw new Error("Expected an error result")
    }
    expect(result.error).toBe(result)
    expect(result._tag).toEqual("@error/InvalidChallengeCode")
    expect(isInvalidChallengeCodeError(result)).toBe(true)
    expect(result.message).toEqual("Invalid challenge code")
    expect(Object.keys(result)).not.toContain("success")
    expect(Object.keys(result)).not.toContain("failure")
    expect(Object.keys(result)).not.toContain("error")
  })

  it("decorates successful mailbox verification results with the tagged readable challenge", async () => {
    globalThis.fetch = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            _tag: "ChallengeVerified",
            challenge: readableChallenge,
          }),
          { status: 200 }
        )
      )
    )

    const { verifyMailboxChallenge } = await import("./safe.js")
    const result = await verifyMailboxChallenge({
      apiKey,
      challengeId,
      code: "123456",
      secret: "secret",
      tenancyId,
    })

    expect(result.success).toBe(true)
    expect(result.failure).toBe(false)
    if (!result.success) {
      throw new Error("Expected a successful result")
    }
    expect(result.value).toBe(result)
    expect(result._tag).toEqual("ChallengeVerified")
    expect(result.challenge).toStrictEqual(readableChallenge)
    expect(result.challenge._tag).toEqual("Challenge")
    expect(Object.keys(result)).not.toContain("success")
    expect(Object.keys(result)).not.toContain("failure")
    expect(Object.keys(result)).not.toContain("value")
  })

  it("decorates mailbox read results without breaking _tag narrowing", async () => {
    globalThis.fetch = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        new Response(JSON.stringify(readableChallenge), {
          status: 200,
        })
      )
    )

    const { getMailboxChallenge, isMailboxChallengeDetails } = await import(
      "./safe.js"
    )
    const result = await getMailboxChallenge({
      apiKey,
      challengeId,
      tenancyId,
    })

    expect(result.success).toBe(true)
    expect(result.failure).toBe(false)
    if (!result.success) {
      throw new Error("Expected a successful result")
    }
    expect(result.value).toBe(result)
    expect(result._tag).toEqual("Challenge")
    expect(isMailboxChallengeDetails(result)).toBe(true)
    expect(result.challengeId).toEqual(challengeId)
    expect(Object.keys(result)).not.toContain("success")
    expect(Object.keys(result)).not.toContain("failure")
    expect(Object.keys(result)).not.toContain("value")
  })

  it("decorates mailbox read not-found errors without breaking _tag narrowing", async () => {
    globalThis.fetch = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            _tag: "@error/NotFound",
            message: "Challenge not found",
          }),
          { status: 404 }
        )
      )
    )

    const { getMailboxChallenge, isNotFoundError } = await import("./safe.js")
    const result = await getMailboxChallenge({
      apiKey,
      challengeId,
      tenancyId,
    })

    expect(result.success).toBe(false)
    expect(result.failure).toBe(true)
    if (result.success) {
      throw new Error("Expected an error result")
    }
    expect(result.error).toBe(result)
    expect(result._tag).toEqual("@error/NotFound")
    expect(isNotFoundError(result)).toBe(true)
    expect(result.message).toEqual("Challenge not found")
    expect(Object.keys(result)).not.toContain("success")
    expect(Object.keys(result)).not.toContain("failure")
    expect(Object.keys(result)).not.toContain("error")
  })
})
