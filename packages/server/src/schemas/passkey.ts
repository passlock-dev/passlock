import { Schema } from "effect"

/*
 * Important. We don't use `type X = typeof X.Type` because it won't generate
 * the Typedoc docs, so instead we mirror the types and use a dummy
 * `type _x = satisfy<typeof X.Type, X>`
 * kind of a type level satisfies
 */

/* Registration Options */

/**
 * Valid user verification requirements for WebAuthn operations.
 *
 * @category Passkeys
 */
export const UserVerification = Schema.Literal(
  "required",
  "preferred",
  "discouraged"
)

/* Passkey */

/**
 * Possible device types reported for a passkey credential.
 *
 * @category Passkeys
 */
export const CredentialDeviceType = ["singleDevice", "multiDevice"] as const

/**
 * Union of device types reported for a passkey credential.
 *
 * @category Passkeys
 */
export type CredentialDeviceType = (typeof CredentialDeviceType)[number]

/**
 * Possible authenticator transport hints exposed by Passlock.
 *
 * @category Passkeys
 */
export const Transports = [
  "ble",
  "hybrid",
  "internal",
  "nfc",
  "usb",
  "cable",
  "smart-card",
] as const

/**
 * Union of authenticator transport hints exposed by Passlock.
 *
 * @category Passkeys
 */
export type Transports = (typeof Transports)[number]

/* Passkey */

/**
 * Schema for the WebAuthn credential portion of a passkey.
 *
 * @category Passkeys
 */
export const PasskeyCredential = Schema.Struct({
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
})

/**
 * Type produced by {@link PasskeyCredential}.
 *
 * @category Passkeys
 */
export type PasskeyCredential = typeof PasskeyCredential.Type

/**
 * Schema for a passkey stored in the Passlock vault.
 *
 * @category Passkeys
 */
export const Passkey = Schema.TaggedStruct("Passkey", {
  id: Schema.String,
  userId: Schema.optional(Schema.String),
  enabled: Schema.Boolean,
  credential: PasskeyCredential,
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

/**
 * Type produced by {@link Passkey}.
 *
 * @category Passkeys
 */
export type Passkey = typeof Passkey.Type

/**
 * Encoded transport shape for {@link Passkey}.
 *
 * Binary fields such as `publicKey` are represented using schema-friendly
 * encoded values.
 *
 * @category Passkeys
 */
export type PasskeyEncoded = typeof Passkey.Encoded

/**
 * Schema for the compact passkey payload returned by listing operations.
 *
 * @category Passkeys
 */
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

/**
 * Type produced by {@link PasskeySummary}.
 *
 * @category Passkeys
 */
export type PasskeySummary = typeof PasskeySummary.Type

/**
 * Schema for one page of passkey summaries.
 *
 * @category Passkeys
 */
export const FindAllPasskeys = Schema.TaggedStruct("FindAllPasskeys", {
  cursor: Schema.NullOr(Schema.String),
  records: Schema.Array(PasskeySummary),
})

/**
 * Schema for a bulk passkey update response.
 *
 * @category Passkeys
 */
export const UpdatedPasskeys = Schema.TaggedStruct("UpdatedPasskeys", {
  updated: Schema.Array(Passkey),
})

/**
 * Schema for the credential identifiers returned after deleting passkeys.
 *
 * @category Passkeys
 */
export const Credential = Schema.Struct({
  credentialId: Schema.String,
  userId: Schema.String,
  rpId: Schema.String,
})

/**
 * Type produced by {@link Credential}.
 *
 * @category Passkeys
 */
export type Credential = typeof Credential.Type

/**
 * Raw REST API schema returned when passkeys are deleted.
 *
 * The package maps this into {@link DeletedPasskeys} before exposing it from
 * the higher-level APIs.
 *
 * @category Passkeys
 */
export const DeletedPasskeysResponse = Schema.TaggedStruct("DeletedPasskeys", {
  deleted: Schema.Array(Passkey),
})

/**
 * Public schema returned when passkeys are deleted by user ID.
 *
 * @category Passkeys
 */
export const DeletedPasskeys = Schema.TaggedStruct("DeletedPasskeys", {
  deleted: Schema.Array(Credential),
})
