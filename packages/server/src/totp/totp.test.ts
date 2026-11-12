import { inspect } from "node:util"
import { describe, it } from "@effect/vitest"
import { Effect, Exit, Layer, Result } from "effect"
import { expect, vi } from "vitest"
import { NetworkFetch } from "../network.js"
import * as Totp from "./totp.js"

const id = "abc123def456ghi"
const userId = " User /+?&é "
const cursor = "opaque /+=&?cursor"
const identity = { userId, authenticatorId: id }
const submission = { ...identity, code: "012345" }
const config = {
  tenancyId: "tenancy/ +?&",
  apiKey: "API_KEY_SENTINEL",
  endpoint: "https://custom.example/base",
}
const pending = {
  _tag: "TotpAuthenticator",
  id,
  userId,
  issuer: "Example",
  username: "user@example.com",
  createdAt: 1,
  status: "pending",
  expiresAt: 900001,
  totp: { algorithm: "SHA1", digits: 6, period: 30 },
  verification: { window: 1 },
} as const
const { expiresAt: _, ...details } = pending
const active = { ...details, status: "active", confirmedAt: 2 } as const
const setup = {
  secret: "SECRET_SENTINEL",
  uri: "otpauth://totp/URI_SENTINEL",
  qrCodeDataUrl: "data:image/png;base64,QR_SENTINEL",
}
const createInput = { userId, issuer: "Example", username: "user@example.com" }
const created = { _tag: "TotpAuthenticatorCreated", authenticator: pending, setup } as const
const verified = { _tag: "TotpVerified", ...identity, verifiedAt: 3 } as const
const authErrors = ["Unauthorized", "Forbidden", "BadRequest"]
const cases = [
  {
    name: "create",
    fn: (layer: Layer.Layer<NetworkFetch>) =>
      Totp.createTotpAuthenticator(createInput, config, layer),
    method: "POST",
    path: "/authenticators",
    body: createInput,
    query: {},
    response: created,
    status: 201,
    errors: [...authErrors, "TotpRateLimited", "TotpAuthenticatorLimit"],
  },
  {
    name: "confirm",
    fn: (layer: Layer.Layer<NetworkFetch>) =>
      Totp.confirmTotpAuthenticator(submission, config, layer),
    method: "POST",
    path: `/authenticators/${id}/confirm`,
    body: { userId, code: "012345" },
    query: {},
    response: { _tag: "TotpAuthenticatorConfirmed", authenticator: active },
    status: 200,
    errors: [
      ...authErrors,
      "NotFound",
      "InvalidTotpCode",
      "TotpCodeAlreadyUsed",
      "TotpRateLimited",
      "TotpEnrollmentExpired",
      "TotpAuthenticatorAlreadyActive",
      "TotpAuthenticatorLimit",
    ],
  },
  {
    name: "verify",
    fn: (layer: Layer.Layer<NetworkFetch>) => Totp.verifyTotp(submission, config, layer),
    method: "POST",
    path: "/verify",
    body: submission,
    query: {},
    response: verified,
    status: 200,
    errors: [
      ...authErrors,
      "NotFound",
      "InvalidTotpCode",
      "TotpCodeAlreadyUsed",
      "TotpRateLimited",
      "TotpAuthenticatorNotActive",
    ],
  },
  {
    name: "get",
    fn: (layer: Layer.Layer<NetworkFetch>) => Totp.getTotpAuthenticator(identity, config, layer),
    method: "GET",
    path: `/authenticators/${id}`,
    body: undefined,
    query: { userId },
    response: pending,
    status: 200,
    errors: [...authErrors, "NotFound"],
  },
  {
    name: "list",
    fn: (layer: Layer.Layer<NetworkFetch>) =>
      Totp.listTotpAuthenticators({ userId, cursor }, config, layer),
    method: "GET",
    path: "/authenticators",
    body: undefined,
    query: { userId, cursor },
    response: { _tag: "FindAllTotpAuthenticators", records: [pending, active], cursor },
    status: 200,
    errors: authErrors,
  },
  {
    name: "delete",
    fn: (layer: Layer.Layer<NetworkFetch>) => Totp.deleteTotpAuthenticator(identity, config, layer),
    method: "DELETE",
    path: `/authenticators/${id}`,
    body: undefined,
    query: { userId },
    response: { _tag: "TotpAuthenticatorDeleted" },
    status: 200,
    errors: [...authErrors, "NotFound"],
  },
] as const
const status: Record<string, number> = {
  Unauthorized: 401,
  Forbidden: 403,
  BadRequest: 400,
  NotFound: 404,
  InvalidTotpCode: 400,
  TotpCodeAlreadyUsed: 409,
  TotpRateLimited: 429,
  TotpEnrollmentExpired: 410,
  TotpAuthenticatorNotActive: 409,
  TotpAuthenticatorAlreadyActive: 409,
  TotpAuthenticatorLimit: 409,
}
const failure = (tag: string) => ({
  _tag: `@error/${tag}`,
  message: "Request failed",
  ...(tag === "TotpRateLimited" ? { retryAfterSeconds: 42 } : {}),
  ...(tag === "TotpAuthenticatorLimit" ? { limit: 5, kind: "active" } : {}),
})
const reply = (body: unknown, code = 200) =>
  vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status: code }))
