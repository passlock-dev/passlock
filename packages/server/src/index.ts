/**
 * Default Promise-based entrypoint for `@passlock/server`.
 *
 * Each function resolves with its tagged success payload and rejects with a
 * tagged error payload for expected API failures.
 *
 * Unexpected runtime defects may still throw.
 *
 * @categoryDescription Mailbox
 * Functions and related types for managing mailbox one-time-code challenges.
 *
 * @categoryDescription Passkeys
 * Functions and related types for managing passkeys.
 *
 * @categoryDescription Principal
 * Functions and related types for exchanging client codes and verifying
 * Passlock tokens.
 *
 * @showCategories
 *
 * @module server
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
 * @returns A promise resolving to the created mailbox challenge payload.
 * @throws {@link ChallengeRateLimitedError} if mailbox challenge creation has been rate limited
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Mailbox
 */
export const createMailboxChallenge = (
  options: CreateMailboxChallengeOptions
): Promise<MailboxChallengeCreated> => pipe(createMailboxChallengeE(options), Effect.runPromise)

/**
 * Fetch a mailbox one-time-code challenge.
 *
 * The returned readable challenge is tagged as `"Challenge"` and excludes the
 * secret and one-time code.
 *
 * @param options
 * @returns A promise resolving to the readable challenge payload.
 * @throws {@link NotFoundError} if the challenge does not exist
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Mailbox
 */
export const getMailboxChallenge = (
  options: GetMailboxChallengeOptions
): Promise<MailboxChallengeDetails> => pipe(getMailboxChallengeE(options), Effect.runPromise)

/**
 * Verify a mailbox one-time-code challenge.
 *
 * Pass the `challengeId` and `secret` returned by
 * {@link createMailboxChallenge}, together with the one-time code supplied by
 * the end user.
 *
 * @param options
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
  options: VerifyMailboxChallengeOptions
): Promise<MailboxChallengeVerified> => pipe(verifyMailboxChallengeE(options), Effect.runPromise)

/**
 * Delete a mailbox one-time-code challenge.
 *
 * @param options
 * @returns A promise resolving to the tagged delete payload
 * `{ _tag: "ChallengeDeleted" }`.
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Mailbox
 */
export const deleteMailboxChallenge = (
  options: DeleteMailboxChallengeOptions
): Promise<MailboxChallengeDeleted> => pipe(deleteMailboxChallengeE(options), Effect.runPromise)

/**
 * Assign a custom user ID to a passkey in the Passlock vault.
 *
 * This updates Passlock's server-side mapping for the passkey. It does not
 * change the underlying WebAuthn credential's `userId`.
 *
 * @param request
 * @returns A promise resolving to the updated passkey.
 * @throws {@link NotFoundError} if passkey does not exist
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Passkeys
 */
export const assignUser = (request: AssignUserOptions): Promise<Passkey> =>
  pipe(assignUserE(request), Effect.runPromise)

/**
 * Update a passkey's custom user ID and/or username metadata.
 *
 * Updating the username only affects the metadata stored in the vault. It does
 * not affect whether the passkey can be used for authentication.
 *
 * @param request
 * @returns A promise resolving to the updated passkey.
 * @throws {@link NotFoundError} if passkey does not exist
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Passkeys
 */
export const updatePasskey = (request: UpdatePasskeyOptions): Promise<Passkey> =>
  pipe(updatePasskeyE(request), Effect.runPromise)

/**
 * Update the stored username metadata for all passkeys belonging to a given
 * user, and prepare client-side credential updates for those passkeys.
 *
 * **Important:** changing these values has no bearing on authentication. The
 * server-side operation updates the username stored in Passlock. The optional
 * `displayName` is only included in the returned credential updates for
 * follow-up use with `@passlock/client`; it is not persisted in the vault.
 *
 * However you might choose to align the username in your vault with the
 * client-side component to simplify end user support.
 *
 * **Note:** This can be used alongside `@passlock/client`'s
 * `updatePasskeyUsernames` helper to update those details on the user's device.
 *
 * @param request
 * @returns A promise resolving to an {@link UpdatedCredentials} payload.
 * Its `credentials` array can be passed to the client's `updatePasskeyUsernames` function.
 *
 * @category Passkeys
 */
export const updatePasskeyUsernames = (
  request: UpdateUsernamesOptions
): Promise<UpdatedCredentials> => pipe(updatePasskeyUsernamesE(request), Effect.runPromise)

/**
 * Delete a passkey from the Passlock vault.
 *
 * This does not remove the passkey from the user's device. Use
 * `@passlock/client` to coordinate client-side removal when needed.
 *
 * @param options
 * @returns A promise resolving to the deleted credential.
 * @throws {@link NotFoundError} if passkey does not exist
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Passkeys
 */
export const deletePasskey = (options: DeletePasskeyOptions): Promise<DeletedPasskey> =>
  pipe(deletePasskeyE(options), Effect.runPromise)

/**
 * Call the Passlock backend API to delete all passkeys associated with a user.
 *
 * @param request
 * @returns A promise resolving to a {@link DeletedPasskeys} payload.
 * Its `deleted` array can be passed directly into `@passlock/client`'s
 * `deleteUserPasskeys` helper for follow-up client-side passkey removal.
 * @throws {@link NotFoundError} if the user does not exist
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Passkeys
 */
export const deleteUserPasskeys = (request: DeleteUserPasskeysOptions): Promise<DeletedPasskeys> =>
  pipe(deleteUserPasskeysE(request), Effect.runPromise)

/**
 * Fetch a single passkey from the Passlock vault.
 *
 * @param options
 * @returns A promise resolving to the passkey.
 * @throws {@link NotFoundError} if passkey does not exist
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Passkeys
 */
export const getPasskey = (options: GetPasskeyOptions): Promise<Passkey> =>
  pipe(getPasskeyE(options), Effect.runPromise)

/**
 * List passkeys for the given tenancy. Note this could return a cursor,
 * in which case the function should be called again with the given cursor.
 *
 * @param options
 * @returns A promise resolving to a page of passkey summaries.
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Passkeys
 */
export const listPasskeys = (options: ListPasskeyOptions): Promise<FindAllPasskeys> =>
  pipe(listPasskeysE(options), Effect.runPromise)

/**
 * Exchange a short-lived code from `@passlock/client` for an
 * {@link ExtendedPrincipal}.
 *
 * @param options
 * @returns A promise resolving to an extended principal.
 * @throws {@link InvalidCodeError} if the code is invalid or expired
 * @throws {@link ForbiddenError} if the Tenancy ID or API key is invalid
 *
 * @category Principal
 */
export const exchangeCode = (options: ExchangeCodeOptions): Promise<ExtendedPrincipal> =>
  pipe(exchangeCodeE(options), Effect.runPromise)

/**
 * Decode and verify a Passlock `id_token` (JWT).
 *
 * Note: this will make a network call to
 * `https://api.passlock.dev/.well-known/jwks.json` (or your configured `endpoint`)
 * to fetch the relevant public key. The response will be cached, however
 * bear in mind that for environments such as AWS Lambda it will make the call
 * on each cold start, so it might be slower than {@link exchangeCode}.
 *
 * @param options
 * @returns A promise resolving to the verified principal.
 * @throws {@link VerificationError} if token verification fails
 *
 * @category Principal
 */
export const verifyIdToken = (options: VerifyIdTokenOptions): Promise<Principal> =>
  pipe(verifyIdTokenE(options), Effect.runPromise)

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
