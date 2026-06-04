import { describe, expect, expectTypeOf, it } from "vitest"
import type * as Safe from "./safe.js"
import type {
  ChallengeRateLimitedError,
  CreateMailboxChallengeOptions,
  Credential,
  DeletedPasskeys,
  Err,
  ExtendedPrincipal,
  ForbiddenError,
  InvalidChallengeCodeError,
  InvalidCodeError,
  MailboxChallenge,
  MailboxChallengeCreated,
  MailboxChallengeDetails,
  NotFoundError,
  Ok,
  Passkey,
  PasskeyCredential,
  PreparedPasskeyAuthentication,
  PreparedPasskeyRegistration,
  PreparePasskeyAuthenticationOptions,
  PreparePasskeyRegistrationOptions,
  Principal,
  Result,
  VerificationError,
} from "./safe.js"
import {
  type createMailboxChallenge,
  type deleteUserPasskeys,
  type exchangeCode,
  type getMailboxChallenge,
  isChallengeRateLimitedError,
  isExtendedPrincipal,
  isForbiddenError,
  isMailboxChallengeCreated,
  isMailboxChallengeDetails,
  Passlock,
  Passlock as PasslockSafe,
  type verifyIdToken,
  type verifyMailboxChallenge,
} from "./safe.js"
import type {
  AuthenticatedOptions,
  PasslockOptions,
  AuthenticatedOptions as UnsafeAuthenticatedOptions,
  PasslockOptions as UnsafePasslockOptions,
} from "./shared.js"
import type * as Unsafe from "./unsafe.js"
import type {
  CreateMailboxChallengeOptions as UnsafeCreateMailboxChallengeOptions,
  Credential as UnsafeCredential,
  DeletedPasskeys as UnsafeDeletedPasskeys,
  ExtendedPrincipal as UnsafeExtendedPrincipal,
  MailboxChallenge as UnsafeMailboxChallenge,
  MailboxChallengeCreated as UnsafeMailboxChallengeCreated,
  MailboxChallengeDetails as UnsafeMailboxChallengeDetails,
  Passkey as UnsafePasskey,
  PasskeyCredential as UnsafePasskeyCredential,
  PreparedPasskeyAuthentication as UnsafePreparedPasskeyAuthentication,
  PreparedPasskeyRegistration as UnsafePreparedPasskeyRegistration,
  PreparePasskeyAuthenticationOptions as UnsafePreparePasskeyAuthenticationOptions,
  PreparePasskeyRegistrationOptions as UnsafePreparePasskeyRegistrationOptions,
} from "./unsafe.js"
import { Passlock as PasslockUnsafe, Passlock as UnsafePasslock } from "./unsafe.js"

