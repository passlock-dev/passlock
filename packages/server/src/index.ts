/**
 * These methods and functions are **_safe_**; they return wrappers over
 * success and error payloads. Use `result.success` or `result.failure`
 * to branch between success and error outcomes.
 *
 * Choose the Passlock client if you prefer a class-based API. Alternatively,
 * import standalone tree-shakeable functions.
 *
 * **Note:** unexpected runtime failures may still throw.
 *
 * @example
 * ```ts
 * // Using the Passlock class
 * import { Passlock } from "@passlock/server";
 *
 * // pass the config to the constructor
 * const passlock = new Passlock({ apiKey, tenancyId });
 *
 * const result = await passlock.exchangeCode({ code });
 *
 * if (result.success) {
 *   console.log(result.value.id);
 * }
 *
 * if (result.failure) {
 *   console.log(result.error.message);
 * }
 * ```
 *
 * @example
 * ```ts
 * // Using the standalone tree-shakeable functions
 * import { exchangeCode } from "@passlock/server";
 *
 * // pass the config as the second argument
 * const result = await exchangeCode({ code }, { apiKey, tenancyId });
 *
 * if (result.success) {
 *   console.log(result.value.id);
 * }
 *
 * if (result.failure) {
 *   console.log(result.error.message);
 * }
 * ```
 * @categoryDescription Clients
 * Class based API. Pass the Passlock config to the constructor.
 *
 * @categoryDescription Authentication
 * Error payloads related to API keys, tenancy access, and token validation.
 *
 * @categoryDescription Common
 * Cross-cutting payloads shared across multiple feature areas.
 *
 * @categoryDescription Configuration
 * Shared Passlock configuration for tenancy scope and API endpoints.
 *
 * @categoryDescription Passkeys
 * Functions and related types for managing passkeys.
 *
 * @categoryDescription Mailbox
 * Functions and related types for managing mailbox one-time-code challenges.
 *
 * @categoryDescription Principal
 * Functions and related types for exchanging browser codes and verifying
 * Passlock tokens.
 *
 * @categoryDescription Validation
 * Error payloads describing invalid request input.
 *
 * @showCategories
 *
 * @module index
 */

import { Effect, pipe } from "effect"
import type {
  BadRequestError,
  ChallengeAttemptsExceededError,
  ChallengeExpiredError,
  ChallengeRateLimitedError,
  ForbiddenError,
  InvalidChallengeCodeError,
  InvalidChallengeError,
  InvalidCodeError,
  NotFoundError,
  VerificationError,
} from "./errors.js"
import type {
  CreateMailboxChallengeOptions,
  DeleteMailboxChallengeOptions,
  GetMailboxChallengeOptions,
  MailboxChallengeCreated,
  MailboxChallengeDeleted,
  MailboxChallengeDetails,
  MailboxChallengeVerified,
  VerifyMailboxChallengeOptions,
} from "./mailbox/mailbox.js"
import {
  createMailboxChallenge as createMailboxChallengeE,
  deleteMailboxChallenge as deleteMailboxChallengeE,
  getMailboxChallenge as getMailboxChallengeE,
  verifyMailboxChallenge as verifyMailboxChallengeE,
} from "./mailbox/mailbox.js"
import type {
  AuthorizedPasskeyAuthentication,
  AuthorizedPasskeyRegistration,
  AuthorizePasskeyAuthenticationOptions,
  AuthorizePasskeyRegistrationOptions,
  DeletePasskeysOptions,
  FindAllPasskeys,
  GetPasskeyOptions,
  ListPasskeyOptions,
  Passkey,
  PreparedPasskeyDeletion,
  PreparedPasskeyPruning,
  PreparedPasskeyUpdate,
  PrunePasskeysOptions,
  UpdatePasskeysOptions,
} from "./passkey/passkey.js"
import {
  authorizePasskeyAuthentication as authorizePasskeyAuthenticationE,
  authorizePasskeyRegistration as authorizePasskeyRegistrationE,
  deletePasskeys as deletePasskeysE,
  getPasskey as getPasskeyE,
  listPasskeys as listPasskeysE,
  prunePasskeys as prunePasskeysE,
  updatePasskeys as updatePasskeysE,
} from "./passkey/passkey.js"
import type { ExchangeCodeOptions, VerifyIdTokenOptions } from "./principal/principal.js"
import {
  exchangeCode as exchangeCodeE,
  verifyIdToken as verifyIdTokenE,
} from "./principal/principal.js"
import { type Result, toErrResult, toOkResult } from "./safe-result.js"
import type { ExtendedPrincipal, Principal } from "./schemas/principal.js"
import type { AuthenticatedOptions, PasslockOptions } from "./shared.js"

