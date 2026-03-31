/**
 * Effect-first exports for `@passlock/server`.
 *
 * This entrypoint exposes selected original `Effect`-returning functions
 * together with the public schemas used by the package.
 *
 * Use this entrypoint when you want to stay inside Effect and work with the
 * original success/error channels directly. For Promise-based APIs, use the
 * root entrypoint or `@passlock/server/safe`.
 *
 * @module effect
 */

export type {
  CreateMailboxChallengeOptions,
  DeleteMailboxChallengeOptions,
  GetMailboxChallengeOptions,
  MailboxChallengeMetadataValue,
  VerifyMailboxChallengeOptions,
} from "./mailbox/mailbox.js"
export {
  createMailboxChallenge,
  deleteMailboxChallenge,
  getMailboxChallenge,
  isMailboxChallenge,
  isMailboxChallengeCreated,
  isMailboxChallengeDeleted,
  isMailboxChallengeDetails,
  isMailboxChallengeVerified,
  verifyMailboxChallenge,
} from "./mailbox/mailbox.js"
export type {
  AssignUserOptions,
  ListPasskeyOptions,
} from "./passkey/passkey.js"
export {
  assignUser,
  deletePasskey,
  getPasskey,
  listPasskeys,
} from "./passkey/passkey.js"
export type {} from "./principal/principal.js"
export {
  exchangeCode,
  VerificationError,
  verifyIdToken,
} from "./principal/principal.js"
export * from "./schemas/index.js"
export type {
  AuthenticatedOptions,
  PasslockOptions,
} from "./shared.js"
