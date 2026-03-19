import { describe, expect, expectTypeOf, it } from "vitest"
import type {
  ExtendedPrincipal as UnsafeExtendedPrincipal,
  Passkey as UnsafePasskey,
} from "./index.js"
import type {
  Err,
  ExtendedPrincipal,
  ForbiddenError,
  InvalidCodeError,
  Ok,
  Passkey,
  Principal,
  Result,
  VerificationError,
} from "./safe.js"
import {
  exchangeCode,
  isExtendedPrincipal,
  isForbiddenError,
  verifyIdToken,
} from "./safe.js"
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
    expectTypeOf(isForbiddenError).toBeFunction()
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

  it("returns Result envelopes from safe functions", () => {
    type IsEqual<A, B> =
      (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
        ? true
        : false
    type Assert<T extends true> = T
    type _1 = Assert<
      IsEqual<
        Awaited<ReturnType<typeof exchangeCode>>,
        Result<ExtendedPrincipal, ForbiddenError | InvalidCodeError>
      >
    >
    type _2 = Assert<
      IsEqual<
        Awaited<ReturnType<typeof verifyIdToken>>,
        Result<Principal, VerificationError>
      >
    >

    expect(true).toBe(true)
  })

  it("exposes inverse success and failure literals on each Result branch", () => {
    type IsEqual<A, B> =
      (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
        ? true
        : false
    type Assert<T extends true> = T
    type ExchangeCodeResult = Awaited<ReturnType<typeof exchangeCode>>
    type SuccessBranch = Extract<ExchangeCodeResult, { success: true }>
    type ErrorBranch = Extract<ExchangeCodeResult, { success: false }>

    type _1 = Assert<IsEqual<SuccessBranch, Ok<ExtendedPrincipal>>>
    type _2 = Assert<
      IsEqual<ErrorBranch, Err<ForbiddenError> | Err<InvalidCodeError>>
    >
    type _3 = Assert<IsEqual<SuccessBranch["failure"], false>>
    type _4 = Assert<IsEqual<ErrorBranch["failure"], true>>

    expect(true).toBe(true)
  })
})
