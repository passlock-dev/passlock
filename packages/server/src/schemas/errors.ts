import { Schema } from "effect"

/* Unauthorized */

/** @internal */
export class UnauthorizedError extends Schema.TaggedError<UnauthorizedError>()(
  "@error/Unauthorized",
  {}
) {}

/** @internal */
export const isUnauthorizedError = (payload: unknown): payload is UnauthorizedError =>
  Schema.is(UnauthorizedError)(payload)

/* Forbidden */

/** @internal */
export class ForbiddenError extends Schema.TaggedError<ForbiddenError>()("@error/Forbidden", {}) {}

/** @internal */
export const isForbiddenError = (payload: unknown): payload is ForbiddenError =>
  Schema.is(ForbiddenError)(payload)

/* InvalidCode */

/** @internal */
export class InvalidCodeError extends Schema.TaggedError<InvalidCodeError>()("@error/InvalidCode", {
  message: Schema.String,
}) {}

/** @internal */
export const isInvalidCodeError = (payload: unknown): payload is InvalidCodeError =>
  Schema.is(InvalidCodeError)(payload)

/* InvalidPrincipal */

/** @internal */
export class InvalidPrincipalError extends Schema.TaggedError<InvalidPrincipalError>()(
  "@error/InvalidPrincipal",
  {
    message: Schema.String,
  }
) {}

/** @internal */
export const isInvalidPrincipalError = (payload: unknown): payload is InvalidPrincipalError =>
  Schema.is(InvalidPrincipalError)(payload)

/* InvalidChallenge */

/** @internal */
export class InvalidChallengeError extends Schema.TaggedError<InvalidChallengeError>()(
  "@error/InvalidChallenge",
  {
    message: Schema.String,
  }
) {}

/** @internal */
export const isInvalidChallengeError = (payload: unknown): payload is InvalidChallengeError =>
  Schema.is(InvalidChallengeError)(payload)

/* InvalidChallengeCode */

/** @internal */
export class InvalidChallengeCodeError extends Schema.TaggedError<InvalidChallengeCodeError>()(
  "@error/InvalidChallengeCode",
  {
    message: Schema.String,
  }
) {}

/** @internal */
export const isInvalidChallengeCodeError = (
  payload: unknown
): payload is InvalidChallengeCodeError => Schema.is(InvalidChallengeCodeError)(payload)

/* ChallengeExpired */

/** @internal */
export class ChallengeExpiredError extends Schema.TaggedError<ChallengeExpiredError>()(
  "@error/ChallengeExpired",
  {
    message: Schema.String,
  }
) {}

/** @internal */
export const isChallengeExpiredError = (payload: unknown): payload is ChallengeExpiredError =>
  Schema.is(ChallengeExpiredError)(payload)

/* ChallengeAttemptsExceeded */

/** @internal */
export class ChallengeAttemptsExceededError extends Schema.TaggedError<ChallengeAttemptsExceededError>()(
  "@error/ChallengeAttemptsExceeded",
  {
    message: Schema.String,
  }
) {}

/** @internal */
export const isChallengeAttemptsExceededError = (
  payload: unknown
): payload is ChallengeAttemptsExceededError => Schema.is(ChallengeAttemptsExceededError)(payload)

/* ChallengeRateLimited */

/** @internal */
export class ChallengeRateLimitedError extends Schema.TaggedError<ChallengeRateLimitedError>()(
  "@error/ChallengeRateLimited",
  {
    message: Schema.String,
    retryAfterSeconds: Schema.Int,
  }
) {}

/** @internal */
export const isChallengeRateLimitedError = (
  payload: unknown
): payload is ChallengeRateLimitedError => Schema.is(ChallengeRateLimitedError)(payload)

/* InvalidTenancy */

/** @internal */
export class InvalidTenancyError extends Schema.TaggedError<InvalidTenancyError>()(
  "@error/InvalidTenancy",
  {
    message: Schema.String,
  }
) {}

/** @internal */
export const isInvalidTenancyError = (payload: unknown): payload is InvalidTenancyError =>
  Schema.is(InvalidTenancyError)(payload)

/* PasskeyNotFound */

/** @internal */
export class PasskeyNotFoundError extends Schema.TaggedError<PasskeyNotFoundError>()(
  "@error/PasskeyNotFound",
  {
    credentialId: Schema.String,
    message: Schema.String,
    rpId: Schema.String,
  }
) {}

/** @internal */
export const isPasskeyNotFoundError = (payload: unknown): payload is PasskeyNotFoundError =>
  Schema.is(PasskeyNotFoundError)(payload)

/* NotFound */

/** @internal */
export class NotFoundError extends Schema.TaggedError<NotFoundError>()("@error/NotFound", {
  message: Schema.String,
}) {}

/** @internal */
export const isNotFoundError = (payload: unknown): payload is NotFoundError =>
  Schema.is(NotFoundError)(payload)

/* InvalidEmail */

/** @internal */
export class InvalidEmailError extends Schema.TaggedError<InvalidEmailError>()(
  "@error/InvalidEmail",
  {
    message: Schema.String,
  }
) {}

/** @internal */
export const isInvalidEmailError = (payload: unknown): payload is InvalidEmailError =>
  Schema.is(InvalidEmailError)(payload)

/* DuplicateEmail */

/** @internal */
export class DuplicateEmailError extends Schema.TaggedError<DuplicateEmailError>()(
  "@error/DuplicateEmail",
  {
    message: Schema.String,
  }
) {}

/** @internal */
export const isDuplicateEmailError = (payload: unknown): payload is DuplicateEmailError =>
  Schema.is(DuplicateEmailError)(payload)

/* BadRequest */

/** @internal */
export class BadRequestError extends Schema.TaggedError<BadRequestError>()("@error/BadRequest", {
  message: Schema.String,
}) {}

/** @internal */
export const isBadRequestError = (payload: unknown): payload is BadRequestError =>
  Schema.is(BadRequestError)(payload)
