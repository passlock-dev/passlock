import { Schema } from "effect"
import { Principal } from "./principal.js"

/* Registration Options */

export const UserVerificationSchema = Schema.Literal("required", "preferred", "discouraged")

export const RegistrationOptionsRequest = Schema.Struct({
  excludeCredentials: Schema.optionalWith(Schema.Array(Schema.String), { default: () => [] }),
  timeout: Schema.optional(Schema.Number),
  userDisplayName: Schema.optional(Schema.String),
  userId: Schema.optional(Schema.String),
  username: Schema.String,
  userVerification: Schema.optional(UserVerificationSchema),
})

export type RegistrationOptionsRequest = typeof RegistrationOptionsRequest.Type

export const RegistrationOptionsResponse = Schema.Struct({
  optionsJSON: Schema.Object,
  sessionToken: Schema.String,
})

export type RegistrationOptionsResponse = typeof RegistrationOptionsResponse.Type

/* Registration Verification */

export const RegistrationVerificationRequest = Schema.Struct({
  response: Schema.Object,
  sessionToken: Schema.String,
})

export type RegistrationVerificationRequest = typeof RegistrationVerificationRequest.Type

// maps to RegistrationSuccess on the client side
export const RegistrationVerificationResponse = Schema.TaggedStruct("RegistrationSuccess", {
  code: Schema.String,
  id_token: Schema.String,
  principal: Principal,
})

export type RegistrationVerificationResponse = typeof RegistrationVerificationResponse.Type

/* Authentication Options */

export const AuthenticationOptionsRequest = Schema.Struct({
  allowCredentials: Schema.optionalWith(Schema.Array(Schema.String), { default: () => [] }),
  timeout: Schema.optional(Schema.Number),
  userId: Schema.optional(Schema.String),
  userVerification: Schema.optional(UserVerificationSchema),
})

export type AuthenticationOptionsRequest = typeof AuthenticationOptionsRequest.Type

/* Authentication Verification */

export const AuthenticationVerificationRequest = Schema.Struct({
  response: Schema.Object,
  sessionToken: Schema.String,
})

// maps to AuthenticationSuccess on the client
export const AuthenticationVerificationResponse = Schema.TaggedStruct("AuthenticationSuccess", {
  code: Schema.String,
  id_token: Schema.String,
  principal: Principal,
})

export type AuthenticationVerificationResponse = typeof AuthenticationVerificationResponse.Type

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
  createdAt: Schema.Number,
  credential: Schema.Struct({
    aaguid: Schema.String,
    platformName: Schema.optional(Schema.String),
  }),
  enabled: Schema.Boolean,
  id: Schema.String,
  lastUsed: Schema.optional(Schema.Number),
  userId: Schema.optional(Schema.String),
})

export type PasskeySummary = typeof PasskeySummary.Type

export const isPasskeySummary = (payload: unknown): payload is PasskeySummary =>
  Schema.is(PasskeySummary)(payload)

export const FindAllPasskeys = Schema.TaggedStruct("FindAllPasskeys", {
  cursor: Schema.NullOr(Schema.String),
  records: Schema.Array(PasskeySummary),
})
