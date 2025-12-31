export interface ApiOptions {
  tenancyId: string
  /**
   * @default https://api.passlock.dev
   */
  endpoint?: string
}

export interface AuthorizedApiOptions extends ApiOptions {
  apiKey: string
}

export class UnexpectedError extends Error {
  readonly _tag: string

  constructor(data: { _tag: string; message: string }) {
    super(data.message)
    this._tag = data._tag
  }

  override readonly toString = (): string => `${this.message} (_tag: ${this._tag})`
}
