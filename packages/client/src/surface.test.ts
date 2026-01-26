import type {
  AuthenticationError,
  AuthenticationOptions,
  AuthenticationSuccess,
  CredentialMapping,
  PasslockOptions,
  RegistrationError,
  RegistrationOptions,
  RegistrationSuccess,
  UpdateUserDetails,
} from "./index.js"
import type {
  AuthenticationError as UnsafeAuthenticationError,
  AuthenticationOptions as UnsafeAuthenticationOptions,
  AuthenticationSuccess as UnsafeAuthenticationSuccess,
  CredentialMapping as UnsafeCredentialMapping,
  PasslockOptions as UnsafePasslockOptions,
  RegistrationError as UnsafeRegistrationError,
  RegistrationOptions as UnsafeRegistrationOptions,
  RegistrationSuccess as UnsafeRegistrationSuccess,
  UpdateUserDetails as UnsafeUpdateUserDetails,
} from "./unsafe.js"
import { describe, expect, expectTypeOf, it } from "vitest"
import * as root from "./index.js"
import * as unsafe from "./unsafe.js"

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

  it("exports shared guards and utilities", () => {
    expectTypeOf(root.isRegistrationSuccess).toBeFunction()
    expectTypeOf(root.isAuthenticationSuccess).toBeFunction()
    expectTypeOf(root.isPasskeyNotFound).toBeFunction()
    expectTypeOf(root.isDuplicatePasskey).toBeFunction()
    expectTypeOf(root.isPasskeyUnsupported).toBeFunction()
    expectTypeOf(root.isOtherPasskeyError).toBeFunction()
    expectTypeOf(root.isDeletionError).toBeFunction()
    expectTypeOf(root.isSyncError).toBeFunction()
    expectTypeOf(root.isUpdateError).toBeFunction()
    expectTypeOf(root.isUnexpectedError).toBeFunction()
    expectTypeOf(root.isPasskeySupport).toBeFunction()
    expectTypeOf(root.isAutofillSupport).toBeFunction()

    expectTypeOf(unsafe.isRegistrationSuccess).toBeFunction()
    expectTypeOf(unsafe.isAuthenticationSuccess).toBeFunction()
    expectTypeOf(unsafe.isPasskeyNotFound).toBeFunction()
    expectTypeOf(unsafe.isDuplicatePasskey).toBeFunction()
    expectTypeOf(unsafe.isPasskeyUnsupported).toBeFunction()
    expectTypeOf(unsafe.isOtherPasskeyError).toBeFunction()
    expectTypeOf(unsafe.isDeletionError).toBeFunction()
    expectTypeOf(unsafe.isSyncError).toBeFunction()
    expectTypeOf(unsafe.isUpdateError).toBeFunction()
    expectTypeOf(unsafe.isUnexpectedError).toBeFunction()
    expectTypeOf(unsafe.isPasskeySupport).toBeFunction()
    expectTypeOf(unsafe.isAutofillSupport).toBeFunction()
  })

  it("keeps shared types identical", () => {
    type IsEqual<A, B> =
      (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
    type Assert<T extends true> = T
    type _1 = Assert<IsEqual<PasslockOptions, UnsafePasslockOptions>>
    type _2 = Assert<IsEqual<RegistrationOptions, UnsafeRegistrationOptions>>
    type _3 = Assert<IsEqual<RegistrationSuccess, UnsafeRegistrationSuccess>>
    type _4 = Assert<IsEqual<RegistrationError, UnsafeRegistrationError>>
    type _5 = Assert<IsEqual<AuthenticationOptions, UnsafeAuthenticationOptions>>
    type _6 = Assert<IsEqual<AuthenticationSuccess, UnsafeAuthenticationSuccess>>
    type _7 = Assert<IsEqual<AuthenticationError, UnsafeAuthenticationError>>
    type _8 = Assert<IsEqual<UpdateUserDetails, UnsafeUpdateUserDetails>>
    type _9 = Assert<IsEqual<CredentialMapping, UnsafeCredentialMapping>>

    expect(true).toBe(true)
  })
})
