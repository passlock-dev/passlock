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
    "updatePasskeys",
    "deletePasskeys",
    "prunePasskeys",
    "isPasskeySupport",
    "isAutofillSupport",
    "isNetworkError",
  ]) {
    assertFunction(module, name, label)
  }
}

const root = await import("../dist/index.js")
assertSafeSurface(root, "@passlock/browser")

new root.Passlock({ tenancyId: "smoke-tenancy-id" })

console.log(`${runtimeName()} loaded @passlock/browser entrypoints`)
