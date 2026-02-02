import { describe, expect, expectTypeOf, it } from "vitest"
import type {
  ExtendedPrincipal as UnsafeExtendedPrincipal,
  Passkey as UnsafePasskey,
} from "./index.js"
import type { ExtendedPrincipal, Passkey } from "./safe.js"
import { isExtendedPrincipal, isForbidden } from "./safe.js"
import type {
  AuthenticatedOptions,
  PasslockOptions,
  AuthenticatedOptions as UnsafeAuthenticatedOptions,
  PasslockOptions as UnsafePasslockOptions,
} from "./shared.js"

describe("public surface", () => {
  it("exports identical keys for root and unsafe", () => {
    type Root = typeof import("./safe.js")
    type Unsafe = typeof import("./index.js")
    type RootKeys = keyof Root
    type UnsafeKeys = keyof Unsafe
    type Assert<T extends true> = T
    type IsNever<T> = [T] extends [never] ? true : false
    type _1 = Assert<IsNever<Exclude<RootKeys, UnsafeKeys>>>
    type _2 = Assert<IsNever<Exclude<UnsafeKeys, RootKeys>>>

    expect(true).toBe(true)
  })

  it("exports shared types and guards", () => {
    expectTypeOf(isExtendedPrincipal).toBeFunction()
    expectTypeOf(isForbidden).toBeFunction()
  })

  it("keeps shared types identical", () => {
    type IsEqual<A, B> =
      (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
        ? true
        : false
    type Assert<T extends true> = T
    type _1 = Assert<IsEqual<PasslockOptions, UnsafePasslockOptions>>
    type _2 = Assert<IsEqual<AuthenticatedOptions, UnsafeAuthenticatedOptions>>
    type _3 = Assert<IsEqual<ExtendedPrincipal, UnsafeExtendedPrincipal>>
    type _4 = Assert<IsEqual<Passkey, UnsafePasskey>>

    expect(true).toBe(true)
  })
})
