import { Schema } from "effect"
import { NotFound } from "./schemas/errors.js"

export interface TenancyOptions {
  tenancyId: string
  /**
   * @default https://api.passlock.dev
   */
  endpoint?: string
}

export interface AuthenticatedTenancyOptions extends TenancyOptions {
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

export const isNotFound = (payload: unknown): payload is NotFound => Schema.is(NotFound)(payload)
