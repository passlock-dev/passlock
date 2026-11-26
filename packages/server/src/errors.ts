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
 * @category Common
 */
export type UnauthorizedError = {
  _tag: "@error/Unauthorized"
  message: string
}

/**
 * Type guard for {@link UnauthorizedError}.
 *
 * @category Common
 */
export const isUnauthorizedError = isTagged<UnauthorizedError>("@error/Unauthorized")

/* Forbidden */

/**
 * Error payload returned when the API key or tenancy is not permitted to
 * perform the requested action.
 *
 * @category Common
 */
export type ForbiddenError = {
  _tag: "@error/Forbidden"
  message: string
}

/**
 * Type guard for {@link ForbiddenError}.
 *
 * @category Common
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
 *
 * @category Principal
 */
export const isInvalidCodeError = isTagged<InvalidCodeError>("@error/InvalidCode")

/* InvalidChallenge */

/**
 * Error payload returned when a mailbox challenge ID and secret do not identify
 * a valid challenge.
 *
 * @category Mailbox
 */
export type InvalidChallengeError = {
  _tag: "@error/InvalidChallenge"
  message: string
}

/**
 * Type guard for {@link InvalidChallengeError}.
 *
 * @category Mailbox
 */
export const isInvalidChallengeError = isTagged<InvalidChallengeError>("@error/InvalidChallenge")

/* InvalidChallengeCode */

/**
 * Error payload returned when a mailbox challenge code does not match.
 *
 * @category Mailbox
 */
export type InvalidChallengeCodeError = {
  _tag: "@error/InvalidChallengeCode"
  message: string
}

/**
 * Type guard for {@link InvalidChallengeCodeError}.
 *
 * @category Mailbox
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
 *
 * @category Mailbox
 */
export const isChallengeExpiredError = isTagged<ChallengeExpiredError>("@error/ChallengeExpired")

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
 *
 * @category Mailbox
 */
export const isChallengeAttemptsExceededError = isTagged<ChallengeAttemptsExceededError>(
  "@error/ChallengeAttemptsExceeded"
)

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
 *
 * @category Mailbox
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
 *
 * @category Principal
 */
export const isVerificationError = isTagged<VerificationError>("@error/Verification")

/* InvalidTenancy */

/**
 * Error payload returned when the supplied tenancy identifier is invalid.
 *
 * @category Common
 */
export type InvalidTenancyError = {
  _tag: "@error/InvalidTenancy"
  message: string
}

/**
 * Type guard for {@link InvalidTenancyError}.
 *
 * @category Common
 */
export const isInvalidTenancyError = isTagged<InvalidTenancyError>("@error/InvalidTenancy")

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
 *
 * @category Passkeys
 */
export const isPasskeyNotFoundError = isTagged<PasskeyNotFoundError>("@error/PasskeyNotFound")

/* NotFound */

/**
 * Error payload returned when a requested resource cannot be found.
 *
 * @category Common
 */
export type NotFoundError = {
  _tag: "@error/NotFound"
  message: string
}

/**
 * Type guard for {@link NotFoundError}.
 *
 * @category Common
 */
export const isNotFoundError = isTagged<NotFoundError>("@error/NotFound")

/* InvalidEmail */

/**
 * Error payload returned when an email address is invalid.
 *
 * @category Validation
 */
export type InvalidEmailError = {
  _tag: "@error/InvalidEmail"
  message: string
}

/**
 * Type guard for {@link InvalidEmailError}.
 *
 * @category Validation
 */
export const isInvalidEmailError = isTagged<InvalidEmailError>("@error/InvalidEmail")

/* DuplicateEmail */

/**
 * Error payload returned when an email address already exists.
 *
 * @category Validation
 */
export type DuplicateEmailError = {
  _tag: "@error/DuplicateEmail"
  message: string
}

/**
 * Type guard for {@link DuplicateEmailError}.
 *
 * @category Validation
 */
