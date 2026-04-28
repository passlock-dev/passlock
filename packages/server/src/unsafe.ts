/**
 * Promise-based entrypoint for `@passlock/server`. Import from `@passlock/server/unsafe`.
 *
 * Each function resolves with its tagged success payload and rejects with a
 * tagged error payload for expected API failures.
 *
 * Unexpected runtime defects may still throw.
 *
 * ```ts
 * import { exchangeCode } from "@passlock/server/unsafe";
 *
 * try {
 *   const result = await exchangeCode({ code }, { apiKey, tenancyId });
 * } catch (err) {
 *   if (isInvalidCodeError(err)) {
 *     console.log(err.message);
 *   }
 * }
 * ```
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
 * @showCategories
 *
 * @module unsafe
 */

import { Effect, pipe } from "effect"
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
  AssignUserOptions,
  DeletedPasskey,
  DeletedPasskeys,
  DeletePasskeyOptions,
  DeleteUserPasskeysOptions,
  FindAllPasskeys,
  GetPasskeyOptions,
  ListPasskeyOptions,
  Passkey,
  UpdatedCredentials,
  UpdatePasskeyOptions,
  UpdateUsernamesOptions,
} from "./passkey/passkey.js"
import {
  assignUser as assignUserE,
  deletePasskey as deletePasskeyE,
  deleteUserPasskeys as deleteUserPasskeysE,
  getPasskey as getPasskeyE,
  listPasskeys as listPasskeysE,
  updatePasskey as updatePasskeyE,
  updatePasskeyUsernames as updatePasskeyUsernamesE,
} from "./passkey/passkey.js"
import type { ExchangeCodeOptions, VerifyIdTokenOptions } from "./principal/principal.js"
import {
  exchangeCode as exchangeCodeE,
  verifyIdToken as verifyIdTokenE,
} from "./principal/principal.js"
import type { ExtendedPrincipal, Principal } from "./schemas/principal.js"
import type { AuthenticatedOptions, PasslockOptions } from "./shared.js"

/**
 * Configured unsafe Passlock server client.
 *
 * Methods wrap the functions from `@passlock/server/unsafe` and supply the
 * constructor config as each operation's second argument.
 *
 * @category Classes
 */
export class Passlock {
  readonly #config: AuthenticatedOptions

  constructor(config: AuthenticatedOptions) {
    this.#config = { ...config }
  }

