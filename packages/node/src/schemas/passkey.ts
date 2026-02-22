import { Schema } from "effect"

/*
 * Important. We don't use `type X = typeof X.Type` because it won't generate
 * the Typedoc docs, so instead we mirror the types and use a dummy
 * `type _x = satisfy<typeof X.Type, X>`
 * kind of a type level satisfies
 */

/* Registration Options */

export const UserVerification = Schema.Literal(
  "required",
  "preferred",
  "discouraged"
)

/* Passkey */

export const CredentialDeviceType = ["singleDevice", "multiDevice"] as const
export type CredentialDeviceType = (typeof CredentialDeviceType)[number]

export const Transports = [
  "ble",
  "hybrid",
  "internal",
  "nfc",
  "usb",
  "cable",
  "smart-card",
] as const
export type Transports = (typeof Transports)[number]

/* Passkey */

export const Passkey = Schema.TaggedStruct("Passkey", {
  id: Schema.String,
  userId: Schema.optional(Schema.String),
  enabled: Schema.Boolean,
  credential: Schema.Struct({
    id: Schema.String, // webAuthnId (Base64Url)
    userId: Schema.String, // webAuthnUserId (Base64Url)
    username: Schema.String,
    aaguid: Schema.String,
    backedUp: Schema.Boolean,
    counter: Schema.Number,
    deviceType: Schema.Literal(...CredentialDeviceType),
    transports: Schema.Array(Schema.Literal(...Transports)),
    publicKey: Schema.Uint8ArrayFromBase64Url,
    rpId: Schema.String,
  }),
  platform: Schema.optional(
    Schema.Struct({
      icon: Schema.optional(Schema.String),
      name: Schema.optional(Schema.String),
    })
  ),
  lastUsed: Schema.optional(Schema.Number),
  createdAt: Schema.Number,
  updatedAt: Schema.Number,
})

export type Passkey = typeof Passkey.Type

export type PasskeyEncoded = typeof Passkey.Encoded

export const PasskeySummary = Schema.TaggedStruct("PasskeySummary", {
  id: Schema.String,
  userId: Schema.String,
  credential: Schema.Struct({
    id: Schema.String,
    userId: Schema.String,
  }),
  enabled: Schema.Boolean,
  createdAt: Schema.Number,
  lastUsed: Schema.optional(Schema.Number),
})

export type PasskeySummary = typeof PasskeySummary.Type

export const FindAllPasskeys = Schema.TaggedStruct("FindAllPasskeys", {
  cursor: Schema.NullOr(Schema.String),
  records: Schema.Array(PasskeySummary),
})

export const UpdatedPasskeys = Schema.TaggedStruct("UpdatedPasskeys", {
  updated: Schema.Array(Passkey),
})