export const isDuplicateEmailError = isTagged<DuplicateEmailError>("@error/DuplicateEmail")

/* BadRequest */

/**
 * Error payload returned when the request body is invalid.
 *
 * @category Validation
 */
export type BadRequestError = {
  _tag: "@error/BadRequest"
  message: string
}

/**
 * Type guard for {@link BadRequestError}.
 *
 * @category Validation
 */
export const isBadRequestError = isTagged<BadRequestError>("@error/BadRequest")

/** The submitted code did not match any time step in the verification window.
 * @category TOTP
 */
export type InvalidTotpCodeError = { _tag: "@error/InvalidTotpCode"; message: string }

/** Type guard for {@link InvalidTotpCodeError}.
 * @category TOTP
 */
export const isInvalidTotpCodeError = isTagged<InvalidTotpCodeError>("@error/InvalidTotpCode")

/** The matching TOTP step was already consumed or invalidated by a later accepted step.
 * @category TOTP
 */
export type TotpCodeAlreadyUsedError = { _tag: "@error/TotpCodeAlreadyUsed"; message: string }

/** Type guard for {@link TotpCodeAlreadyUsedError}.
 * @category TOTP
 */
export const isTotpCodeAlreadyUsedError = isTagged<TotpCodeAlreadyUsedError>(
  "@error/TotpCodeAlreadyUsed"
)

/** The enrollment deadline has passed; start a new enrollment.
 * @category TOTP
 */
export type TotpEnrollmentExpiredError = { _tag: "@error/TotpEnrollmentExpired"; message: string }

/** Type guard for {@link TotpEnrollmentExpiredError}.
 * @category TOTP
 */
export const isTotpEnrollmentExpiredError = isTagged<TotpEnrollmentExpiredError>(
  "@error/TotpEnrollmentExpired"
)

/** Verification was attempted with a pending or suspended authenticator.
 * @category TOTP
 */
export type TotpAuthenticatorNotActiveError = {
  _tag: "@error/TotpAuthenticatorNotActive"
  message: string
}

/** Type guard for {@link TotpAuthenticatorNotActiveError}.
 * @category TOTP
 */
export const isTotpAuthenticatorNotActiveError = isTagged<TotpAuthenticatorNotActiveError>(
  "@error/TotpAuthenticatorNotActive"
)

/** An active authenticator cannot be confirmed again.
 * @category TOTP
 */
export type TotpAuthenticatorAlreadyActiveError = {
  _tag: "@error/TotpAuthenticatorAlreadyActive"
  message: string
}

/** Type guard for {@link TotpAuthenticatorAlreadyActiveError}.
 * @category TOTP
 */
export const isTotpAuthenticatorAlreadyActiveError = isTagged<TotpAuthenticatorAlreadyActiveError>(
  "@error/TotpAuthenticatorAlreadyActive"
)

/** The user has reached the active or pending authenticator quota.
 * @category TOTP
 */
export type TotpAuthenticatorLimitError = {
  _tag: "@error/TotpAuthenticatorLimit"
  message: string
  /** Maximum number of authenticators of this kind per user. */
  limit: number
  /** The quota that was reached. */
  kind: "active" | "pending"
}

/** Type guard for {@link TotpAuthenticatorLimitError}.
 * @category TOTP
 */
export const isTotpAuthenticatorLimitError = isTagged<TotpAuthenticatorLimitError>(
  "@error/TotpAuthenticatorLimit"
)

/** The request was throttled. Wait `retryAfterSeconds` before another attempt.
 * @category TOTP
 */
export type TotpRateLimitedError = {
  _tag: "@error/TotpRateLimited"
  message: string
  /** Positive integer seconds to wait before another attempt. */
  retryAfterSeconds: number
}

/** Type guard for {@link TotpRateLimitedError}.
 * @category TOTP
 */
export const isTotpRateLimitedError = isTagged<TotpRateLimitedError>("@error/TotpRateLimited")
