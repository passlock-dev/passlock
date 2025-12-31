import { Schema } from "effect"

/* Principal */

export const Principal = Schema.TaggedStruct("Principal", {
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
})

export type Principal = typeof Principal.Type

export const ExtendedPrincipal = Schema.TaggedStruct("ExtendedPrincipal", {
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
})

export type ExtendedPrincipal = typeof ExtendedPrincipal.Type

export const isPrincipal = <I extends true | false>(
  payload: unknown,
  extended: I
): payload is I extends true ? ExtendedPrincipal : Principal => {
  return extended
    ? Schema.is(ExtendedPrincipal)(payload)
    : Schema.is(Schema.Union(Principal, ExtendedPrincipal))(payload)
}

export const IdToken = Schema.TaggedStruct("IdToken", {
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

export type IdToken = typeof IdToken.Type

export const isIdToken = (payload: unknown): payload is IdToken => Schema.is(IdToken)(payload)
