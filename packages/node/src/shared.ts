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

export class ForbiddenError extends Schema.TaggedError<ForbiddenError>("Forbidden")(
  "Forbidden",
  {}
) {
  static isForbiddenError = (payload: unknown): payload is ForbiddenError => Schema.is(ForbiddenError)(payload)
}

export class NotFoundError extends Schema.TaggedError<NotFoundError>("NotFound")(
  "NotFound",
  {
    message: Schema.String
  }
) {
  static isNotFoundError = (payload: unknown): payload is NotFoundError => Schema.is(NotFoundError)(payload)
}

export class ServerError extends Error {
  readonly _tag: string;

  constructor(data: { _tag: string; message: string }) {
    super(data.message);
    this._tag = data._tag;
  }

  override readonly toString = (): string =>
    `${this.message} (_tag: ${this._tag})`;
}