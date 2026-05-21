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

const assertSafeSurface = (module, label) => {
  for (const name of [
    "Passlock",
    "registerPasskey",
    "authenticatePasskey",
    "updatePasskey",
    "updatePasskeyUsernames",
    "deletePasskey",
    "deleteUserPasskeys",
    "prunePasskeys",
    "isPasskeySupport",
    "isAutofillSupport",
    "isNetworkError",
  ]) {
    assertFunction(module, name, label)
  }
}

const root = await import("../dist/index.js")
const safe = await import("../dist/safe.js")
const unsafe = await import("../dist/unsafe.js")

assertSafeSurface(root, "@passlock/browser")
assertSafeSurface(safe, "@passlock/browser/safe")
assertSafeSurface(unsafe, "@passlock/browser/unsafe")

new root.Passlock({ tenancyId: "smoke-tenancy-id" })
new safe.Passlock({ tenancyId: "smoke-tenancy-id" })
new unsafe.Passlock({ tenancyId: "smoke-tenancy-id" })

console.log(`${runtimeName()} loaded @passlock/browser entrypoints`)
