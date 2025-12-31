import { Schema } from "effect"

export class Unauthorized extends Schema.TaggedError<Unauthorized>()("@error/Unauthorized", {}) {}

export class Forbidden extends Schema.TaggedError<Forbidden>()("@error/Forbidden", {}) {}

export class InvalidCode extends Schema.TaggedError<InvalidCode>("@error/InvalidCode")(
  "@error/InvalidCode",
  {
    message: Schema.String,
  }
) {}

export class InvalidTenancy extends Schema.TaggedError<InvalidTenancy>()("@error/InvalidTenancy", {
  message: Schema.String,
}) {}

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

export class NotFound extends Schema.TaggedError<NotFound>("@error/NotFound")("@error/NotFound", {
  message: Schema.String,
}) {}

export class InvalidEmail extends Schema.TaggedError<InvalidEmail>("@error/InvalidEmail")(
  "@error/InvalidEmail",
  { message: Schema.String }
) {}

export class DuplicateEmail extends Schema.TaggedError<DuplicateEmail>("@error/DuplicateEmail")(
  "@error/DuplicateEmail",
  { message: Schema.String }
) {}

export class BadRequest extends Schema.TaggedError<BadRequest>("@error/BadRequest")(
  "@error/BadRequest",
  { message: Schema.String }
) {}
