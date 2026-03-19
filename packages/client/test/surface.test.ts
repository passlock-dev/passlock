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
} from "../src/index.js"
import * as unsafe from "../src/index.js"
import type {
  AuthenticationError,
  AuthenticationOptions,
  AuthenticationSuccess,
  CredentialMapping,
  DeleteError,
  DeleteSuccess,
  Err,
  Ok,
  PasslockOptions,
  PruningError,
  PruningSuccess,
  RegistrationError,
  RegistrationOptions,
  RegistrationSuccess,
  Result,
  UpdateError,
  UpdatePasskeyOptions,
  UpdateSuccess,
} from "../src/safe.js"
import * as root from "../src/safe.js"

describe("public surface", () => {
  it("exports identical keys for root and unsafe", () => {
    type Root = typeof import("../src/safe.js")
    type Unsafe = typeof import("../src/index.js")
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
    expectTypeOf(root.isOrphanedPasskeyError).toBeFunction()
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
    expectTypeOf(unsafe.isOrphanedPasskeyError).toBeFunction()
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

  it("returns Result envelopes from safe functions", () => {
    type IsEqual<A, B> =
      (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
        ? true
        : false
    type Assert<T extends true> = T
    type _1 = Assert<
      IsEqual<
        Awaited<ReturnType<typeof root.registerPasskey>>,
        Result<RegistrationSuccess, RegistrationError>
      >
    >
    type _2 = Assert<
      IsEqual<
        Awaited<ReturnType<typeof root.authenticatePasskey>>,
        Result<AuthenticationSuccess, AuthenticationError>
      >
    >
    type _3 = Assert<
      IsEqual<
        Awaited<ReturnType<typeof root.updatePasskey>>,
        Result<UpdateSuccess, UpdateError>
      >
    >
    type _4 = Assert<
      IsEqual<
        Awaited<ReturnType<typeof root.deletePasskey>>,
        Result<DeleteSuccess, DeleteError>
      >
    >
    type _5 = Assert<
      IsEqual<
        Awaited<ReturnType<typeof root.prunePasskeys>>,
        Result<PruningSuccess, PruningError>
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
    type DeleteResult = Awaited<ReturnType<typeof root.deletePasskey>>
    type SuccessBranch = Extract<DeleteResult, { success: true }>
    type ErrorBranch = Extract<DeleteResult, { success: false }>

    type _1 = Assert<IsEqual<SuccessBranch, Ok<DeleteSuccess>>>
    type _2 = Assert<IsEqual<ErrorBranch, Err<DeleteError>>>
    type _3 = Assert<IsEqual<SuccessBranch["failure"], false>>
    type _4 = Assert<IsEqual<ErrorBranch["failure"], true>>

    expect(true).toBe(true)
  })
})