const runSafe = <A extends object, E extends object>(
  effect: Effect.Effect<A, E>
): Promise<Result<A, E>> =>
  pipe(
    effect,
    Effect.match({
      onFailure: (error): Result<A, E> => toErrResult(error) as Result<A, E>,
      onSuccess: (value): Result<A, E> => toOkResult(value) as Result<A, E>,
    }),
    Effect.runPromise
  )

/**
 * Safe Passlock server client.
 *
 * Methods return result envelopes over the original success and error payloads.
 * Use `result.success` or `result.failure` to branch between outcomes.
 *
 * @example
 * ```ts
 * import { Passlock } from "@passlock/server";
 *
 * const passlock = new Passlock({ apiKey, tenancyId });
 *
 * const result = await passlock.exchangeCode({ code });
 *
 * if (result.success) {
 *   console.log(result.value.id);
 * }
 *
 * if (result.failure) {
 *   console.log(result.error.message);
 * }
 * ```
 *
 * @category Clients
 */
export class Passlock {
  readonly #config: AuthenticatedOptions

  constructor(config: AuthenticatedOptions) {
    this.#config = { ...config }
  }

  /**
   * Create a mailbox one-time-code challenge.
   *
   * `metadata` is stored as opaque application state. When `invalidateOthers` is
   * `true`, Passlock invalidates other pending challenges for the same purpose,
   * scoped by `userId` when present, otherwise by `email`.
   *
   * The success payload includes the generated `challengeId`, `secret`, and
   * one-time `code`, plus rendered email content in `message.html` and
   * `message.text`.
   *
   * Persist `challengeId` and `secret` so you can call
   * {@link verifyMailboxChallenge} later. Send the provided message content
   * through your own email provider or use the raw `code` to render your own
   * email body.
   *
   * @param options Mailbox challenge-specific request options.
   * @returns A promise resolving to a {@link Result} whose success branch contains
   * the created mailbox challenge payload and whose error branch contains an API error.
   *
   * @category Mailbox
   */
  createMailboxChallenge(
    options: Parameters<typeof createMailboxChallenge>[0]
  ): ReturnType<typeof createMailboxChallenge> {
    return createMailboxChallenge(options, this.#config)
  }

  /**
   * Fetch a mailbox one-time-code challenge.
   *
   * The returned readable challenge is tagged as `"Challenge"` and excludes the
   * secret and one-time code.
   *
   * @param options Mailbox challenge-specific request options.
   * @returns A promise resolving to a {@link Result} whose success branch contains
   * the readable challenge and whose error branch contains an API error.
   *
   * @category Mailbox
   */
  getMailboxChallenge(
    options: Parameters<typeof getMailboxChallenge>[0]
  ): ReturnType<typeof getMailboxChallenge> {
    return getMailboxChallenge(options, this.#config)
  }

  /**
   * Verify a mailbox one-time-code challenge.
   *
   * Pass the `challengeId` and `secret` returned by
   * {@link createMailboxChallenge}, together with the one-time code supplied by
   * the end user.
   *
   * @param options Mailbox challenge-specific request options including the
   * challenge identifier, secret, and code.
   * @returns A promise resolving to a {@link Result} whose success branch contains
   * the verification payload, including the readable challenge, and whose error
   * branch contains an API error. The verified challenge excludes the secret and
   * code.
   *
   * @category Mailbox
   */
  verifyMailboxChallenge(
    options: Parameters<typeof verifyMailboxChallenge>[0]
  ): ReturnType<typeof verifyMailboxChallenge> {
    return verifyMailboxChallenge(options, this.#config)
  }

  /**
   * Delete a mailbox one-time-code challenge.
   *
   * @param options Mailbox challenge-specific request options.
   * @returns A promise resolving to a {@link Result} whose success branch contains
   * the tagged delete payload `{ _tag: "ChallengeDeleted" }` and whose error
   * branch contains an API error.
   *
   * @category Mailbox
   */
  deleteMailboxChallenge(
    options: Parameters<typeof deleteMailboxChallenge>[0]
  ): ReturnType<typeof deleteMailboxChallenge> {
    return deleteMailboxChallenge(options, this.#config)
  }

  /**
   * Authorize a passkey registration.
   *
   * Call this from your backend after deciding the user is allowed to create a
   * passkey and which relying party ID the WebAuthn ceremony should use. Return
   * the resulting `registrationToken` to the browser, then call `registerPasskey`
   * from `@passlock/browser`.
   *
   * The `rpId` supplied by your backend is the RP ID for the authorized ceremony.
   * It does not need to match a separate Passlock tenancy RP ID, but the
   * browser/WebAuthn platform must still allow the current origin to use that RP
   * ID.
   *
   * @param options Authorization options, including the relying party ID,
   * application user ID, username, and optional WebAuthn ceremony settings. Do
   * not include the browser origin; Passlock records the origin when the browser
   * redeems the authorized token.
   * @returns A promise resolving to a {@link Result} whose success branch contains
   * a one-time authorized registration token and whose error branch contains an API error.
   *
   * @category Passkeys
   */
  authorizePasskeyRegistration(
    options: Parameters<typeof authorizePasskeyRegistration>[0]
  ): ReturnType<typeof authorizePasskeyRegistration> {
    return authorizePasskeyRegistration(options, this.#config)
  }

  /**
   * Authorize a passkey authentication.
   *
   * Call this from your backend after deciding the authentication policy. For
   * known-user or re-authentication flows, provide `userId`, `allowCredentials`,
   * or both. For discoverable login, set `discoverable: true`; for autofill,
   * also set `mediation: "conditional"`.
   *
   * The `rpId` supplied by your backend is the RP ID for the authorized ceremony.
   * It does not need to match a separate Passlock tenancy RP ID or related-origin
   * setting, but the browser/WebAuthn platform must still allow the current
   * origin to use that RP ID.
   *
   * Return the resulting `authenticationToken` to the browser, then call
   * `authenticatePasskey` from `@passlock/browser`.
   *
   * @param options Authorization options, including the relying party ID
   * and either account-scoped fields or explicit discoverable authentication. Do
   * not include the browser origin; Passlock records the origin when the browser
   * redeems the authorized token.
   * @returns A promise resolving to a {@link Result} whose success branch contains
   * a one-time authorized authentication token and whose error branch contains an API error.
   *
   * @category Passkeys
   */
  authorizePasskeyAuthentication(
    options: Parameters<typeof authorizePasskeyAuthentication>[0]
  ): ReturnType<typeof authorizePasskeyAuthentication> {
    return authorizePasskeyAuthentication(options, this.#config)
  }

  /**
   * Prepare passkey username and display-name update instructions for a user.
   *
   * This updates the stored username on the user's Passlock passkeys and returns
   * a short-lived token for browser user-detail signalling. The optional display
   * name is snapshotted into the token but is not stored as durable Passlock
   * passkey metadata.
   *
   * Return the resulting `updatePasskeysToken` to the browser, then call
   * `updatePasskeys` from `@passlock/browser`.
   *
   * @param request User-specific update request options.
   * @returns A promise resolving to a {@link Result} whose success branch contains
   * a prepared passkey update token and whose error branch contains an API error.
   *
   * @category Passkeys
   */
  updatePasskeys(request: Parameters<typeof updatePasskeys>[0]): ReturnType<typeof updatePasskeys> {
    return updatePasskeys(request, this.#config)
  }

  /**
   * Prepare passkey deletion instructions by passkey IDs or by user ID.
   *
   * Pass exactly one selector: `passkeyIds` or `userId`. Passlock snapshots the
   * browser signal data before deleting found vault records. Missing passkey IDs
   * and user-scoped no-op deletes are reported as non-fatal warnings.
   *
   * Return the resulting `deletePasskeysToken` to the browser, then call
   * `deletePasskeys` from `@passlock/browser`.
   *
   * @param request Passkey deletion selector options.
   * @returns A promise resolving to a {@link Result} whose success branch contains
   * a prepared passkey deletion token and whose error branch contains an API error.
   *
   * @category Passkeys
   */
  deletePasskeys(request: Parameters<typeof deletePasskeys>[0]): ReturnType<typeof deletePasskeys> {
    return deletePasskeys(request, this.#config)
  }

  /**
   * Prepare passkey pruning instructions for a user.
   *
   * This snapshots the user's currently accepted credentials into a short-lived
   * token for browser accepted-credentials signalling. It does not delete
   * Passlock vault records.
   *
   * Return the resulting `prunePasskeysToken` to the browser, then call
   * `prunePasskeys` from `@passlock/browser`.
   *
   * @param request User-specific prune request options.
   * @returns A promise resolving to a {@link Result} whose success branch contains
   * a prepared passkey pruning token and whose error branch contains an API error.
   *
   * @category Passkeys
   */
  prunePasskeys(request: Parameters<typeof prunePasskeys>[0]): ReturnType<typeof prunePasskeys> {
    return prunePasskeys(request, this.#config)
  }

  /**
   * Fetch details about a passkey.
   *
   * **Important:** Not to be confused with the {@link exchangeCode}
   * or {@link verifyIdToken} functions, which return details about
   * specific authentication or registration operations.
   * Use this function for passkey management, not authentication.
   *
   * @param options Passkey-specific request options.
   * @returns A promise resolving to a {@link Result} whose success branch contains
   * passkey details and whose error branch contains an API error.
   *
   * @category Passkeys
   */
  getPasskey(options: Parameters<typeof getPasskey>[0]): ReturnType<typeof getPasskey> {
    return getPasskey(options, this.#config)
  }

  /**
   * List passkeys for the given tenancy. Note: This could return a cursor.
   * If so, call again, passing the cursor back in.
   *
   * @param options List-specific request options, including an optional pagination cursor.
   * @returns A promise resolving to a {@link Result} whose success branch contains
   * a page of passkey summaries and whose error branch contains an API error.
   *
   * @category Passkeys
   */
  listPasskeys(options: Parameters<typeof listPasskeys>[0]): ReturnType<typeof listPasskeys> {
    return listPasskeys(options, this.#config)
  }

  /**
   * The `@passlock/browser` library generates codes, which you will send to
   * your backend for verification.
   *
   * Use this function to exchange the code for details about
   * the registration or authentication operation.
   *
   * **Note:** a code is valid for 5 minutes.
   *
   * @see {@link ExtendedPrincipal}
   *
   * @param options Code exchange request options.
   * @returns A promise resolving to a {@link Result} whose success branch contains
   * an extended principal and whose error branch contains an API error.
   *
   * @category Principal
   */
  exchangeCode(options: Parameters<typeof exchangeCode>[0]): ReturnType<typeof exchangeCode> {
    return exchangeCode(options, this.#config)
  }

  /**
   * Decode and verify an id_token (JWT) locally.
   *
   * **Note:** This will make a network call to
   * `https://api.passlock.dev/v2/.well-known/jwks.json` (or your configured `endpoint`)
   * to fetch the relevant public key. The response will be cached, however
   * bear in mind that for environments such as AWS Lambda it will make the call
   * on each cold start, so it might be slower than {@link exchangeCode}.
   *
   * @see {@link Principal}
   *
   * @param options ID token verification request options.
   * @returns A promise resolving to a {@link Result} whose success branch contains
   * a verified principal and whose error branch contains a verification error.
   *
   * @category Principal
   */
  verifyIdToken(options: Parameters<typeof verifyIdToken>[0]): ReturnType<typeof verifyIdToken> {
    return verifyIdToken(options, this.#config)
  }
}

/**
 * Create a mailbox one-time-code challenge.
 *
 * `metadata` is stored as opaque application state. When `invalidateOthers` is
 * `true`, Passlock invalidates other pending challenges for the same purpose,
 * scoped by `userId` when present, otherwise by `email`.
 *
 * The success payload includes the generated `challengeId`, `secret`, and
 * one-time `code`, plus rendered email content in `message.html` and
 * `message.text`.
 *
 * Persist `challengeId` and `secret` so you can call
 * {@link verifyMailboxChallenge} later. Send the provided message content
 * through your own email provider or use the raw `code` to render your own
 * email body.
 *
 * @param options Mailbox challenge-specific request options.
 * @param config Shared Passlock configuration for the request.
 * @returns A promise resolving to a {@link Result} whose success branch contains
 * the created mailbox challenge payload and whose error branch contains an API error.
 *
 * @category Mailbox
 */
export const createMailboxChallenge = (
  options: CreateMailboxChallengeOptions,
  config: AuthenticatedOptions
): Promise<Result<MailboxChallengeCreated, ForbiddenError | ChallengeRateLimitedError>> =>
  runSafe(createMailboxChallengeE(options, config))

/**
 * Fetch a mailbox one-time-code challenge.
 *
 * The returned readable challenge is tagged as `"Challenge"` and excludes the
 * secret and one-time code.
 *
 * @param options Mailbox challenge-specific request options.
 * @param config Shared Passlock configuration for the request.
 * @returns A promise resolving to a {@link Result} whose success branch contains
 * the readable challenge and whose error branch contains an API error.
 *
 * @category Mailbox
 */
export const getMailboxChallenge = (
  options: GetMailboxChallengeOptions,
  config: AuthenticatedOptions
): Promise<Result<MailboxChallengeDetails, ForbiddenError | NotFoundError>> =>
  runSafe(getMailboxChallengeE(options, config))

/**
 * Verify a mailbox one-time-code challenge.
 *
 * Pass the `challengeId` and `secret` returned by
 * {@link createMailboxChallenge}, together with the one-time code supplied by
 * the end user.
 *
 * @param options Mailbox challenge-specific request options including the
 * challenge identifier, secret, and code.
 * @param config Shared Passlock configuration for the request.
 * @returns A promise resolving to a {@link Result} whose success branch contains
 * the verification payload, including the readable challenge, and whose error
 * branch contains an API error. The verified challenge excludes the secret and
 * code.
 *
 * @category Mailbox
 */
export const verifyMailboxChallenge = (
  options: VerifyMailboxChallengeOptions,
  config: AuthenticatedOptions
): Promise<
  Result<
    MailboxChallengeVerified,
    | ForbiddenError
    | InvalidChallengeError
    | InvalidChallengeCodeError
    | ChallengeExpiredError
    | ChallengeAttemptsExceededError
  >
> => runSafe(verifyMailboxChallengeE(options, config))

/**
 * Delete a mailbox one-time-code challenge.
 *
 * @param options Mailbox challenge-specific request options.
 * @param config Shared Passlock configuration for the request.
 * @returns A promise resolving to a {@link Result} whose success branch contains
 * the tagged delete payload `{ _tag: "ChallengeDeleted" }` and whose error
 * branch contains an API error.
 *
 * @category Mailbox
 */
export const deleteMailboxChallenge = (
  options: DeleteMailboxChallengeOptions,
  config: AuthenticatedOptions
): Promise<Result<MailboxChallengeDeleted, ForbiddenError>> =>
  runSafe(deleteMailboxChallengeE(options, config))

/**
 * Authorize a passkey registration.
 *
 * Call this from your backend after deciding the user is allowed to create a
 * passkey and which relying party ID the WebAuthn ceremony should use. Return
 * the resulting `registrationToken` to the browser, then call `registerPasskey`
 * from `@passlock/browser`.
 *
 * The `rpId` supplied by your backend is the RP ID for the authorized ceremony.
 * It does not need to match a separate Passlock tenancy RP ID, but the
 * browser/WebAuthn platform must still allow the current origin to use that RP
 * ID.
 *
 * @param options Authorization options, including the relying party ID,
 * application user ID, username, and optional WebAuthn ceremony settings. Do
 * not include the browser origin; Passlock records the origin when the browser
 * redeems the authorized token.
 * @param config Shared Passlock configuration for the request.
 * @returns A promise resolving to a {@link Result} whose success branch contains
 * a one-time authorized registration token and whose error branch contains an API error.
 *
 * @category Passkeys
 */
export const authorizePasskeyRegistration = (
  options: AuthorizePasskeyRegistrationOptions,
  config: AuthenticatedOptions
): Promise<Result<AuthorizedPasskeyRegistration, BadRequestError | ForbiddenError>> =>
  runSafe(authorizePasskeyRegistrationE(options, config))

/**
 * Authorize a passkey authentication.
 *
 * Call this from your backend after deciding the authentication policy. For
 * known-user or re-authentication flows, provide `userId`, `allowCredentials`,
 * or both. For discoverable login, set `discoverable: true`; for autofill,
 * also set `mediation: "conditional"`.
 *
 * The `rpId` supplied by your backend is the RP ID for the authorized ceremony.
 * It does not need to match a separate Passlock tenancy RP ID or related-origin
 * setting, but the browser/WebAuthn platform must still allow the current
 * origin to use that RP ID.
 *
 * Return the resulting `authenticationToken` to the browser, then call
 * `authenticatePasskey` from `@passlock/browser`.
 *
 * @param options Authorization options, including the relying party ID
 * and either account-scoped fields or explicit discoverable authentication. Do
 * not include the browser origin; Passlock records the origin when the browser
 * redeems the authorized token.
 * @param config Shared Passlock configuration for the request.
 * @returns A promise resolving to a {@link Result} whose success branch contains
 * a one-time authorized authentication token and whose error branch contains an API error.
 *
 * @category Passkeys
 */
export const authorizePasskeyAuthentication = (
  options: AuthorizePasskeyAuthenticationOptions,
  config: AuthenticatedOptions
): Promise<Result<AuthorizedPasskeyAuthentication, BadRequestError | ForbiddenError>> =>
  runSafe(authorizePasskeyAuthenticationE(options, config))

/**
 * Prepare passkey username and display-name update instructions for a user.
 *
 * This updates the stored username on the user's Passlock passkeys and returns
 * a short-lived token for browser user-detail signalling. The optional display
 * name is snapshotted into the token but is not stored as durable Passlock
 * passkey metadata.
 *
 * Return the resulting `updatePasskeysToken` to the browser, then call
 * `updatePasskeys` from `@passlock/browser`.
 *
 * @param request User-specific update request options.
 * @param config Shared Passlock configuration for the request.
 * @returns A promise resolving to a {@link Result} whose success branch contains
 * a prepared passkey update token and whose error branch contains an API error.
 *
 * @category Passkeys
 */
export const updatePasskeys = (
  request: UpdatePasskeysOptions,
  config: AuthenticatedOptions
): Promise<Result<PreparedPasskeyUpdate, BadRequestError | ForbiddenError>> =>
  runSafe(updatePasskeysE(request, config))

/**
 * Prepare passkey deletion instructions by passkey IDs or by user ID.
 *
 * Pass exactly one selector: `passkeyIds` or `userId`. Passlock snapshots the
 * browser signal data before deleting found vault records. Missing passkey IDs
 * and user-scoped no-op deletes are reported as non-fatal warnings.
 *
 * Return the resulting `deletePasskeysToken` to the browser, then call
 * `deletePasskeys` from `@passlock/browser`.
 *
 * @param request Passkey deletion selector options.
 * @param config Shared Passlock configuration for the request.
 * @returns A promise resolving to a {@link Result} whose success branch contains
 * a prepared passkey deletion token and whose error branch contains an API error.
 *
 * @category Passkeys
 */
export const deletePasskeys = (
  request: DeletePasskeysOptions,
  config: AuthenticatedOptions
): Promise<Result<PreparedPasskeyDeletion, BadRequestError | ForbiddenError>> =>
  runSafe(deletePasskeysE(request, config))

/**
 * Prepare passkey pruning instructions for a user.
 *
 * This snapshots the user's currently accepted credentials into a short-lived
 * token for browser accepted-credentials signalling. It does not delete
 * Passlock vault records.
 *
 * Return the resulting `prunePasskeysToken` to the browser, then call
 * `prunePasskeys` from `@passlock/browser`.
 *
 * @param request User-specific prune request options.
 * @param config Shared Passlock configuration for the request.
 * @returns A promise resolving to a {@link Result} whose success branch contains
 * a prepared passkey pruning token and whose error branch contains an API error.
 *
 * @category Passkeys
 */
export const prunePasskeys = (
  request: PrunePasskeysOptions,
  config: AuthenticatedOptions
): Promise<Result<PreparedPasskeyPruning, BadRequestError | ForbiddenError>> =>
  runSafe(prunePasskeysE(request, config))

/**
 * Fetch details about a passkey.
 *
 * **Important:** Not to be confused with the {@link exchangeCode}
 * or {@link verifyIdToken} functions, which return details about
 * specific authentication or registration operations.
 * Use this function for passkey management, not authentication.
 *
 * @param options Passkey-specific request options.
 * @param config Shared Passlock configuration for the request.
 * @returns A promise resolving to a {@link Result} whose success branch contains
 * passkey details and whose error branch contains an API error.
 *
 * @category Passkeys
 */
export const getPasskey = (
  options: GetPasskeyOptions,
  config: AuthenticatedOptions
): Promise<Result<Passkey, ForbiddenError | NotFoundError>> => runSafe(getPasskeyE(options, config))

/**
 * List passkeys for the given tenancy. Note: This could return a cursor.
 * If so, call again, passing the cursor back in.
 *
 * @param options List-specific request options, including an optional pagination cursor.
 * @param config Shared Passlock configuration for the request.
 * @returns A promise resolving to a {@link Result} whose success branch contains
 * a page of passkey summaries and whose error branch contains an API error.
 *
 * @category Passkeys
 */
export const listPasskeys = (
  options: ListPasskeyOptions,
  config: AuthenticatedOptions
): Promise<Result<FindAllPasskeys, ForbiddenError>> => runSafe(listPasskeysE(options, config))

/**
 * The `@passlock/browser` library generates codes, which you will send to
 * your backend for verification.
 *
 * Use this function to exchange the code for details about
 * the registration or authentication operation.
 *
 * **Note:** a code is valid for 5 minutes.
 *
 * @see {@link ExtendedPrincipal}
 *
 * @param options Code exchange request options.
 * @param config Shared Passlock configuration for the request.
 * @returns A promise resolving to a {@link Result} whose success branch contains
 * an extended principal and whose error branch contains an API error.
 *
 * @category Principal
 */
export const exchangeCode = (
  options: ExchangeCodeOptions,
  config: AuthenticatedOptions
): Promise<Result<ExtendedPrincipal, ForbiddenError | InvalidCodeError>> =>
  runSafe(exchangeCodeE(options, config))

/**
 * Decode and verify an id_token (JWT) locally.
 *
 * **Note:** This will make a network call to
 * `https://api.passlock.dev/v2/.well-known/jwks.json` (or your configured `endpoint`)
 * to fetch the relevant public key. The response will be cached, however
 * bear in mind that for environments such as AWS Lambda it will make the call
 * on each cold start, so it might be slower than {@link exchangeCode}.
 *
 * @see {@link Principal}
 *
 * @param options ID token verification request options.
 * @param config Shared Passlock configuration for the request.
 * @returns A promise resolving to a {@link Result} whose success branch contains
 * a verified principal and whose error branch contains a verification error.
 *
 * @category Principal
 */
export const verifyIdToken = (
  options: VerifyIdTokenOptions,
  config: PasslockOptions
): Promise<Result<Principal, VerificationError>> => runSafe(verifyIdTokenE(options, config))

/* Re-exports */

export type {
  BadRequestError,
  ChallengeAttemptsExceededError,
  ChallengeExpiredError,
  ChallengeRateLimitedError,
  DuplicateEmailError,
  ForbiddenError,
  InvalidChallengeCodeError,
  InvalidChallengeError,
  InvalidCodeError,
  InvalidEmailError,
  InvalidTenancyError,
  NotFoundError,
  PasskeyNotFoundError,
  UnauthorizedError,
  VerificationError,
} from "./errors.js"
export {
  isBadRequestError,
  isChallengeAttemptsExceededError,
  isChallengeExpiredError,
  isChallengeRateLimitedError,
  isDuplicateEmailError,
  isForbiddenError,
  isInvalidChallengeCodeError,
  isInvalidChallengeError,
  isInvalidCodeError,
  isInvalidEmailError,
  isInvalidTenancyError,
  isNotFoundError,
  isPasskeyNotFoundError,
  isUnauthorizedError,
  isVerificationError,
} from "./errors.js"
export type {
  CreateMailboxChallengeOptions,
  DeleteMailboxChallengeOptions,
  GetMailboxChallengeOptions,
  MailboxChallenge,
  MailboxChallengeCreated,
  MailboxChallengeDeleted,
  MailboxChallengeDetails,
  MailboxChallengeMetadata,
  MailboxChallengeMetadataValue,
  MailboxChallengeVerified,
  VerifyMailboxChallengeOptions,
} from "./mailbox/mailbox.js"
export {
  isMailboxChallenge,
  isMailboxChallengeCreated,
  isMailboxChallengeDeleted,
  isMailboxChallengeDetails,
  isMailboxChallengeVerified,
} from "./mailbox/mailbox.js"
export type {
  AuthorizedPasskeyAuthentication,
  AuthorizedPasskeyRegistration,
  AuthorizePasskeyAuthenticationOptions,
  AuthorizePasskeyRegistrationOptions,
  DeletePasskeysOptions,
  FindAllPasskeys,
  GetPasskeyOptions,
  ListPasskeyOptions,
  Passkey,
  PasskeyCredential,
  PasskeyManagementWarning,
  PasskeySummary,
  Platform,
  PreparedPasskeyDeletion,
  PreparedPasskeyPruning,
  PreparedPasskeyUpdate,
  PrunePasskeysOptions,
  UpdatePasskeysOptions,
} from "./passkey/passkey.js"
export {
  isAuthorizedPasskeyAuthentication,
  isAuthorizedPasskeyRegistration,
  isPasskey,
  isPasskeySummary,
  isPreparedPasskeyDeletion,
  isPreparedPasskeyPruning,
  isPreparedPasskeyUpdate,
} from "./passkey/passkey.js"
export type {
  ExchangeCodeOptions,
  VerifyIdTokenOptions,
} from "./principal/principal.js"
export type { Err, Ok, Result } from "./safe-result.js"
export type {
  CredentialDeviceType,
  PasskeyAuthenticationMediation,
  PasskeyManagementWarningCode,
  Transports,
} from "./schemas/passkey.js"
export type { ExtendedPrincipal, Principal } from "./schemas/principal.js"
export { isExtendedPrincipal, isPrincipal } from "./schemas/principal.js"
export type {
  AuthenticatedOptions,
  PasslockOptions,
} from "./shared.js"
