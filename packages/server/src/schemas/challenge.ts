import { Schema } from "effect"

const EmailRegex = /^[^@]+@[^@]+.[^@]+$/
const PurposeRegex = /^[A-Za-z0-9._:-]{1,64}$/

type MailboxChallengeMetadataValue =
  | string
  | number
  | boolean
  | null
  | ReadonlyArray<MailboxChallengeMetadataValue>
  | MailboxChallengeMetadata

/**
 * JSON-compatible metadata stored alongside a mailbox challenge.
 *
 * @category Mailbox
 */
export interface MailboxChallengeMetadata {
  readonly [key: string]: MailboxChallengeMetadataValue
}

const isPlainObject = (input: unknown): input is Record<string, unknown> => {
  if (typeof input !== "object" || input === null || Array.isArray(input))
    return false

  const prototype = Object.getPrototypeOf(input)
  return prototype === Object.prototype || prototype === null
}

const isMailboxChallengeMetadataValue = (
  input: unknown
): input is MailboxChallengeMetadataValue => {
  if (input === null) return true
  if (typeof input === "string" || typeof input === "boolean") return true
  if (typeof input === "number") return Number.isFinite(input)
  if (Array.isArray(input)) return input.every(isMailboxChallengeMetadataValue)
  if (!isPlainObject(input)) return false

  return Object.values(input).every(isMailboxChallengeMetadataValue)
}

/**
 * Schema for a mailbox challenge purpose string.
 *
 * Valid values are 1-64 characters using only `A-Z`, `a-z`, `0-9`, `.`, `_`,
 * `:`, and `-`.
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
 * Schema for mailbox challenge metadata.
 *
 * @category Mailbox
 */
export const MailboxChallengeMetadata = Schema.declare(
  (input: unknown): input is MailboxChallengeMetadata =>
    isPlainObject(input) &&
    Object.values(input).every(isMailboxChallengeMetadataValue)
).annotations({ identifier: "MailboxChallengeMetadata" })

const MailboxChallengeDetailsFields = {
  challengeId: Schema.String,
  purpose: MailboxChallengePurpose,
  email: MailboxChallengeEmail,
  userId: Schema.optional(Schema.String),
  createdAt: Schema.Number,
  expiresAt: Schema.Number,
  metadata: Schema.NullOr(MailboxChallengeMetadata),
} as const

/**
 * Schema for a readable mailbox one-time-code challenge.
 *
 * This tagged representation excludes the secret and one-time code.
 *
 * @category Mailbox
 */
export const MailboxChallengeDetails = Schema.TaggedStruct(
  "Challenge",
  MailboxChallengeDetailsFields
)

/**
 * Type produced by {@link MailboxChallengeDetails}.
 *
 * @category Mailbox
 */
export type MailboxChallengeDetails = typeof MailboxChallengeDetails.Type

/**
 * Schema for the full mailbox challenge payload returned by challenge
 * creation.
 *
 * In addition to the readable challenge fields, this includes the generated
 * `secret` and one-time `code`.
 *
 * @category Mailbox
 */
export const MailboxChallenge = Schema.Struct({
  ...MailboxChallengeDetailsFields,
  secret: Schema.String,
  code: Schema.String,
  html: Schema.String
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
 * The nested `challenge` includes both the readable fields and the generated
 * `secret` and one-time `code`.
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
 * The nested `challenge` is readable and therefore excludes the secret and
 * one-time code.
 *
 * @category Mailbox
 */
export const MailboxChallengeVerified = Schema.TaggedStruct(
  "ChallengeVerified",
  {
    challenge: MailboxChallengeDetails,
  }
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
 * This payload is just the `ChallengeDeleted` tag.
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
