import { Schema } from "effect";

export interface ApiOptions {
  tenancyId: string;
  /**
   * @default https://api.passlock.dev
   */
  endpoint?: string;
}

export interface AuthorizedApiOptions extends ApiOptions {
  apiKey: string;
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

export class UnexpectedError extends Error {
  readonly _tag: string;

  constructor(data: { _tag: string; message: string }) {
    super(data.message);
    this._tag = data._tag;
  }

  override readonly toString = (): string =>
    `${this.message} (_tag: ${this._tag})`;
}
