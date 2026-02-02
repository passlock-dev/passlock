export type PasslockOptions = {
  tenancyId: string

  /**
   * @default https://api.passlock.dev
   */
  endpoint?: string
}

export interface AuthenticatedOptions extends PasslockOptions {
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
