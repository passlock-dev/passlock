import { Schema } from "effect"

const EmailRegex = /^[^@]+@[^@]+.[^@]+$/
const PurposeRegex = /^[A-Za-z0-9._:-]{1,64}$/

type ChallengeMetadataValue =
  | string
  | number
  | boolean
  | null
  | ReadonlyArray<ChallengeMetadataValue>
  | ChallengeMetadata

/**
 * JSON-compatible metadata stored alongside a mailbox challenge.
 *
 * @category Mailbox
 */
export interface ChallengeMetadata {
  readonly [key: string]: ChallengeMetadataValue
}

const isPlainObject = (input: unknown): input is Record<string, unknown> => {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return false

  const prototype = Object.getPrototypeOf(input)
  return prototype === Object.prototype || prototype === null
}

const isChallengeMetadataValue = (input: unknown): input is ChallengeMetadataValue => {
  if (input === null) return true
  if (typeof input === "string" || typeof input === "boolean") return true
  if (typeof input === "number") return Number.isFinite(input)
  if (Array.isArray(input)) return input.every(isChallengeMetadataValue)
  if (!isPlainObject(input)) return false

  return Object.values(input).every(isChallengeMetadataValue)
}

/**
 * Schema for mailbox challenge metadata.
 *
 * @category Mailbox
 */
export const ChallengeMetadata = Schema.declare(
  (input: unknown): input is ChallengeMetadata =>
    isPlainObject(input) && Object.values(input).every(isChallengeMetadataValue)
).annotations({ identifier: "ChallengeMetadata" })

/**
 * Schema for a mailbox challenge purpose string.
 *
 * Valid values are 1-64 characters using only `A-Z`, `a-z`, `0-9`, `.`, `_`,
 * `:`, and `-`.
 *
 * @category Mailbox
 */
export const ChallengePurpose = Schema.String.pipe(
  Schema.filter(
    (purpose) =>
      PurposeRegex.test(purpose) ||
      "Challenge purpose must be 1-64 chars and use only A-Z a-z 0-9 . _ : -"
  )
)

/**
 * Type produced by {@link ChallengePurpose}.
 *
 * @category Mailbox
 */
export type ChallengePurpose = typeof ChallengePurpose.Type

/**
 * Schema for mailbox challenge email addresses.
 *
 * @category Mailbox
 */
export const ChallengeEmail = Schema.String.pipe(
  Schema.filter((email) => EmailRegex.test(email) || "Invalid email")
)

/**
 * Type produced by {@link ChallengeEmail}.
 *
 * @category Mailbox
 */
export type ChallengeEmail = typeof ChallengeEmail.Type

const ReadableChallengeFields = {
  challengeId: Schema.String,
  purpose: ChallengePurpose,
  email: ChallengeEmail,
  userId: Schema.optional(Schema.String),
  createdAt: Schema.Number,
  expiresAt: Schema.Number,
  metadata: Schema.NullOr(ChallengeMetadata),
} as const

/**
 * Schema for a readable mailbox one-time-code challenge.
 *
 * This tagged representation excludes the secret and one-time code.
 *
 * @category Mailbox
 */
export const ReadableChallenge = Schema.TaggedStruct(
  "Challenge",
  ReadableChallengeFields
)

/**
 * Type produced by {@link ReadableChallenge}.
 *
 * @category Mailbox
 */
export type ReadableChallenge = typeof ReadableChallenge.Type

/**
 * Schema for the full mailbox challenge payload returned by challenge
 * creation.
 *
 * In addition to the readable challenge fields, this includes the generated
 * `secret` and one-time `code`.
 *
 * The payload also includes `message.html` and `message.text`, which contain
 * Passlock's rendered email content for the recipient. You can send those
 * directly through your own email provider or use the raw `code` to render
 * your own message.
 *
 * @category Mailbox
 */
export const CreatedChallenge = Schema.Struct({
  ...ReadableChallengeFields,
  secret: Schema.String,
  code: Schema.String,
  message: Schema.Struct({
    html: Schema.String,
    text: Schema.String,
  }),
})

/**
 * Type produced by {@link CreatedChallenge}.
 *
 * @category Mailbox
 */
export type CreatedChallenge = typeof CreatedChallenge.Type

/**
 * Schema returned when a mailbox challenge is created.
 *
 * The nested `challenge` includes both the readable fields and the generated
 * `secret` and one-time `code`, plus rendered email content in
 * `message.html` and `message.text`.
 *
 * @category Mailbox
 */
export const ChallengeCreated = Schema.TaggedStruct("ChallengeCreated", {
  challenge: CreatedChallenge,
})

/**
 * Type produced by {@link ChallengeCreated}.
 *
 * @category Mailbox
 */
export type ChallengeCreated = typeof ChallengeCreated.Type

/**
 * Schema returned when a mailbox challenge is verified.
 *
 * The nested `challenge` is readable and therefore excludes the secret and
 * one-time code.
 *
 * @category Mailbox
 */
export const ChallengeVerified = Schema.TaggedStruct("ChallengeVerified", {
  challenge: ReadableChallenge,
})

/**
 * Type produced by {@link ChallengeVerified}.
 *
 * @category Mailbox
 */
export type ChallengeVerified = typeof ChallengeVerified.Type

/**
 * Schema returned when a mailbox challenge is deleted.
 *
 * This payload is just the `ChallengeDeleted` tag.
 *
 * @category Mailbox
 */
export const ChallengeDeleted = Schema.TaggedStruct("ChallengeDeleted", {})

/**
 * Type produced by {@link ChallengeDeleted}.
 *
 * @category Mailbox
 */
export type ChallengeDeleted = typeof ChallengeDeleted.Type
