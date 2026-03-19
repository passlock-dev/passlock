/**
 * Base options accepted by most `@passlock/server` operations.
 *
 * @category Configuration
 */
export type PasslockOptions = {
  /**
   * Identifier of the Passlock tenancy the request is scoped to.
   */
  tenancyId: string

  /**
   * Override the default Passlock API base URL.
   *
   * @default https://api.passlock.dev
   */
  endpoint?: string
}

/**
 * Request options for operations that call authenticated Passlock REST APIs.
 *
 * @category Configuration
 */
export interface AuthenticatedOptions extends PasslockOptions {
  /**
   * Secret API key used to authenticate the request.
   */
  apiKey: string
}

export class UnexpectedError extends Error {
  readonly _tag: string

  constructor(data: { _tag: string; message: string }) {
    super(data.message)
    this._tag = data._tag
  }

  override readonly toString = (): string =>
    `${this.message} (_tag: ${this._tag})`
}
