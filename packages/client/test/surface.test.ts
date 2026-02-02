import { describe, expect, expectTypeOf, it } from "vitest"
import type {
  AuthenticationError as UnsafeAuthenticationError,
  AuthenticationOptions as UnsafeAuthenticationOptions,
  AuthenticationSuccess as UnsafeAuthenticationSuccess,
  CredentialMapping as UnsafeCredentialMapping,
  PasslockOptions as UnsafePasslockOptions,
  RegistrationError as UnsafeRegistrationError,
  RegistrationOptions as UnsafeRegistrationOptions,
  RegistrationSuccess as UnsafeRegistrationSuccess,
  UpdatePasskeyOptions as UpdatePasskeyOptionsUnsafe,
} from "../src"
import * as unsafe from "../src"
import type {
  AuthenticationError,
  AuthenticationOptions,
  AuthenticationSuccess,
  CredentialMapping,
  PasslockOptions,
  RegistrationError,
  RegistrationOptions,
  RegistrationSuccess,
  UpdatePasskeyOptions,
} from "../src/safe"
import * as root from "../src/safe"

describe("public surface", () => {
  it("exports identical keys for root and unsafe", () => {
    type Root = typeof import("../src/safe")
    type Unsafe = typeof import("../src")
    type RootKeys = keyof Root
    type UnsafeKeys = keyof Unsafe
    type Assert<T extends true> = T
    type IsNever<T> = [T] extends [never] ? true : false
    type _1 = Assert<IsNever<Exclude<RootKeys, UnsafeKeys>>>
    type _2 = Assert<IsNever<Exclude<UnsafeKeys, RootKeys>>>

    expect(true).toBe(true)
  })

  it("exports shared guards and utilities", () => {
    expectTypeOf(root.isRegistrationSuccess).toBeFunction()
    expectTypeOf(root.isAuthenticationSuccess).toBeFunction()
    expectTypeOf(root.isPasskeyNotFoundError).toBeFunction()
    expectTypeOf(root.isDuplicatePasskeyError).toBeFunction()
    expectTypeOf(root.isPasskeyUnsupportedError).toBeFunction()
    expectTypeOf(root.isOtherPasskeyError).toBeFunction()
    expectTypeOf(root.isDeleteError).toBeFunction()
    expectTypeOf(root.isPruningError).toBeFunction()
    expectTypeOf(root.isUpdateError).toBeFunction()
    expectTypeOf(root.isNetworkError).toBeFunction()
    expectTypeOf(root.isPasskeySupport).toBeFunction()
    expectTypeOf(root.isAutofillSupport).toBeFunction()

    expectTypeOf(unsafe.isRegistrationSuccess).toBeFunction()
    expectTypeOf(unsafe.isAuthenticationSuccess).toBeFunction()
    expectTypeOf(unsafe.isPasskeyNotFoundError).toBeFunction()
    expectTypeOf(unsafe.isDuplicatePasskeyError).toBeFunction()
    expectTypeOf(unsafe.isPasskeyUnsupportedError).toBeFunction()
    expectTypeOf(unsafe.isOtherPasskeyError).toBeFunction()
    expectTypeOf(unsafe.isDeleteError).toBeFunction()
    expectTypeOf(unsafe.isPruningError).toBeFunction()
    expectTypeOf(unsafe.isUpdateError).toBeFunction()
    expectTypeOf(unsafe.isNetworkError).toBeFunction()
    expectTypeOf(unsafe.isPasskeySupport).toBeFunction()
    expectTypeOf(unsafe.isAutofillSupport).toBeFunction()
  })

  it("keeps shared types identical", () => {
    type IsEqual<A, B> =
      (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
        ? true
        : false
    type Assert<T extends true> = T
    type _1 = Assert<IsEqual<PasslockOptions, UnsafePasslockOptions>>
    type _2 = Assert<IsEqual<RegistrationOptions, UnsafeRegistrationOptions>>
    type _3 = Assert<IsEqual<RegistrationSuccess, UnsafeRegistrationSuccess>>
    type _4 = Assert<IsEqual<RegistrationError, UnsafeRegistrationError>>
    type _5 = Assert<
      IsEqual<AuthenticationOptions, UnsafeAuthenticationOptions>
    >
    type _6 = Assert<
      IsEqual<AuthenticationSuccess, UnsafeAuthenticationSuccess>
    >
    type _7 = Assert<IsEqual<AuthenticationError, UnsafeAuthenticationError>>
    type _8 = Assert<IsEqual<UpdatePasskeyOptions, UpdatePasskeyOptionsUnsafe>>
    type _9 = Assert<IsEqual<CredentialMapping, UnsafeCredentialMapping>>

    expect(true).toBe(true)
  })
})
