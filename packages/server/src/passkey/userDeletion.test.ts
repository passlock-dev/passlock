import { Effect, Layer, Result } from "effect"
import { describe, expect, it, vi } from "vitest"
import { NetworkFetch } from "../network.js"
import { deleteUser } from "./passkey.js"

const config = { tenancyId: "Tenant /", apiKey: "test-key", endpoint: "https://custom.example" }
const userId = " User /+?&#%;é %2F "

const passkeyDeletionSignals = [
  { rpId: "login.example", credentialId: "YQ" },
  { rpId: "accounts.example", credentialId: "Yg" },
]
const deleted = { _tag: "UserCredentialsDeleted", passkeyDeletionSignals }

describe("user credential deletion", () => {
  it("preserves opaque IDs, authenticates and sends one deletion request", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json(deleted))
    const value = await Effect.runPromise(
      deleteUser({ userId }, config, Layer.succeed(NetworkFetch, fetch))
    )
    expect(value).toEqual(deleted)
    expect(fetch).toHaveBeenCalledTimes(1)
    const call = fetch.mock.calls[0]
    if (!call) throw new Error("Expected a deletion request")
    const [target, init] = call
    const url = new URL(String(target))
    expect(url.pathname).toBe(
      "/v2/Tenant%20%2F/users/%20User%20%2F%2B%3F%26%23%25%3B%C3%A9%20%252F%20"
    )
    expect(url.search).toBe("")
    expect(init?.method?.toLowerCase()).toBe("delete")
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer test-key")
    expect(init?.redirect).toBe("error")
  })

  it("accepts success responses from servers predating device signals", async () => {
    const fetch = vi.fn(async () => Response.json({ _tag: "UserCredentialsDeleted" }))
    const value = await Effect.runPromise(
      deleteUser({ userId }, config, Layer.succeed(NetworkFetch, fetch))
    )
    expect(value.passkeyDeletionSignals).toEqual([])
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
        deleteUser({ userId }, config, Layer.succeed(NetworkFetch, fetch)).pipe(Effect.result)
      )
      expect(Result.isFailure(result)).toBe(true)
      expect(fetch).toHaveBeenCalledTimes(1)
    })
  }

  it.each(["", ".", ".."])(
    "rejects an unusable path segment %j before sending a request",
    async (userId) => {
      const fetch = vi.fn<typeof globalThis.fetch>()
      const result = await Effect.runPromise(
        deleteUser({ userId }, config, Layer.succeed(NetworkFetch, fetch)).pipe(Effect.result)
      )
      expect(Result.isFailure(result)).toBe(true)
      expect(fetch).not.toHaveBeenCalled()
    }
  )

  it("exposes result envelopes through class and standalone APIs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(deleted))
    )
    vi.resetModules()
    try {
      const {
        Passlock,
        deleteUser: deleteSafe,
        deleteUserCredentials,
      } = await import("../index.js")
      const passlock = new Passlock(config)
      for (const result of [
        await deleteSafe({ userId }, config),
        await passlock.deleteUser({ userId }),
        await deleteUserCredentials({ userId }, config),
        await passlock.deleteUserCredentials({ userId }),
      ]) {
        expect(result.success).toBe(true)
        if (result.success) expect(result.value).toEqual(deleted)
      }
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
