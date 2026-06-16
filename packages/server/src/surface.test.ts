import { describe, expect, expectTypeOf, it } from "vitest"
import type * as Root from "./index.js"
import type {
  BadRequestError,
  ChallengeAttemptsExceededError,
  ChallengeExpiredError,
  ChallengeRateLimitedError,
  Err,
  ExtendedPrincipal,
  ForbiddenError,
  InvalidChallengeCodeError,
  InvalidChallengeError,
  InvalidCodeError,
  MailboxChallengeCreated,
  MailboxChallengeDetails,
  NotFoundError,
  Ok,
  PreparedPasskeyDeletion,
  Principal,
  Result,
  VerificationError,
} from "./index.js"
import {
  type createMailboxChallenge,
  type deletePasskeys,
  type exchangeCode,
  type getMailboxChallenge,
  isChallengeRateLimitedError,
  isExtendedPrincipal,
  isForbiddenError,
  isMailboxChallengeCreated,
  isMailboxChallengeDetails,
  Passlock,
  type verifyIdToken,
  type verifyMailboxChallenge,
} from "./index.js"

describe("public surface", () => {
  it("exports a constructable root client class", () => {
    const config = { apiKey: "dummyApiKey", tenancyId: "dummyTenancyId" }

    expect(new Passlock(config)).toBeInstanceOf(Passlock)
  })

  it("keeps root client method types aligned with root functions", () => {
    type IsEqual<A, B> =
      (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
    type Assert<T extends true> = T
    type MethodName =
      | "createMailboxChallenge"
      | "getMailboxChallenge"
      | "verifyMailboxChallenge"
      | "deleteMailboxChallenge"
      | "authorizePasskeyAuthentication"
      | "authorizePasskeyRegistration"
      | "updatePasskeys"
      | "deletePasskeys"
      | "prunePasskeys"
      | "getPasskey"
      | "listPasskeys"
      | "exchangeCode"
      | "verifyIdToken"
    type ParameterChecks = {
      [Name in MethodName]: IsEqual<
        Parameters<Passlock[Name]>,
        [Parameters<(typeof Root)[Name]>[0]]
      >
    }
    type ReturnChecks = {
      [Name in MethodName]: IsEqual<ReturnType<Passlock[Name]>, ReturnType<(typeof Root)[Name]>>
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

  it("returns Result envelopes from root functions", () => {
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
        Awaited<ReturnType<typeof deletePasskeys>>,
        Result<PreparedPasskeyDeletion, BadRequestError | ForbiddenError>
      >
    >
    type _4 = Assert<
      IsEqual<
        Awaited<ReturnType<typeof createMailboxChallenge>>,
        Result<
          MailboxChallengeCreated,
          BadRequestError | ForbiddenError | ChallengeRateLimitedError
        >
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
          | InvalidChallengeError
          | ChallengeExpiredError
          | ChallengeAttemptsExceededError
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
