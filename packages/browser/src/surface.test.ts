import { describe, expect, expectTypeOf, it } from "vitest"
import type {
  AuthenticationError,
  AuthenticationSuccess,
  DeleteError,
  DeleteSuccess,
  Err,
  Ok,
  PruningError,
  PruningSuccess,
  RegistrationError,
  RegistrationSuccess,
  Result,
  UpdateError,
  UpdateSuccess,
} from "../src/index.js"
import * as root from "../src/index.js"
import { Passlock } from "../src/index.js"

describe("public surface", () => {
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
  })

  it("returns Result envelopes from root functions", () => {
    type IsEqual<A, B> =
      (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
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
      IsEqual<Awaited<ReturnType<typeof root.updatePasskey>>, Result<UpdateSuccess, UpdateError>>
    >
    type _4 = Assert<
      IsEqual<Awaited<ReturnType<typeof root.deletePasskey>>, Result<DeleteSuccess, DeleteError>>
    >
    type _5 = Assert<
      IsEqual<Awaited<ReturnType<typeof root.prunePasskeys>>, Result<PruningSuccess, PruningError>>
    >
    type _6 = Assert<
      IsEqual<
        Awaited<ReturnType<typeof root.deleteUserPasskeys>>,
        Result<DeleteSuccess, DeleteError>
      >
    >

    expect(true).toBe(true)
  })

  it("exposes inverse success and failure literals on each Result branch", () => {
    type IsEqual<A, B> =
      (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
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

  it("exposes the root class client", () => {
    const config = { tenancyId: "tenancy-id" }
    const passlock = new Passlock(config)

    expect(passlock.config).toEqual(config)
    expectTypeOf(passlock.registerPasskey).toBeFunction()
    expectTypeOf(passlock.authenticatePasskey).toBeFunction()
    expectTypeOf(passlock.updatePasskey).toBeFunction()
    expectTypeOf(passlock.updatePasskeyUsernames).toBeFunction()
    expectTypeOf(passlock.deletePasskey).toBeFunction()
    expectTypeOf(passlock.deleteUserPasskeys).toBeFunction()
    expectTypeOf(passlock.prunePasskeys).toBeFunction()
  })

  it("returns Result envelopes from class client methods", () => {
    type IsEqual<A, B> =
      (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
    type Assert<T extends true> = T
    type Client = InstanceType<typeof Passlock>

    type _1 = Assert<
      IsEqual<
        Awaited<ReturnType<Client["registerPasskey"]>>,
        Result<RegistrationSuccess, RegistrationError>
      >
    >
    type _2 = Assert<
      IsEqual<
        Awaited<ReturnType<Client["authenticatePasskey"]>>,
        Result<AuthenticationSuccess, AuthenticationError>
      >
    >

    expect(true).toBe(true)
  })
})
