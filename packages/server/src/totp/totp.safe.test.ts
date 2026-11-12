import { inspect } from "node:util"
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest"
import type * as Public from "../index.js"

const config = {
  tenancyId: "abc123def456",
  apiKey: "API_KEY_SENTINEL",
  endpoint: "https://custom.example",
}
const id = "abc123def456ghi"
const identity = { userId: "user-1", authenticatorId: id }
const submission = { ...identity, code: "012345" }
const pending = {
  _tag: "TotpAuthenticator",
  id,
  userId: "user-1",
  issuer: "Example",
  username: "user@example.com",
  createdAt: 1,
  status: "pending",
  expiresAt: 900001,
  totp: { algorithm: "SHA1", digits: 6, period: 30 },
  verification: { window: 1 },
} as const
const active = {
  _tag: "TotpAuthenticator",
  id,
  userId: "user-1",
  issuer: "Example",
  username: "user@example.com",
  createdAt: 1,
  status: "active",
  confirmedAt: 2,
  totp: { algorithm: "SHA1", digits: 6, period: 30 },
  verification: { window: 1 },
} as const
const setup = {
  secret: "SETUP_SENTINEL",
  uri: "otpauth://totp/Example:user",
  qrCodeDataUrl: "data:image/png;base64,example",
}
const operations = [
  {
    name: "createTotpAuthenticator",
    input: { userId: "user-1", issuer: "Example", username: "user@example.com" },
    output: { _tag: "TotpAuthenticatorCreated", authenticator: pending, setup },
    guard: "isTotpAuthenticatorCreated",
    status: 201,
  },
  {
    name: "confirmTotpAuthenticator",
    input: submission,
    output: { _tag: "TotpAuthenticatorConfirmed", authenticator: active },
    guard: "isTotpAuthenticatorConfirmed",
    status: 200,
  },
  {
    name: "verifyTotp",
    input: submission,
    output: { _tag: "TotpVerified", ...identity, verifiedAt: 3 },
    guard: "isTotpVerified",
    status: 200,
  },
  {
    name: "getTotpAuthenticator",
    input: identity,
    output: pending,
    guard: "isTotpAuthenticator",
    status: 200,
  },
  {
    name: "listTotpAuthenticators",
    input: { userId: "user-1" },
    output: { _tag: "FindAllTotpAuthenticators", records: [pending, active], cursor: null },
    guard: "isFindAllTotpAuthenticators",
    status: 200,
  },
  {
    name: "deleteTotpAuthenticator",
    input: identity,
    output: { _tag: "TotpAuthenticatorDeleted" },
    guard: "isTotpAuthenticatorDeleted",
    status: 200,
  },
] as const
const load = async (payload: unknown, status: number) => {
  const fetchImpl = vi.fn<typeof fetch>(
    async () => new Response(JSON.stringify(payload), { status })
  )
  vi.stubGlobal("fetch", fetchImpl)
  const sdk = await import("../index.js")
  return { sdk, fetchImpl, client: new sdk.Passlock(config) }
}
afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe("public TOTP SDK", () => {
  for (const operation of operations) {
    it(`${operation.name}: class and standalone preserve successful Result envelopes`, async () => {
      const { sdk, client, fetchImpl } = await load(operation.output, operation.status)
      // Every entry is paired with that operation's own input above.
      const fn = sdk[operation.name] as (
        input: typeof operation.input,
        config: Public.AuthenticatedOptions
      ) => Promise<Public.Result<{ _tag: string }, { _tag: string }>>
      const method = client[operation.name].bind(client) as (
        input: typeof operation.input
      ) => ReturnType<typeof fn>
      for (const result of [await fn(operation.input, config), await method(operation.input)]) {
        expect(result.success).toBe(true)
        expect(result.failure).toBe(false)
        if (result.success) expect(result.value).toBe(result)
        expect(result._tag).toBe(operation.output._tag)
        expect(sdk[operation.guard](result)).toBe(true)
        expect(JSON.parse(JSON.stringify(result))).toEqual(operation.output)
      }
      expect(fetchImpl).toHaveBeenCalledTimes(2)
      expect(fetchImpl.mock.calls[0]).toEqual(fetchImpl.mock.calls[1])
    })
    it(`${operation.name}: preserves 401 and 403 failure envelopes and messages`, async () => {
      const payload = { _tag: "@error/Unauthorized", message: "API key required" }
      const { sdk, client, fetchImpl } = await load(payload, 401)
      const fn = client[operation.name].bind(client) as (
        input: typeof operation.input
      ) => Promise<
        Public.Result<{ _tag: string }, Public.UnauthorizedError | Public.ForbiddenError>
      >
      const unauthorized = await fn(operation.input)
      expect(unauthorized.failure).toBe(true)
      expect(unauthorized.success).toBe(false)
      if (unauthorized.failure) {
        expect(unauthorized.error).toBe(unauthorized)
        expect(unauthorized.error.message).toBe(payload.message)
      }
      expect(sdk.isUnauthorizedError(unauthorized)).toBe(true)
      fetchImpl.mockImplementation(
        async () =>
          new Response(JSON.stringify({ _tag: "@error/Forbidden", message: "Invalid API key" }), {
            status: 403,
          })
      )
      const forbidden = await fn(operation.input)
      expect(forbidden.failure).toBe(true)
      expect(sdk.isForbiddenError(forbidden)).toBe(true)
      expect(fetchImpl).toHaveBeenCalledTimes(2)
    })
  }

  it("exports all new error guards and keeps extra fields on failures", async () => {
    const { sdk, client, fetchImpl } = await load(
      { _tag: "@error/TotpRateLimited", message: "Wait", retryAfterSeconds: 42 },
      429
    )
    const limited = await client.verifyTotp(submission)
    expect(sdk.isTotpRateLimitedError(limited)).toBe(true)
    if (limited.failure && limited._tag === "@error/TotpRateLimited") {
      expect(limited.error.retryAfterSeconds).toBe(42)
      expect(limited.retryAfterSeconds).toBe(42)
    }
    fetchImpl.mockImplementation(
      async () =>
        new Response(
          JSON.stringify({
            _tag: "@error/TotpAuthenticatorLimit",
            message: "Limit",
            limit: 3,
            kind: "pending",
          }),
          { status: 409 }
        )
    )
    const quota = await client.createTotpAuthenticator({
      userId: "user-1",
      issuer: "Example",
      username: "user@example.com",
    })
    expect(sdk.isTotpAuthenticatorLimitError(quota)).toBe(true)
    if (quota.failure && quota._tag === "@error/TotpAuthenticatorLimit")
      expect(quota.error.kind).toBe("pending")
    for (const [guard, tag] of [
      [sdk.isInvalidTotpCodeError, "InvalidTotpCode"],
      [sdk.isTotpCodeAlreadyUsedError, "TotpCodeAlreadyUsed"],
      [sdk.isTotpEnrollmentExpiredError, "TotpEnrollmentExpired"],
      [sdk.isTotpAuthenticatorNotActiveError, "TotpAuthenticatorNotActive"],
      [sdk.isTotpAuthenticatorAlreadyActiveError, "TotpAuthenticatorAlreadyActive"],
      [sdk.isTotpRateLimitedError, "TotpRateLimited"],
      [sdk.isTotpAuthenticatorLimitError, "TotpAuthenticatorLimit"],
    ] as const) {
      expect(
        guard({
          _tag: `@error/${tag}`,
          message: "example",
          retryAfterSeconds: 1,
          limit: 3,
          kind: "pending",
        })
      ).toBe(true)
      expect(guard(null)).toBe(false)
      expect(guard({ _tag: "@error/Other" })).toBe(false)
    }
    expect(sdk.isTotpAuthenticatorDetails(pending)).toBe(true)
    expect(sdk.isPendingTotpAuthenticator(pending)).toBe(true)
    expect(sdk.isActiveTotpAuthenticator(active)).toBe(true)
    expect(sdk.isTotpSetup(setup)).toBe(true)
  })

  it("rejects unexpected failures without leaking values through the Promise boundary", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async (url) => {
        throw new Error(`NETWORK_SENTINEL ${url} API_KEY_SENTINEL`)
      })
    )
    const sdk = await import("../index.js")
    let caught: unknown
    try {
      await new sdk.Passlock(config).listTotpAuthenticators({
        userId: "USER_SENTINEL",
        cursor: "CURSOR_SENTINEL",
      })
    } catch (error) {
      caught = error
    }
    expect(caught).toBeDefined()
    const diagnostic = `${String(caught)} ${inspect(caught, { depth: 20 })} ${JSON.stringify(caught)}`
    expect(diagnostic).toContain("TOTP request failed")
    expect(diagnostic).not.toContain("SENTINEL")
    expect(diagnostic).not.toContain("custom.example")
  })

  it("keeps exact operation error unions and discriminated lifecycle types", () => {
    type Common = Public.UnauthorizedError | Public.ForbiddenError | Public.BadRequestError
    expectTypeOf<Public.CreateTotpAuthenticatorError>().toEqualTypeOf<
      Common | Public.TotpRateLimitedError | Public.TotpAuthenticatorLimitError
    >()
    expectTypeOf<Public.ConfirmTotpAuthenticatorError>().toEqualTypeOf<
      | Common
      | Public.NotFoundError
      | Public.InvalidTotpCodeError
      | Public.TotpCodeAlreadyUsedError
      | Public.TotpRateLimitedError
      | Public.TotpEnrollmentExpiredError
      | Public.TotpAuthenticatorAlreadyActiveError
      | Public.TotpAuthenticatorLimitError
    >()
    expectTypeOf<Public.VerifyTotpError>().toEqualTypeOf<
      | Common
      | Public.NotFoundError
      | Public.InvalidTotpCodeError
      | Public.TotpCodeAlreadyUsedError
      | Public.TotpRateLimitedError
      | Public.TotpAuthenticatorNotActiveError
    >()
    expectTypeOf<Public.GetTotpAuthenticatorError>().toEqualTypeOf<Common | Public.NotFoundError>()
    expectTypeOf<Public.DeleteTotpAuthenticatorError>().toEqualTypeOf<
      Common | Public.NotFoundError
    >()
    expectTypeOf<Public.ListTotpAuthenticatorsError>().toEqualTypeOf<Common>()
    expectTypeOf<Awaited<ReturnType<typeof Public.verifyTotp>>>().toEqualTypeOf<
      Public.Result<Public.TotpVerified, Public.VerifyTotpError>
    >()
    type Active = Extract<Public.TotpAuthenticator, { status: "active" }>
    type Pending = Extract<Public.TotpAuthenticator, { status: "pending" }>
    expectTypeOf<Active>().toEqualTypeOf<Public.ActiveTotpAuthenticator>()
    expectTypeOf<Pending>().toEqualTypeOf<Public.PendingTotpAuthenticator>()
  })
})
