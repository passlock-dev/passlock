import { Schema } from "effect"
import type { satisfy } from "./satisfy.js"

/* Principal */

/**
 * Schema for the principal payload produced after verifying an `id_token`.
 *
 * @category Principal
 */
export const PrincipalSchema = Schema.TaggedStruct("Principal", {
  id: Schema.String,
  authenticatorId: Schema.String,
  authenticatorType: Schema.Literal("passkey"),
  createdAt: Schema.Number,
  expiresAt: Schema.Number,
  passkey: Schema.optional(
    Schema.Struct({
      userVerified: Schema.Boolean,
      verified: Schema.Boolean,
    })
  ),
  userId: Schema.String,
})

/**
 * Principal payload describing a completed authentication or registration
 * operation.
 *
 * @category Principal
 */
export type Principal = {
  readonly _tag: "Principal"
  readonly id: string
  readonly userId: string
  readonly createdAt: number
  readonly authenticatorId: string
  readonly authenticatorType: "passkey"
  readonly passkey?:
    | {
        readonly userVerified: boolean
        readonly verified: boolean
      }
    | undefined
  readonly expiresAt: number
}

/**
 * Type guard for {@link Principal}.
 *
 * @category Principal
 */
export const isPrincipal = (payload: unknown): payload is Principal =>
  Schema.is(PrincipalSchema)(payload)

type _Principal = satisfy<typeof PrincipalSchema.Type, Principal>

/**
 * Schema for the richer principal payload returned by `exchangeCode`.
 *
 * @category Principal
 */
export const ExtendedPrincipalSchema = Schema.TaggedStruct(
  "ExtendedPrincipal",
  {
    id: Schema.String,
    authenticatorId: Schema.String,
    authenticatorType: Schema.Literal("passkey"),
    createdAt: Schema.Number,
    expiresAt: Schema.Number,
    passkey: Schema.optional(
      Schema.Struct({
        platformName: Schema.optional(Schema.String),
        userVerified: Schema.Boolean,
        verified: Schema.Boolean,
      })
    ),
    userId: Schema.String,
    metadata: Schema.Struct({
      ipAddress: Schema.optional(Schema.String),
      userAgent: Schema.optional(Schema.String),
    }),
  }
)

/**
 * Extended principal payload returned by `exchangeCode`.
 *
 * In addition to the base principal fields it includes request metadata such as
 * IP address and user agent when available.
 *
 * @category Principal
 */
export type ExtendedPrincipal = {
  readonly _tag: "ExtendedPrincipal"
  readonly id: string
  readonly authenticatorId: string
  readonly authenticatorType: "passkey"
  readonly passkey?:
    | {
        readonly userVerified: boolean
        readonly verified: boolean
        readonly platformName?: string | undefined
      }
    | undefined
  readonly createdAt: number
  readonly expiresAt: number
  readonly userId: string
  readonly metadata: {
    readonly ipAddress?: string | undefined
    readonly userAgent?: string | undefined
  }
}

/**
 * Type guard for {@link ExtendedPrincipal}.
 *
 * @category Principal
 */
export const isExtendedPrincipal = (
  payload: unknown
): payload is ExtendedPrincipal => Schema.is(ExtendedPrincipalSchema)(payload)

type _ExtendedPrincipal = satisfy<
  typeof ExtendedPrincipalSchema.Type,
  ExtendedPrincipal
>

/**
 * Schema for the Passlock JWT claims used by {@link PrincipalSchema}.
 *
 * @category Principal
 */
export const IdTokenSchema = Schema.TaggedStruct("IdToken", {
  "a:id": Schema.String,
  "a:typ": Schema.String,
  aud: Schema.String,
  exp: Schema.Number,
  iat: Schema.Number,
  iss: Schema.Literal("passlock.dev"),
  jti: Schema.String,
  "pk:uv": Schema.Boolean,
  sub: Schema.String,
})

/**
 * Decoded Passlock JWT claims used internally when verifying `id_token`
 * payloads.
 *
 * @category Principal
 */
export type IdToken = {
  readonly "a:id": string
  readonly "a:typ": string
  readonly aud: string
  readonly exp: number
  readonly iat: number
  readonly iss: "passlock.dev"
  readonly jti: string
  readonly "pk:uv": boolean
  readonly sub: string
  readonly _tag: "IdToken"
}

/**
 * Type guard for {@link IdToken}.
 *
 * @category Principal
 */
export const isIdToken = (payload: unknown): payload is IdToken =>
  Schema.is(IdTokenSchema)(payload)

type _IdToken = satisfy<typeof IdTokenSchema.Type, IdToken>
