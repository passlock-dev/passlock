import { Schema } from "effect"

const EmailRegex = /^[^@]+@[^@]+.[^@]+$/
const PurposeRegex = /^[A-Za-z0-9._:-]{1,64}$/

/**
 * Schema for a mailbox challenge purpose string.
 *
 * @category Mailbox
 */
export const MailboxChallengePurpose = Schema.String.pipe(
  Schema.filter(
    (purpose) =>
      PurposeRegex.test(purpose) ||
      "Challenge purpose must be 1-64 chars and use only A-Z a-z 0-9 . _ : -"
  )
)

/**
 * Type produced by {@link MailboxChallengePurpose}.
 *
 * @category Mailbox
 */
export type MailboxChallengePurpose = typeof MailboxChallengePurpose.Type

/**
 * Schema for mailbox challenge email addresses.
 *
 * @category Mailbox
 */
export const MailboxChallengeEmail = Schema.String.pipe(
  Schema.filter((email) => EmailRegex.test(email) || "Invalid email")
)

/**
 * Type produced by {@link MailboxChallengeEmail}.
 *
 * @category Mailbox
 */
export type MailboxChallengeEmail = typeof MailboxChallengeEmail.Type

/**
 * Schema for a mailbox one-time-code challenge.
 *
 * @category Mailbox
 */
export const MailboxChallenge = Schema.Struct({
  id: Schema.String,
  purpose: MailboxChallengePurpose,
  email: MailboxChallengeEmail,
  userId: Schema.optional(Schema.String),
  token: Schema.String,
  code: Schema.String,
  createdAt: Schema.Number,
  expiresAt: Schema.Number,
})

/**
 * Type produced by {@link MailboxChallenge}.
 *
 * @category Mailbox
 */
export type MailboxChallenge = typeof MailboxChallenge.Type

/**
 * Schema returned when a mailbox challenge is created.
 *
 * @category Mailbox
 */
export const MailboxChallengeCreated = Schema.TaggedStruct("ChallengeCreated", {
  challenge: MailboxChallenge,
})

/**
 * Type produced by {@link MailboxChallengeCreated}.
 *
 * @category Mailbox
 */
export type MailboxChallengeCreated = typeof MailboxChallengeCreated.Type

/**
 * Schema returned when a mailbox challenge is verified.
 *
 * @category Mailbox
 */
export const MailboxChallengeVerified = Schema.TaggedStruct(
  "ChallengeVerified",
  {}
)

/**
 * Type produced by {@link MailboxChallengeVerified}.
 *
 * @category Mailbox
 */
export type MailboxChallengeVerified = typeof MailboxChallengeVerified.Type

/**
 * Schema returned when a mailbox challenge is deleted.
 *
 * @category Mailbox
 */
export const MailboxChallengeDeleted = Schema.TaggedStruct(
  "ChallengeDeleted",
  {}
)

/**
 * Type produced by {@link MailboxChallengeDeleted}.
 *
 * @category Mailbox
 */
export type MailboxChallengeDeleted = typeof MailboxChallengeDeleted.Type
