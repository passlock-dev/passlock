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

const root = await import("../dist/index.js")
assertServerSurface(root, "@passlock/server")

new root.Passlock({ apiKey: "smoke-api-key", tenancyId: "smoke-tenancy-id" })

console.log(`${runtimeName()} loaded @passlock/server entrypoints`)
