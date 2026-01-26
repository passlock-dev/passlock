import type { ExchangeCodeOptions, ExtendedPrincipal, Passkey } from "./index.js"
import type {
  ExchangeCodeOptions as UnsafeExchangeCodeOptions,
  ExtendedPrincipal as UnsafeExtendedPrincipal,
  Passkey as UnsafePasskey,
} from "./unsafe.js"
import { describe, expect, expectTypeOf, it } from "vitest"
import { isExtendedPrincipal, isForbidden, VerificationFailure } from "./index.js"

describe("public surface", () => {
  it("exports identical keys for root and unsafe", () => {
    type Root = typeof import("./index.js")
    type Unsafe = typeof import("./unsafe.js")
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

    const err = new VerificationFailure({ message: "test" })
    expect(err.message).toBe("test")
  })

  it("keeps shared types identical", () => {
    type IsEqual<A, B> =
      (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
    type Assert<T extends true> = T
    type _1 = Assert<IsEqual<ExchangeCodeOptions, UnsafeExchangeCodeOptions>>
    type _2 = Assert<IsEqual<ExtendedPrincipal, UnsafeExtendedPrincipal>>
    type _3 = Assert<IsEqual<Passkey, UnsafePasskey>>

    expect(true).toBe(true)
  })
})
