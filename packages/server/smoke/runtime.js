const runtimeName = () => {
  if ("Deno" in globalThis) return `Deno ${globalThis.Deno.version.deno}`
  if ("Bun" in globalThis) return `Bun ${globalThis.Bun.version}`

  return "JavaScript runtime"
}

const assertFunction = (module, name, label) => {
  if (typeof module[name] !== "function") {
    throw new Error(`${label} expected ${name} to be a function`)
  }
}

const assertServerSurface = (module, label) => {
  for (const name of [
    "Passlock",
    "createTotpAuthenticator",
    "confirmTotpAuthenticator",
    "verifyTotp",
    "getTotpAuthenticator",
    "listTotpAuthenticators",
    "deleteTotpAuthenticator",
    "isTotpAuthenticatorCreated",
    "isTotpAuthenticatorConfirmed",
    "isTotpVerified",
    "isTotpAuthenticator",
    "isPendingTotpAuthenticator",
    "isActiveTotpAuthenticator",
    "isFindAllTotpAuthenticators",
    "isTotpAuthenticatorDeleted",
    "isInvalidTotpCodeError",
    "isTotpCodeAlreadyUsedError",
    "isTotpEnrollmentExpiredError",
    "isTotpAuthenticatorNotActiveError",
    "isTotpAuthenticatorAlreadyActiveError",
    "isTotpAuthenticatorLimitError",
    "isTotpRateLimitedError",

    "createMailboxChallenge",
    "getMailboxChallenge",
    "verifyMailboxChallenge",
    "deleteMailboxChallenge",
    "updatePasskeys",
    "deletePasskeys",
    "prunePasskeys",
    "getPasskey",
    "listPasskeys",
    "exchangeCode",
    "verifyIdToken",
    "isExtendedPrincipal",
    "isPrincipal",
  ]) {
    assertFunction(module, name, label)
  }
}

const originalFetch = globalThis.fetch
let calls = 0
globalThis.fetch = async (_url, init) => {
  calls++
  if (init?.method !== "POST" || init?.redirect !== "error")
    throw new Error("Unexpected TOTP transport")
  return new Response(
    JSON.stringify({
      _tag: "TotpVerified",
      userId: "user-1",
      authenticatorId: "abc123def456ghi",
      verifiedAt: 1,
    }),
    { status: 200 }
  )
}
const root = await import("../dist/index.js")
assertServerSurface(root, "@passlock/server")

new root.Passlock({ apiKey: "smoke-api-key", tenancyId: "smoke-tenancy-id" })

const config = { apiKey: "smoke-api-key", tenancyId: "smoke-tenancy-id" }
const input = { userId: "user-1", authenticatorId: "abc123def456ghi", code: "012345" }
try {
  for (const result of [
    await root.verifyTotp(input, config),
    await new root.Passlock(config).verifyTotp(input),
  ]) {
    if (
      !result.success ||
      result.failure ||
      result.value !== result ||
      !root.isTotpVerified(result)
    )
      throw new Error("Unexpected TOTP Result")
  }
  if (calls !== 2) throw new Error("TOTP requests must not be retried")
} finally {
  globalThis.fetch = originalFetch
}

console.log(`${runtimeName()} loaded @passlock/server entrypoints`)
