import { HttpApiSchema } from "@effect/platform";
import { Schema } from "effect";

export class Unauthorized extends Schema.TaggedError<Unauthorized>()(
  "@error/Unauthorized",
  {},
  HttpApiSchema.annotations({ status: 401 }),
) {}

export class Forbidden extends Schema.TaggedError<Forbidden>()(
  "@error/Forbidden",
  {},
  HttpApiSchema.annotations({ status: 403 }),
) {}

export class InvalidCode extends Schema.TaggedError<InvalidCode>(
  "@error/InvalidCode",
)(
  "@error/InvalidCode",
  {
    message: Schema.String,
  },
  HttpApiSchema.annotations({ status: 404 }),
) {}

export class InvalidTenancy extends Schema.TaggedError<InvalidTenancy>()(
  "@error/InvalidTenancy",
  {
    message: Schema.String,
  },
  HttpApiSchema.annotations({ status: 400 }),
) {}

export class PasskeyNotFound extends Schema.TaggedError<PasskeyNotFound>(
  "@error/PasskeyNotFound",
)(
  "@error/PasskeyNotFound",
  {
    message: Schema.String,
    credentialId: Schema.String,
    rpId: Schema.String,
  },
  HttpApiSchema.annotations({ status: 404 }),
) {}

export class NotFound extends Schema.TaggedError<NotFound>("@error/NotFound")(
  "@error/NotFound",
  {
    message: Schema.String,
  },
  HttpApiSchema.annotations({ status: 404 }),
) {}

export class InvalidEmail extends Schema.TaggedError<InvalidEmail>(
  "@error/InvalidEmail",
)(
  "@error/InvalidEmail",
  { message: Schema.String },
  HttpApiSchema.annotations({ status: 400 }),
) {}

export class DuplicateEmail extends Schema.TaggedError<DuplicateEmail>(
  "@error/DuplicateEmail",
)(
  "@error/DuplicateEmail",
  { message: Schema.String },
  HttpApiSchema.annotations({ status: 400 }),
) {}

export class BadRequest extends Schema.TaggedError<BadRequest>(
  "@error/BadRequest",
)(
  "@error/BadRequest",
  { message: Schema.String },
  HttpApiSchema.annotations({ status: 400 }),
) {}