// The operations have different success/error types; their transport contract is shared.
const invoke = (
  operation: (typeof cases)[number],
  fetchImpl: typeof fetch
): Effect.Effect<unknown, unknown> => operation.fn(Layer.succeed(NetworkFetch, fetchImpl))

describe("TOTP transport", () => {
  for (const operation of cases) {
    it.effect(`${operation.name}: exact HTTP request, public response and one network call`, () =>
      Effect.gen(function* () {
        const fetchImpl = reply(
          { ...operation.response, unexpectedInternalField: "discard" },
          operation.status
        )
        const value = yield* invoke(operation, fetchImpl)
        expect(value).toEqual(operation.response)
        expect(fetchImpl).toHaveBeenCalledTimes(1)
        const call = fetchImpl.mock.calls[0]
        if (!call) throw new Error("Expected one request")
        const [rawUrl, init] = call
        const url = new URL(String(rawUrl))
        expect(url.origin).toBe("https://custom.example")
        expect(url.pathname).toBe(
          `/v2/${encodeURIComponent(config.tenancyId)}/totp${operation.path}`
        )
        expect(Object.fromEntries(url.searchParams)).toEqual(operation.query)
        expect(init?.method).toBe(operation.method)
        expect(init?.redirect).toBe("error")
        expect(new Headers(init?.headers).get("authorization")).toBe(`Bearer ${config.apiKey}`)
        expect(init?.body === undefined ? undefined : JSON.parse(String(init.body))).toEqual(
          operation.body
        )
        if (operation.body)
          expect(new Headers(init?.headers).get("content-type")).toBe("application/json")
      })
    )
    for (const tag of operation.errors) {
      it.effect(`${operation.name}: ${tag} is a typed failure`, () =>
        Effect.gen(function* () {
          const payload = failure(tag)
          const fetchImpl = reply(payload, status[tag])
          const result = yield* invoke(operation, fetchImpl).pipe(Effect.result)
          expect(Result.isFailure(result)).toBe(true)
          if (Result.isFailure(result)) expect(result.failure).toMatchObject(payload)
          expect(fetchImpl).toHaveBeenCalledTimes(1)
        })
      )
    }
    for (const code of [500, 503, 413, 302, 307]) {
      it.effect(`${operation.name}: unexpected ${code} throws safely without retrying`, () =>
        Effect.gen(function* () {
          const fetchImpl = reply({ message: "SERVER_SECRET_SENTINEL" }, code)
          const exit = yield* invoke(operation, fetchImpl).pipe(Effect.exit)
          expect(Exit.isFailure(exit)).toBe(true)
          const diagnostic = inspect(exit, { depth: 20 })
          expect(diagnostic).toContain("TOTP request failed")
          expect(diagnostic).not.toContain("SENTINEL")
          expect(diagnostic).not.toContain(userId)
          expect(diagnostic).not.toContain(cursor)
          expect(fetchImpl).toHaveBeenCalledTimes(1)
        })
      )
    }
  }

  it.effect("retains optional settings and leaves defaults to the server", () =>
    Effect.gen(function* () {
      const options = {
        ...createInput,
        displayName: "Work phone",
        totp: { algorithm: "SHA512", digits: 8, period: 60 },
        verification: { window: 0 },
        enrollmentExpiresIn: 1800,
      } as const
      const fetchImpl = reply(created, 201)
      yield* Totp.createTotpAuthenticator(options, config, Layer.succeed(NetworkFetch, fetchImpl))
      expect(JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body))).toEqual(options)
      yield* Totp.createTotpAuthenticator(
        { ...createInput, totp: {}, verification: {} },
        config,
        Layer.succeed(NetworkFetch, fetchImpl)
      )
      expect(JSON.parse(String(fetchImpl.mock.calls[1]?.[1]?.body))).toEqual({
        ...createInput,
        totp: {},
        verification: {},
      })
    })
  )

  it.effect("uses the default endpoint and handles empty final pages", () =>
    Effect.gen(function* () {
      const fetchImpl = reply({ _tag: "FindAllTotpAuthenticators", records: [], cursor: null })
      const result = yield* Totp.listTotpAuthenticators(
        { userId },
        { apiKey: "key", tenancyId: "tenant" },
        Layer.succeed(NetworkFetch, fetchImpl)
      )
      expect(result.records).toEqual([])
      expect(result.cursor).toBeNull()
      expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(
        `https://api.passlock.dev/v2/tenant/totp/authenticators?${new URLSearchParams({ userId })}`
      )
    })
  )

  const malformed = [
    null,
    [],
    {},
    { ...createInput, secret: "INPUT_SENTINEL" },
    { ...createInput, totp: null },
    { ...createInput, displayName: null },
    { ...createInput, userId: " " },
    { ...createInput, userId: "a".repeat(257) },
    { ...createInput, issuer: "a:b" },
    { ...createInput, username: "bad\nlabel" },
    { ...createInput, issuer: "é".repeat(65) },
    { ...createInput, totp: { digits: 7 } },
    { ...createInput, totp: { algorithm: "MD5" } },
    { ...createInput, verification: { window: 2 } },
    { ...createInput, totp: { extra: true } },
    { ...createInput, enrollmentExpiresIn: 299 },
    { ...createInput, enrollmentExpiresIn: 1801 },
    { ...createInput, enrollmentExpiresIn: 900.5 },
  ]
  for (const [index, input] of malformed.entries())
    it.effect(`rejects malformed enrollment input ${index} without network access`, () =>
      Effect.gen(function* () {
        const fetchImpl = reply(created, 201)
        const result = yield* Totp.createTotpAuthenticator(
          input as Totp.CreateTotpAuthenticatorOptions,
          config,
          Layer.succeed(NetworkFetch, fetchImpl)
        ).pipe(Effect.result)
        expect(Result.isFailure(result) && result.failure).toMatchObject({
          _tag: "@error/BadRequest",
          message: "Invalid TOTP request",
        })
        expect(fetchImpl).not.toHaveBeenCalled()
      })
    )

  it.effect("rejects code coercion, extra fields, null cursors and malformed IDs", () =>
    Effect.gen(function* () {
      const fetchImpl = reply(verified)
      const layer = Layer.succeed(NetworkFetch, fetchImpl)
      for (const input of [
        { ...submission, code: 123456 },
        { ...submission, code: "１２３４５６" },
        { ...submission, code: " 012345" },
        { ...submission, code: "12345" },
        { ...submission, timestamp: 1 },
        { ...submission, authenticatorId: "bad/id" },
      ]) {
        const result = yield* Totp.verifyTotp(input as Totp.VerifyTotpOptions, config, layer).pipe(
          Effect.result
        )
        expect(Result.isFailure(result) && result.failure._tag).toBe("@error/BadRequest")
      }
      const result = yield* Totp.listTotpAuthenticators(
        { userId, cursor: null } as unknown as Totp.ListTotpAuthenticatorsOptions,
        config,
        layer
      ).pipe(Effect.result)
      expect(Result.isFailure(result) && result.failure._tag).toBe("@error/BadRequest")
      expect(fetchImpl).not.toHaveBeenCalled()
    })
  )

  it.effect("sanitizes network errors including URLs, credentials and nested causes", () =>
    Effect.gen(function* () {
      const fetchImpl = vi.fn<typeof fetch>(async (url) => {
        throw new Error(`FETCH_SENTINEL ${url} ${config.apiKey}`, { cause: setup })
      })
      const exit = yield* Totp.listTotpAuthenticators(
        { userId, cursor },
        config,
        Layer.succeed(NetworkFetch, fetchImpl)
      ).pipe(Effect.exit)
      const diagnostic = inspect(exit, { depth: 20 })
      expect(Exit.isFailure(exit)).toBe(true)
      expect(diagnostic).toContain("TOTP request failed")
      for (const text of ["SENTINEL", "custom.example", userId, cursor, encodeURIComponent(userId)])
        expect(diagnostic).not.toContain(text)
      expect(fetchImpl).toHaveBeenCalledTimes(1)
    })
  )

  it.effect("rejects unknown routes, malformed payloads and mismatched status/tag pairs", () =>
    Effect.gen(function* () {
      for (const [body, code] of [
        ["", 404],
        ["JSON_SENTINEL", 200],
        [JSON.stringify({ ...verified, verifiedAt: "SCHEMA_SENTINEL" }), 200],
        [JSON.stringify(failure("InvalidTotpCode")), 503],
        [JSON.stringify(failure("TotpCodeAlreadyUsed")), 400],
        [JSON.stringify(failure("TotpEnrollmentExpired")), 410],
        [JSON.stringify({ ...failure("TotpRateLimited"), retryAfterSeconds: 0 }), 429],
      ] as const) {
        const fetchImpl = vi.fn<typeof fetch>(async () => new Response(body, { status: code }))
        const exit = yield* Totp.verifyTotp(
          submission,
          config,
          Layer.succeed(NetworkFetch, fetchImpl)
        ).pipe(Effect.exit)
        expect(Exit.isFailure(exit)).toBe(true)
        expect(inspect(exit, { depth: 20 })).toContain("TOTP request failed")
        expect(inspect(exit, { depth: 20 })).not.toContain("SENTINEL")
        expect(fetchImpl).toHaveBeenCalledTimes(1)
      }
    })
  )

  it.effect("validates lifecycle response fields and omits provisioning material on reads", () =>
    Effect.gen(function* () {
      const fetchImpl = reply({ ...active, lastUsed: 3, secret: "READ_SENTINEL", setup })
      const result = yield* Totp.getTotpAuthenticator(
        identity,
        config,
        Layer.succeed(NetworkFetch, fetchImpl)
      )
      expect(result).toEqual({ ...active, lastUsed: 3 })
      expect(Totp.isActiveTotpAuthenticator(result)).toBe(true)
      expect(Totp.isPendingTotpAuthenticator(result)).toBe(false)
      expect(Totp.isActiveTotpAuthenticator({ ...pending, status: "active" })).toBe(false)
      expect(Totp.isPendingTotpAuthenticator({ ...active, status: "pending" })).toBe(false)
    })
  )
})
