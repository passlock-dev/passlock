import { Schema } from "effect"

/* Registration Options */

export const UserVerificationSchema = Schema.Literal("required", "preferred", "discouraged")

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
  createdAt: Schema.Number,
  credential: Schema.Struct({
    aaguid: Schema.String,
    backedUp: Schema.Boolean,
    counter: Schema.Number,
    deviceType: Schema.Literal(...CredentialDeviceType),
    id: Schema.String, // webAuthnId (Base64Url)
    transports: Schema.Array(Schema.Literal(...Transports)),
    userId: Schema.String, // webAuthnUserId (Base64Url)
  }),
  enabled: Schema.Boolean,
  id: Schema.String,
  lastUsed: Schema.optional(Schema.Number),
  platform: Schema.optional(
    Schema.Struct({
      icon: Schema.optional(Schema.String),
      name: Schema.optional(Schema.String),
    })
  ),
  updatedAt: Schema.Number,
  userId: Schema.optional(Schema.String),
})

export type Passkey = typeof Passkey.Type

export const isPasskey = (payload: unknown): payload is Passkey => Schema.is(Passkey)(payload)

export const PasskeySummary = Schema.TaggedStruct("PasskeySummary", {
  id: Schema.String,
  userId: Schema.String,
  credential: Schema.Struct({
    aaguid: Schema.String,
  }),
  enabled: Schema.Boolean,
  createdAt: Schema.Number,
  lastUsed: Schema.optional(Schema.Number),
})

export type PasskeySummary = typeof PasskeySummary.Type

export const isPasskeySummary = (payload: unknown): payload is PasskeySummary =>
  Schema.is(PasskeySummary)(payload)

export const FindAllPasskeys = Schema.TaggedStruct("FindAllPasskeys", {
  cursor: Schema.NullOr(Schema.String),
  records: Schema.Array(PasskeySummary),
})

export type FindAllPasskeys = typeof FindAllPasskeys.Type

export const DeletedPasskey = Schema.TaggedStruct("DeletedPasskey", {
  passkeyId: Schema.String,
  credentialId: Schema.String,
  rpId: Schema.String,
})

export type DeletedPasskey = typeof DeletedPasskey.Type

export const isDeletedPasskey = (payload: unknown): payload is DeletedPasskey =>
  Schema.is(DeletedPasskey)(payload)
