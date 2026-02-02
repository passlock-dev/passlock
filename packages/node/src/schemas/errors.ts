import { Schema } from "effect"

/* Unauthorized */

/** @internal */
export class Unauthorized extends Schema.TaggedError<Unauthorized>()(
  "@error/Unauthorized",
  {}
) {}

/**
 * @category Authentication
 */
export const isUnauthorized = (payload: unknown): payload is Unauthorized =>
  Schema.is(Unauthorized)(payload)

/* Forbidden */

/** @internal */
export class Forbidden extends Schema.TaggedError<Forbidden>()(
  "@error/Forbidden",
  {}
) {}

/**
 * @category Authentication
 */
export const isForbidden = (payload: unknown): payload is Forbidden =>
  Schema.is(Forbidden)(payload)

/* InvalidCode */

/** @internal */
export class InvalidCode extends Schema.TaggedError<InvalidCode>()(
  "@error/InvalidCode",
  {
    message: Schema.String,
  }
) {}

/**
 * @category Principal
 */
export const isInvalidCode = (payload: unknown): payload is InvalidCode =>
  Schema.is(InvalidCode)(payload)

/* InvalidTenancy */

/** @internal */
export class InvalidTenancy extends Schema.TaggedError<InvalidTenancy>()(
  "@error/InvalidTenancy",
  {
    message: Schema.String,
  }
) {}

export const isInvalidTenancy = (payload: unknown): payload is InvalidTenancy =>
  Schema.is(InvalidTenancy)(payload)

/* PasskeyNotFound */

/**
 * We need the credentialId and rpId to feed into the
 * client's signalCredentialRemoval function
 *
 * @category Passkeys
 */
/** @internal */
export class PasskeyNotFound extends Schema.TaggedError<PasskeyNotFound>()(
  "@error/PasskeyNotFound",
  {
    credentialId: Schema.String,
    message: Schema.String,
    rpId: Schema.String,
  }
) {}

/**
 * @param payload
 * @returns `true` if the payload is a {@link PasskeyNotFound} error.
 *
 * @category Passkeys
 */
export const isPasskeyNotFound = (
  payload: unknown
): payload is PasskeyNotFound => Schema.is(PasskeyNotFound)(payload)

/* NotFound */

/** @internal */
export class NotFound extends Schema.TaggedError<NotFound>()(
  "@error/NotFound",
  {
    message: Schema.String,
  }
) {}

export const isNotFound = (payload: unknown): payload is NotFound =>
  Schema.is(NotFound)(payload)

/* InvalidEmail */

/** @internal */
export class InvalidEmail extends Schema.TaggedError<InvalidEmail>()(
  "@error/InvalidEmail",
  {
    message: Schema.String,
  }
) {}

export const isInvalidEmail = (payload: unknown): payload is InvalidEmail =>
  Schema.is(InvalidEmail)(payload)

/* DuplicateEmail */

/** @internal */
export class DuplicateEmail extends Schema.TaggedError<DuplicateEmail>()(
  "@error/DuplicateEmail",
  {
    message: Schema.String,
  }
) {}

export const isDuplicateEmail = (payload: unknown): payload is DuplicateEmail =>
  Schema.is(DuplicateEmail)(payload)

/* BadRequest */

/** @internal */
export class BadRequest extends Schema.TaggedError<BadRequest>()(
  "@error/BadRequest",
  {
    message: Schema.String,
  }
) {}

export const isBadRequest = (payload: unknown): payload is BadRequest =>
  Schema.is(BadRequest)(payload)