describe("public surface", () => {
  it("exports identical keys for safe and unsafe", () => {
    type Root = typeof import("./safe.js")
    type Unsafe = typeof import("./unsafe.js")
    type RootKeys = keyof Root
    type UnsafeKeys = keyof Unsafe
    type Assert<T extends true> = T
    type IsNever<T> = [T] extends [never] ? true : false
    type _1 = Assert<IsNever<Exclude<RootKeys, UnsafeKeys>>>
    type _2 = Assert<IsNever<Exclude<UnsafeKeys, RootKeys>>>

    expect(true).toBe(true)
  })

  it("exports constructable root client classes", () => {
    const config = { apiKey: "dummyApiKey", tenancyId: "dummyTenancyId" }

    expect(new PasslockSafe(config)).toBeInstanceOf(PasslockSafe)
    expect(new PasslockUnsafe(config)).toBeInstanceOf(PasslockUnsafe)
  })

  it("exports constructable safe and unsafe client classes from subpaths", () => {
    const config = { apiKey: "dummyApiKey", tenancyId: "dummyTenancyId" }

    expect(new Passlock(config)).toBeInstanceOf(Passlock)
    expect(new UnsafePasslock(config)).toBeInstanceOf(UnsafePasslock)
  })

  it("keeps safe client method types aligned with safe functions", () => {
    type IsEqual<A, B> =
      (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
    type Assert<T extends true> = T
    type MethodName =
      | "createMailboxChallenge"
      | "getMailboxChallenge"
      | "verifyMailboxChallenge"
      | "deleteMailboxChallenge"
      | "preparePasskeyAuthentication"
      | "preparePasskeyRegistration"
      | "updatePasskey"
      | "updatePasskeyUsernames"
      | "deletePasskey"
      | "deleteUserPasskeys"
      | "getPasskey"
      | "listPasskeys"
      | "exchangeCode"
      | "verifyIdToken"
    type ParameterChecks = {
      [Name in MethodName]: IsEqual<
        Parameters<Passlock[Name]>,
        [Parameters<(typeof Safe)[Name]>[0]]
      >
    }
    type ReturnChecks = {
      [Name in MethodName]: IsEqual<ReturnType<Passlock[Name]>, ReturnType<(typeof Safe)[Name]>>
    }
    type _1 = Assert<ParameterChecks[MethodName]>
    type _2 = Assert<ReturnChecks[MethodName]>

    expect(true).toBe(true)
  })

  it("keeps unsafe client method types aligned with unsafe functions", () => {
    type IsEqual<A, B> =
      (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
    type Assert<T extends true> = T
    type MethodName =
      | "createMailboxChallenge"
      | "getMailboxChallenge"
      | "verifyMailboxChallenge"
      | "deleteMailboxChallenge"
      | "preparePasskeyAuthentication"
      | "preparePasskeyRegistration"
      | "updatePasskey"
      | "updatePasskeyUsernames"
      | "deletePasskey"
      | "deleteUserPasskeys"
      | "getPasskey"
      | "listPasskeys"
      | "exchangeCode"
      | "verifyIdToken"
    type ParameterChecks = {
      [Name in MethodName]: IsEqual<
        Parameters<UnsafePasslock[Name]>,
        [Parameters<(typeof Unsafe)[Name]>[0]]
      >
    }
    type ReturnChecks = {
      [Name in MethodName]: IsEqual<
        ReturnType<UnsafePasslock[Name]>,
        ReturnType<(typeof Unsafe)[Name]>
      >
    }
    type _1 = Assert<ParameterChecks[MethodName]>
    type _2 = Assert<ReturnChecks[MethodName]>

    expect(true).toBe(true)
  })

  it("exports shared types and guards", () => {
    expectTypeOf(isExtendedPrincipal).toBeFunction()
    expectTypeOf(isForbiddenError).toBeFunction()
    expectTypeOf(isChallengeRateLimitedError).toBeFunction()
    expectTypeOf(isMailboxChallengeCreated).toBeFunction()
    expectTypeOf(isMailboxChallengeDetails).toBeFunction()
  })

  it("keeps shared types identical", () => {
    type IsEqual<A, B> =
      (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
    type Assert<T extends true> = T
    type _1 = Assert<IsEqual<PasslockOptions, UnsafePasslockOptions>>
    type _2 = Assert<IsEqual<AuthenticatedOptions, UnsafeAuthenticatedOptions>>
    type _3 = Assert<IsEqual<ExtendedPrincipal, UnsafeExtendedPrincipal>>
    type _4 = Assert<IsEqual<Passkey, UnsafePasskey>>
    type _5 = Assert<IsEqual<DeletedPasskeys, UnsafeDeletedPasskeys>>
    type _6 = Assert<IsEqual<Credential, UnsafeCredential>>
    type _7 = Assert<IsEqual<PasskeyCredential, UnsafePasskeyCredential>>
    type _8 = Assert<IsEqual<MailboxChallenge, UnsafeMailboxChallenge>>
    type _9 = Assert<IsEqual<CreateMailboxChallengeOptions, UnsafeCreateMailboxChallengeOptions>>
    type _10 = Assert<IsEqual<MailboxChallengeCreated, UnsafeMailboxChallengeCreated>>
    type _11 = Assert<IsEqual<MailboxChallengeDetails, UnsafeMailboxChallengeDetails>>
    type _12 = Assert<IsEqual<PreparedPasskeyRegistration, UnsafePreparedPasskeyRegistration>>
    type _13 = Assert<
      IsEqual<PreparePasskeyRegistrationOptions, UnsafePreparePasskeyRegistrationOptions>
    >
    type _14 = Assert<IsEqual<PreparedPasskeyAuthentication, UnsafePreparedPasskeyAuthentication>>
    type _15 = Assert<
      IsEqual<PreparePasskeyAuthenticationOptions, UnsafePreparePasskeyAuthenticationOptions>
    >

    expect(true).toBe(true)
  })

  it("returns Result envelopes from safe functions", () => {
    type IsEqual<A, B> =
      (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
    type Assert<T extends true> = T
    type _1 = Assert<
      IsEqual<
        Awaited<ReturnType<typeof exchangeCode>>,
        Result<ExtendedPrincipal, ForbiddenError | InvalidCodeError>
      >
    >
    type _2 = Assert<
      IsEqual<Awaited<ReturnType<typeof verifyIdToken>>, Result<Principal, VerificationError>>
    >
    type _3 = Assert<
      IsEqual<
        Awaited<ReturnType<typeof deleteUserPasskeys>>,
        Result<DeletedPasskeys, ForbiddenError | NotFoundError>
      >
    >
    type _4 = Assert<
      IsEqual<
        Awaited<ReturnType<typeof createMailboxChallenge>>,
        Result<MailboxChallengeCreated, ForbiddenError | ChallengeRateLimitedError>
      >
    >
    type _5 = Assert<
      IsEqual<
        Awaited<ReturnType<typeof verifyMailboxChallenge>>,
        Result<
          {
            _tag: "ChallengeVerified"
            challenge: MailboxChallengeDetails
          },
          | ForbiddenError
          | InvalidChallengeCodeError
          | import("./safe.js").InvalidChallengeError
          | import("./safe.js").ChallengeExpiredError
          | import("./safe.js").ChallengeAttemptsExceededError
        >
      >
    >
    type _6 = Assert<
      IsEqual<
        Awaited<ReturnType<typeof getMailboxChallenge>>,
        Result<MailboxChallengeDetails, ForbiddenError | NotFoundError>
      >
    >

    expect(true).toBe(true)
  })

  it("exposes inverse success and failure literals on each Result branch", () => {
    type IsEqual<A, B> =
      (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
    type Assert<T extends true> = T
    type ExchangeCodeResult = Awaited<ReturnType<typeof exchangeCode>>
    type SuccessBranch = Extract<ExchangeCodeResult, { success: true }>
    type ErrorBranch = Extract<ExchangeCodeResult, { success: false }>

    type _1 = Assert<IsEqual<SuccessBranch, Ok<ExtendedPrincipal>>>
    type _2 = Assert<IsEqual<ErrorBranch, Err<ForbiddenError> | Err<InvalidCodeError>>>
    type _3 = Assert<IsEqual<SuccessBranch["failure"], false>>
    type _4 = Assert<IsEqual<ErrorBranch["failure"], true>>

    expect(true).toBe(true)
  })
})
