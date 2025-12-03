import { Schema } from "effect";

// Schema for errors returned by the RpMiddleware
export class RpError extends Schema.TaggedError<RpError>()(
  "@error/RpError",
  {},
) {}

export class InvalidCode extends Schema.TaggedError<InvalidCode>(
  "@error/InvalidCode",
)("@error/InvalidCode", { message: Schema.String }) {
  static isInvalidCode = (payload: unknown): payload is InvalidCode =>
    Schema.is(InvalidCode)(payload);
}

// Define a schema for the "Unauthorized" error
export class Unauthorized extends Schema.TaggedError<Unauthorized>()(
  "@error/Unauthorized",
  {},
) {}

// Define a schema for the "Unauthorized" error
export class Forbidden extends Schema.TaggedError<Forbidden>()(
  "@error/Forbidden",
  {},
) {}

// Schema for errors returned by the RpMiddleware
export class InvalidTenancy extends Schema.TaggedError<InvalidTenancy>()(
  "@error/InvalidTenancy",
  { message: Schema.String },
) {
  static isInvalidTenancy = (payload: unknown): payload is InvalidTenancy =>
    Schema.is(InvalidTenancy)(payload);
}

export class NotFound extends Schema.TaggedError<NotFound>("@error/NotFound")(
  "@error/NotFound",
  {
    message: Schema.String,
  },
) {
  static isNotFound = (payload: unknown): payload is NotFound =>
    Schema.is(NotFound)(payload);
}