  createMailboxChallenge(
    options: Parameters<typeof createMailboxChallenge>[0]
  ): ReturnType<typeof createMailboxChallenge> {
    return createMailboxChallenge(options, this.#config)
  }

  getMailboxChallenge(
    options: Parameters<typeof getMailboxChallenge>[0]
  ): ReturnType<typeof getMailboxChallenge> {
    return getMailboxChallenge(options, this.#config)
  }

  verifyMailboxChallenge(
    options: Parameters<typeof verifyMailboxChallenge>[0]
  ): ReturnType<typeof verifyMailboxChallenge> {
    return verifyMailboxChallenge(options, this.#config)
  }

  deleteMailboxChallenge(
    options: Parameters<typeof deleteMailboxChallenge>[0]
  ): ReturnType<typeof deleteMailboxChallenge> {
    return deleteMailboxChallenge(options, this.#config)
  }

  assignUser(options: Parameters<typeof assignUser>[0]): ReturnType<typeof assignUser> {
    return assignUser(options, this.#config)
  }

  updatePasskey(request: Parameters<typeof updatePasskey>[0]): ReturnType<typeof updatePasskey> {
    return updatePasskey(request, this.#config)
  }

  updatePasskeyUsernames(
    request: Parameters<typeof updatePasskeyUsernames>[0]
  ): ReturnType<typeof updatePasskeyUsernames> {
    return updatePasskeyUsernames(request, this.#config)
  }

  deletePasskey(options: Parameters<typeof deletePasskey>[0]): ReturnType<typeof deletePasskey> {
    return deletePasskey(options, this.#config)
  }

  deleteUserPasskeys(
    request: Parameters<typeof deleteUserPasskeys>[0]
  ): ReturnType<typeof deleteUserPasskeys> {
    return deleteUserPasskeys(request, this.#config)
  }

  getPasskey(options: Parameters<typeof getPasskey>[0]): ReturnType<typeof getPasskey> {
    return getPasskey(options, this.#config)
  }

  listPasskeys(options: Parameters<typeof listPasskeys>[0]): ReturnType<typeof listPasskeys> {
    return listPasskeys(options, this.#config)
  }

  exchangeCode(options: Parameters<typeof exchangeCode>[0]): ReturnType<typeof exchangeCode> {
    return exchangeCode(options, this.#config)
  }

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
 * The returned `challenge` includes the generated `challengeId`, `secret`, and
 * one-time `code`, plus rendered email content in `message.html` and
 * `message.text`.
 *
 * Persist `challengeId` and `secret` so you can call
 * {@link verifyMailboxChallenge} later. Send the provided message content
 * through your own email provider or use the raw `code` to render your own
 * email body.
 *
 * @param options
 * @param config Shared Passlock configuration for the request.
 * @returns A promise resolving to the created mailbox challenge payload.
 * @throws {@link ChallengeRateLimitedError} if mailbox challenge creation has been rate limited
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Mailbox
 */
export const createMailboxChallenge = (
  options: CreateMailboxChallengeOptions,
  config: AuthenticatedOptions
): Promise<MailboxChallengeCreated> =>
  pipe(createMailboxChallengeE(options, config), Effect.runPromise)

/**
 * Fetch a mailbox one-time-code challenge.
 *
 * The returned readable challenge is tagged as `"Challenge"` and excludes the
 * secret and one-time code.
 *
 * @param options
 * @param config Shared Passlock configuration for the request.
 * @returns A promise resolving to the readable challenge payload.
 * @throws {@link NotFoundError} if the challenge does not exist
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Mailbox
 */
export const getMailboxChallenge = (
  options: GetMailboxChallengeOptions,
  config: AuthenticatedOptions
): Promise<MailboxChallengeDetails> =>
  pipe(getMailboxChallengeE(options, config), Effect.runPromise)

/**
 * Verify a mailbox one-time-code challenge.
 *
 * Pass the `challengeId` and `secret` returned by
 * {@link createMailboxChallenge}, together with the one-time code supplied by
 * the end user.
 *
 * @param options
 * @param config Shared Passlock configuration for the request.
 * @returns A promise resolving to a verification payload containing the
 * readable challenge. The verified challenge excludes the secret and code.
 * @throws {@link InvalidChallengeError} if the challenge ID and secret do not identify a valid challenge
 * @throws {@link InvalidChallengeCodeError} if the one-time code is invalid
 * @throws {@link ChallengeExpiredError} if the challenge has expired
 * @throws {@link ChallengeAttemptsExceededError} if the maximum verification attempts have been exceeded
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Mailbox
 */
export const verifyMailboxChallenge = (
  options: VerifyMailboxChallengeOptions,
  config: AuthenticatedOptions
): Promise<MailboxChallengeVerified> =>
  pipe(verifyMailboxChallengeE(options, config), Effect.runPromise)

/**
 * Delete a mailbox one-time-code challenge.
 *
 * @param options
 * @param config Shared Passlock configuration for the request.
 * @returns A promise resolving to the tagged delete payload
 * `{ _tag: "ChallengeDeleted" }`.
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Mailbox
 */
export const deleteMailboxChallenge = (
  options: DeleteMailboxChallengeOptions,
  config: AuthenticatedOptions
): Promise<MailboxChallengeDeleted> =>
  pipe(deleteMailboxChallengeE(options, config), Effect.runPromise)

/**
 * Assign a custom user ID to a passkey.
 *
 * This updates Passlock's server-side mapping for the passkey. It does not
 * change the underlying WebAuthn credential's `userId`.
 *
 * @see {@link Principal}
 * @see {@link ExtendedPrincipal}
 * @see [credential](https://passlock.dev/rest-api/credential/)
 *
 * @param request
 * @param config Shared Passlock configuration for the request.
 * @returns A promise resolving to the updated passkey.
 * @throws {@link NotFoundError} if passkey does not exist
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Passkeys
 */
export const assignUser = (
  request: AssignUserOptions,
  config: AuthenticatedOptions
): Promise<Passkey> => pipe(assignUserE(request, config), Effect.runPromise)

/**
 * Update a passkey's custom user ID and/or username metadata.
 *
 * **Important:** changing the username has no bearing on authentication, as
 * it's typically only used in the client-side component of the passkey
 * (so the user knows which account the passkey relates to).
 *
 * However you might choose to align the username in your vault with the
 * client-side component to simplify end user support.
 *
 * @param request
 * @param config Shared Passlock configuration for the request.
 * @returns A promise resolving to the updated passkey.
 * @throws {@link NotFoundError} if passkey does not exist
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Passkeys
 */
export const updatePasskey = (
  request: UpdatePasskeyOptions,
  config: AuthenticatedOptions
): Promise<Passkey> => pipe(updatePasskeyE(request, config), Effect.runPromise)

/**
 * Update the stored username metadata for all passkeys belonging to a given
 * user, and prepare client-side credential updates for those passkeys.
 *
 * **Important:** changing these values has no bearing on authentication. The
 * server-side operation updates the username stored in Passlock. The optional
 * `displayName` is only included in the returned credential updates for
 * follow-up use with `@passlock/browser`; it is not persisted in the vault.
 *
 * However you might choose to align the username in your vault with the
 * client-side component to simplify end user support.
 *
 * **Note:** This can be used alongside `@passlock/browser`'s
 * `updatePasskeyUsernames` helper to update those details on the user's device.
 *
 * @param request
 * @param config Shared Passlock configuration for the request.
 * @returns A promise resolving to a user-details update payload whose
 * `credentials` array can be passed to the client's
 * `updatePasskeyUsernames` function.
 *
 * @category Passkeys
 */
export const updatePasskeyUsernames = (
  request: UpdateUsernamesOptions,
  config: AuthenticatedOptions
): Promise<UpdatedCredentials> => pipe(updatePasskeyUsernamesE(request, config), Effect.runPromise)

/**
 * Delete a passkey from your vault.
 *
 * **Note:** The user will still retain the passkey on their device so
 * you will need to either:
 *
 * a) Use the `@passlock/browser` functions to delete the passkey from the user's device.
 * b) Remind the user to delete the passkey.
 *
 * See [deleting passkeys](https://passlock.dev/passkeys/passkey-removal/) in the documentation.
 *
 * In addition, during authentication you should handle a missing passkey scenario.
 * This happens when a user tries to authenticate with a passkey that is missing from
 * your vault. The `@passlock/browser` library can help with this. See
 * [handling missing passkeys](https://passlock.dev/handling-missing-passkeys/)
 *
 * @see [deleting passkeys](https://passlock.dev/passkeys/passkey-removal/)
 * @see [handling missing passkeys](https://passlock.dev/handling-missing-passkeys/)
 *
 * @param options
 * @param config Shared Passlock configuration for the request.
 * @returns A promise resolving to the deleted credential identifiers.
 * @throws {@link NotFoundError} if passkey does not exist
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Passkeys
 */
export const deletePasskey = (
  options: DeletePasskeyOptions,
  config: AuthenticatedOptions
): Promise<DeletedPasskey> => pipe(deletePasskeyE(options, config), Effect.runPromise)

/**
 * Delete all passkeys associated with a user.
 *
 * @param request
 * @param config Shared Passlock configuration for the request.
 * @returns A promise resolving to a {@link DeletedPasskeys} payload.
 * Its `deleted` array can be passed directly into `@passlock/browser`'s
 * `deleteUserPasskeys` helper for follow-up client-side passkey removal.
 * @throws {@link NotFoundError} if the user does not exist
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Passkeys
 */
export const deleteUserPasskeys = (
  request: DeleteUserPasskeysOptions,
  config: AuthenticatedOptions
): Promise<DeletedPasskeys> => pipe(deleteUserPasskeysE(request, config), Effect.runPromise)

/**
 * Fetch details about a passkey.
 *
 * **Important:** Not to be confused with the {@link exchangeCode}
 * or {@link verifyIdToken} functions, which return details about
 * specific authentication or registration operations.
 * Use this function for passkey management, not authentication.
 * @param options
 * @param config Shared Passlock configuration for the request.
 * @returns A promise resolving to the passkey.
 * @throws {@link NotFoundError} if passkey does not exist
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Passkeys
 */
export const getPasskey = (
  options: GetPasskeyOptions,
  config: AuthenticatedOptions
): Promise<Passkey> => pipe(getPasskeyE(options, config), Effect.runPromise)

/**
 * List passkeys for the given tenancy. Note: This could return a cursor.
 * If so, call again, passing the cursor back in.
 *
 * @param options
 * @param config Shared Passlock configuration for the request.
 * @returns A promise resolving to a page of passkey summaries.
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Passkeys
 */
export const listPasskeys = (
  options: ListPasskeyOptions,
  config: AuthenticatedOptions
): Promise<FindAllPasskeys> => pipe(listPasskeysE(options, config), Effect.runPromise)

/**
 * The `@passlock/browser` library generates codes, which you will send to
 * your backend for verification.
 *
 * Use this function to exchange the code for details about
 * the registration or authentication operation.
 *
 * During code verification you can also assign a `userId`. This is useful
 * during passkey verification as you can register a passkey on the user's
 * device, verify the passkey is authentic and if so, assign your own `userId`
 * to it.
 *
 * **Note:** a code is valid for 5 minutes.
 *
 * @see {@link ExtendedPrincipal}
 *
 * @param options
 * @param config Shared Passlock configuration for the request.
 * @returns A promise resolving to an extended principal.
 * @throws {@link InvalidCodeError} if the code is invalid or expired
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Principal
 */
export const exchangeCode = (
  options: ExchangeCodeOptions,
  config: AuthenticatedOptions
): Promise<ExtendedPrincipal> => pipe(exchangeCodeE(options, config), Effect.runPromise)

/**
 * Decode and verify an id_token (JWT) locally.
 *
 * **Note:** This will make a network call to
 * `https://api.passlock.dev/.well-known/jwks.json` (or your configured `endpoint`)
 * to fetch the relevant public key. The response will be cached, however
 * bear in mind that for environments such as AWS Lambda it will make the call
 * on each cold start, so it might be slower than {@link exchangeCode}.
 *
 * @see {@link Principal}
 *
 * @param options
 * @param config Shared Passlock configuration for the request.
 * @returns A promise resolving to the verified principal.
 * @throws {@link VerificationError} if token verification fails
 *
 * @category Principal
 */
export const verifyIdToken = (
  options: VerifyIdTokenOptions,
  config: PasslockOptions
): Promise<Principal> => pipe(verifyIdTokenE(options, config), Effect.runPromise)

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
  AssignUserOptions,
  Credential,
  DeletedPasskey,
  DeletedPasskeys,
  DeletePasskeyOptions,
  DeleteUserPasskeysOptions,
  FindAllPasskeys,
  GetPasskeyOptions,
  ListPasskeyOptions,
  Passkey,
  PasskeyCredential,
  PasskeySummary,
  Platform,
  UpdatedCredentials as UpdatedUserDetails,
  UpdatedPasskeys,
  UpdatePasskeyOptions,
  UpdateUsernamesOptions as UpdateUserDetailsOptions,
} from "./passkey/passkey.js"
export {
  isDeletedPasskeys,
  isPasskey,
  isPasskeySummary,
  isUpdatedPasskeys,
  isUpdatedUserDetails,
} from "./passkey/passkey.js"
export type {
  ExchangeCodeOptions,
  VerifyIdTokenOptions,
} from "./principal/principal.js"
export type {
  CredentialDeviceType,
  Transports,
} from "./schemas/passkey.js"
export type { ExtendedPrincipal, Principal } from "./schemas/principal.js"
export { isExtendedPrincipal, isPrincipal } from "./schemas/principal.js"
export type {
  AuthenticatedOptions,
  PasslockOptions,
} from "./shared.js"
