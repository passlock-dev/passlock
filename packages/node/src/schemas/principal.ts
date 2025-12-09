import { Schema } from "effect";

/* Principal */

export const Principal = Schema.TaggedStruct("Principal", {
  userId: Schema.String,
  authenticatorId: Schema.String,
  authenticatorType: Schema.Literal("passkey"),
  passkey: Schema.optional(
    Schema.Struct({
      verified: Schema.Boolean,
      userVerified: Schema.Boolean,
      platformName: Schema.optional(Schema.String),
    }),
  ),
  createdAt: Schema.Number,
  expiresAt: Schema.Number,
});

export type Principal = typeof Principal.Type;

export const isPrincipal = (payload: unknown): payload is Principal =>
  Schema.is(Principal)(payload);

export const IdToken = Schema.TaggedStruct("IdToken", {
  "a:id": Schema.String,
  "a:typ": Schema.String,
  iss: Schema.Literal("passlock.dev"),
  "pk:uv": Schema.Boolean,
  sub: Schema.String,
  jti: Schema.String,
  aud: Schema.String,
  iat: Schema.Number,
  exp: Schema.Number,
});

export type IdToken = typeof IdToken.Type;

export const isIdToken = (payload: unknown): payload is IdToken =>
  Schema.is(IdToken)(payload);
