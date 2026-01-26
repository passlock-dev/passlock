import { Schema } from "effect"

export class Unauthorized extends Schema.TaggedError<Unauthorized>()("@error/Unauthorized", {}) {}

export const isUnauthorized = (payload: unknown): payload is Unauthorized =>
  Schema.is(Unauthorized)(payload)

export class Forbidden extends Schema.TaggedError<Forbidden>()("@error/Forbidden", {}) {}

export const isForbidden = (payload: unknown): payload is Forbidden => Schema.is(Forbidden)(payload)

export class InvalidCode extends Schema.TaggedError<InvalidCode>("@error/InvalidCode")(
  "@error/InvalidCode",
  {
    message: Schema.String,
  }
) {}

export const isInvalidCode = (payload: unknown): payload is InvalidCode =>
  Schema.is(InvalidCode)(payload)

export class InvalidTenancy extends Schema.TaggedError<InvalidTenancy>()("@error/InvalidTenancy", {
  message: Schema.String,
}) {}

export const isInvalidTenancy = (payload: unknown): payload is InvalidTenancy =>
  Schema.is(InvalidTenancy)(payload)

/**
 * We need the credentialId and rpId to feed into the
 * client's signalCredentialRemoval function
 */
export class PasskeyNotFound extends Schema.TaggedError<PasskeyNotFound>("@error/PasskeyNotFound")(
  "@error/PasskeyNotFound",
  {
    credentialId: Schema.String,
    message: Schema.String,
    rpId: Schema.String,
  }
) {}

export const isPasskeyNotFound = (payload: unknown): payload is PasskeyNotFound =>
  Schema.is(PasskeyNotFound)(payload)

export class NotFound extends Schema.TaggedError<NotFound>("@error/NotFound")("@error/NotFound", {
  message: Schema.String,
}) {}

export const isNotFound = (payload: unknown): payload is NotFound => Schema.is(NotFound)(payload)

export class InvalidEmail extends Schema.TaggedError<InvalidEmail>("@error/InvalidEmail")(
  "@error/InvalidEmail",
  { message: Schema.String }
) {}

export const isInvalidEmail = (payload: unknown): payload is InvalidEmail =>
  Schema.is(InvalidEmail)(payload)

export class DuplicateEmail extends Schema.TaggedError<DuplicateEmail>("@error/DuplicateEmail")(
  "@error/DuplicateEmail",
  { message: Schema.String }
) {}

export const isDuplicateEmail = (payload: unknown): payload is DuplicateEmail =>
  Schema.is(DuplicateEmail)(payload)

export class BadRequest extends Schema.TaggedError<BadRequest>("@error/BadRequest")(
  "@error/BadRequest",
  { message: Schema.String }
) {}

export const isBadRequest = (payload: unknown): payload is BadRequest =>
  Schema.is(BadRequest)(payload)
