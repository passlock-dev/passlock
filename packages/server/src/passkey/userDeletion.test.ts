import { Effect, Layer, Result } from "effect"
import { describe, expect, it, vi } from "vitest"
import { NetworkFetch } from "../network.js"
import { deleteUserCredentials } from "./passkey.js"

const config = { tenancyId: "Tenant /", apiKey: "test-key", endpoint: "https://custom.example" }
const userId = " User /+?&é "

describe("user credential deletion", () => {
  it("preserves opaque IDs, authenticates and sends one deletion request", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () =>
      Response.json({ _tag: "UserCredentialsDeleted" })
    )
    const value = await Effect.runPromise(
      deleteUserCredentials({ userId }, config, Layer.succeed(NetworkFetch, fetch))
    )
    expect(value._tag).toBe("UserCredentialsDeleted")
    expect(fetch).toHaveBeenCalledTimes(1)
    const call = fetch.mock.calls[0]
    if (!call) throw new Error("Expected a deletion request")
    const [target, init] = call
    const url = new URL(String(target))
    expect(url.pathname).toBe("/v2/Tenant%20%2F/users/credentials")
    expect(url.searchParams.get("userId")).toBe(userId)
    expect(init?.method?.toLowerCase()).toBe("delete")
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer test-key")
    expect(init?.redirect).toBe("error")
  })

  for (const status of [409, 503]) {
    it(`returns a typed failure for ${status} without retrying`, async () => {
      const fetch = vi.fn<typeof globalThis.fetch>(async () =>
        Response.json(
          { _tag: "@error/UserCredentialsDeletion", message: "Retry later" },
          { status }
        )
      )
      const result = await Effect.runPromise(
        deleteUserCredentials({ userId }, config, Layer.succeed(NetworkFetch, fetch)).pipe(
          Effect.result
        )
      )
      expect(Result.isFailure(result)).toBe(true)
      expect(fetch).toHaveBeenCalledTimes(1)
    })
  }

  it("rejects invalid input before making a network request", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>()
    const result = await Effect.runPromise(
      deleteUserCredentials({ userId: "" }, config, Layer.succeed(NetworkFetch, fetch)).pipe(
        Effect.result
      )
    )
    expect(Result.isFailure(result)).toBe(true)
    expect(fetch).not.toHaveBeenCalled()
  })

  it("exposes result envelopes through class and standalone APIs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ _tag: "UserCredentialsDeleted" }))
    )
    vi.resetModules()
    try {
      const { Passlock, deleteUserCredentials: deleteSafe } = await import("../index.js")
      for (const result of [
        await deleteSafe({ userId }, config),
        await new Passlock(config).deleteUserCredentials({ userId }),
      ]) {
        expect(result.success).toBe(true)
        if (result.success) expect(result.value._tag).toBe("UserCredentialsDeleted")
      }
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
