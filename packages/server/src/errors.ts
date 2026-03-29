/**
 * Public error payload shapes exposed by the promise-based and safe entrypoints.
 *
 * These mirror the tagged errors used internally by the Effect-based
 * implementation, but are represented as plain object types for easier
 * consumption outside Effect.
 */

const isTagged =
  <A extends { _tag: string }>(tag: A["_tag"]) =>
  (payload: unknown): payload is A => {
    if (typeof payload !== "object") return false
    if (payload === null) return false

    if (!("_tag" in payload)) return false
    if (typeof payload._tag !== "string") return false
    if (payload._tag !== tag) return false

    return true
  }

/* Unauthorized */

/**
 * Error payload returned when a request is not authenticated.
 *
 * @category Authentication
 */
export type UnauthorizedError = {
  _tag: "@error/Unauthorized"
  message: string
}

/**
 * Type guard for {@link UnauthorizedError}.
 */
export const isUnauthorizedError = isTagged<UnauthorizedError>(
  "@error/Unauthorized"
)

/* Forbidden */

/**
 * Error payload returned when the API key or tenancy is not permitted to
 * perform the requested action.
 *
 * @category Authentication
 */
export type ForbiddenError = {
  _tag: "@error/Forbidden"
  message: string
}

/**
 * Type guard for {@link ForbiddenError}.
 */
export const isForbiddenError = isTagged<ForbiddenError>("@error/Forbidden")

/* InvalidCode */

/**
 * Error payload returned when an exchanged code is invalid or expired.
 *
 * @category Principal
 */
export type InvalidCodeError = {
  _tag: "@error/InvalidCode"
  message: string
}

/**
 * Type guard for {@link InvalidCodeError}.
 */
export const isInvalidCodeError =
  isTagged<InvalidCodeError>("@error/InvalidCode")

/* InvalidChallenge */

/**
 * Error payload returned when a mailbox challenge token is invalid.
 *
 * @category Mailbox
 */
export type InvalidChallengeError = {
  _tag: "@error/InvalidChallenge"
  message: string
}

/**
 * Type guard for {@link InvalidChallengeError}.
 */
export const isInvalidChallengeError = isTagged<InvalidChallengeError>(
  "@error/InvalidChallenge"
)

/* InvalidChallengeCode */

/**
 * Error payload returned when a mailbox challenge code is invalid.
 *
 * @category Mailbox
 */
export type InvalidChallengeCodeError = {
  _tag: "@error/InvalidChallengeCode"
  message: string
}

/**
 * Type guard for {@link InvalidChallengeCodeError}.
 */
export const isInvalidChallengeCodeError = isTagged<InvalidChallengeCodeError>(
  "@error/InvalidChallengeCode"
)

/* ChallengeExpired */

/**
 * Error payload returned when a mailbox challenge has expired.
 *
 * @category Mailbox
 */
export type ChallengeExpiredError = {
  _tag: "@error/ChallengeExpired"
  message: string
}

/**
 * Type guard for {@link ChallengeExpiredError}.
 */
export const isChallengeExpiredError = isTagged<ChallengeExpiredError>(
  "@error/ChallengeExpired"
)

/* ChallengeAttemptsExceeded */

/**
 * Error payload returned when mailbox challenge verification has exceeded the
 * maximum number of attempts.
 *
 * @category Mailbox
 */
export type ChallengeAttemptsExceededError = {
  _tag: "@error/ChallengeAttemptsExceeded"
  message: string
}

/**
 * Type guard for {@link ChallengeAttemptsExceededError}.
 */
export const isChallengeAttemptsExceededError =
  isTagged<ChallengeAttemptsExceededError>("@error/ChallengeAttemptsExceeded")

/* ChallengeRateLimited */

/**
 * Error payload returned when mailbox challenge creation has been rate limited.
 *
 * @category Mailbox
 */
export type ChallengeRateLimitedError = {
  _tag: "@error/ChallengeRateLimited"
  message: string
  retryAfterSeconds: number
}

/**
 * Type guard for {@link ChallengeRateLimitedError}.
 */
export const isChallengeRateLimitedError = isTagged<ChallengeRateLimitedError>(
  "@error/ChallengeRateLimited"
)

/* VerificationFailure */

/**
 * Error payload returned when `verifyIdToken` cannot validate a token.
 *
 * @category Principal
 */
export type VerificationError = {
  _tag: "@error/Verification"
  message: string
}

/**
 * Type guard for {@link VerificationError}.
 */
export const isVerificationError = isTagged<VerificationError>(
  "@error/Verification"
)

/* InvalidTenancy */

/**
 * Error payload returned when the supplied tenancy identifier is invalid.
 *
 * @category Authentication
 */
export type InvalidTenancyError = {
  _tag: "@error/InvalidTenancy"
  message: string
}

/**
 * Type guard for {@link InvalidTenancyError}.
 */
export const isInvalidTenancyError = isTagged<InvalidTenancyError>(
  "@error/InvalidTenancy"
)

/* PasskeyNotFound */

/**
 * Error payload returned when a passkey cannot be found for a given
 * authentication attempt.
 *
 * @category Passkeys
 */
export type PasskeyNotFoundError = {
  _tag: "@error/PasskeyNotFound"
  message: string
  credentialId: string
  rpId: string
}

/**
 * Type guard for {@link PasskeyNotFoundError}.
 */
export const isPasskeyNotFoundError = isTagged<PasskeyNotFoundError>(
  "@error/PasskeyNotFound"
)

/* NotFound */

/**
 * Error payload returned when a requested resource cannot be found.
 *
 * @category Passkeys
 */
export type NotFoundError = {
  _tag: "@error/NotFound"
  message: string
}

/**
 * Type guard for {@link NotFoundError}.
 */
export const isNotFoundError = isTagged<NotFoundError>("@error/NotFound")

/* InvalidEmail */

/**
 * Error payload returned when an email address is invalid.
 */
export type InvalidEmailError = {
  _tag: "@error/InvalidEmail"
  message: string
}

/**
 * Type guard for {@link InvalidEmailError}.
 */
export const isInvalidEmailError = isTagged<InvalidEmailError>(
  "@error/InvalidEmail"
)

/* DuplicateEmail */

/**
 * Error payload returned when an email address already exists.
 */
export type DuplicateEmailError = {
  _tag: "@error/DuplicateEmail"
  message: string
}

/**
 * Type guard for {@link DuplicateEmailError}.
 */
export const isDuplicateEmailError = isTagged<DuplicateEmailError>(
  "@error/DuplicateEmail"
)

/* BadRequest */

/**
 * Error payload returned when the request body is invalid.
 */
export type BadRequestError = {
  _tag: "@error/BadRequest"
  message: string
}

/**
 * Type guard for {@link BadRequestError}.
 */
export const isBadRequestError = isTagged<BadRequestError>("@error/BadRequest")
