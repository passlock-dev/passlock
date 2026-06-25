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
export const UserVerification = Schema.Literal("required", "preferred", "discouraged")

/**
 * Type produced by {@link UserVerification}.
 *
 * @category Passkeys
 */
export type UserVerification = typeof UserVerification.Type

/**
 * Valid mediation modes for authorized passkey authentication ceremonies.
 *
 * @category Passkeys
 */
export const PasskeyAuthenticationMediation = Schema.Literal("required", "conditional")

/**
 * Type produced by {@link PasskeyAuthenticationMediation}.
 *
 * @category Passkeys
 */
export type PasskeyAuthenticationMediation = typeof PasskeyAuthenticationMediation.Type

/* AuthorizedPasskeyRegistration */

/**
 * Request body used to authorize a passkey registration.
 *
 * The caller supplies the authorized ceremony `rpId` and human-readable
 * `rpName`; Passlock validates them and uses them when generating WebAuthn
 * registration options.
 *
 * @category Passkeys
 */
export const AuthorizePasskeyRegistrationOptions = Schema.Struct({
  rpId: Schema.String,
  rpName: Schema.String,
  userId: Schema.String,
  username: Schema.String,
  displayName: Schema.optional(Schema.String),
  excludeCredentials: Schema.optional(Schema.Array(Schema.String)),
  userVerification: Schema.optional(UserVerification),
  timeout: Schema.optional(Schema.Number),
})

/**
 * Type produced by {@link AuthorizePasskeyRegistrationOptions}.
 *
 * @category Passkeys
 */
export type AuthorizePasskeyRegistrationOptions = typeof AuthorizePasskeyRegistrationOptions.Type

/**
 * Response returned after authorizing a passkey registration.
 *
 * @category Passkeys
 */
export const AuthorizedPasskeyRegistration = Schema.TaggedStruct("AuthorizedPasskeyRegistration", {
  expiresAt: Schema.Number,
  registrationToken: Schema.String,
})

/**
 * Type produced by {@link AuthorizedPasskeyRegistration}.
 *
 * @category Passkeys
 */
export type AuthorizedPasskeyRegistration = typeof AuthorizedPasskeyRegistration.Type

/* AuthorizedPasskeyAuthentication */

/**
 * Request body used to authorize a passkey authentication.
 *
 * The caller supplies the authorized ceremony `rpId`; Passlock validates it
 * syntactically and uses it when generating WebAuthn options.
 *
 * Account-scoped requests provide `userId`, `allowCredentials`, or both.
 * Discoverable requests set `discoverable: true`; autofill/conditional
 * mediation additionally sets `mediation: "conditional"`.
 *
 * @category Passkeys
 */
export const AuthorizePasskeyAuthenticationOptions = Schema.Struct({
  rpId: Schema.String,
  userId: Schema.optional(Schema.String),
  allowCredentials: Schema.optional(Schema.Array(Schema.String)),
  userVerification: Schema.optional(UserVerification),
  timeout: Schema.optional(Schema.Number),
  discoverable: Schema.optional(Schema.Boolean),
  mediation: Schema.optional(PasskeyAuthenticationMediation),
})

/**
 * Type produced by {@link AuthorizePasskeyAuthenticationOptions}.
 *
 * @category Passkeys
 */
export type AuthorizePasskeyAuthenticationOptions =
  typeof AuthorizePasskeyAuthenticationOptions.Type

/**
 * Response returned after authorizing a passkey authentication.
 *
 * Send the returned `authenticationToken` to the browser and keep all
 * authentication policy on your backend.
 *
 * @category Passkeys
 */
export const AuthorizedPasskeyAuthentication = Schema.TaggedStruct(
  "AuthorizedPasskeyAuthentication",
  {
    authenticationToken: Schema.String,
    expiresAt: Schema.Number,
  }
)

/**
 * Type produced by {@link AuthorizedPasskeyAuthentication}.
 *
 * @category Passkeys
 */
export type AuthorizedPasskeyAuthentication = typeof AuthorizedPasskeyAuthentication.Type

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
 * Non-fatal warning codes returned by passkey management prepare operations.
 *
 * @category Passkeys
 */
export const PasskeyManagementWarningCode = Schema.Literal(
  "PASSKEY_NOT_FOUND",
  "NO_PASSKEYS_FOUND",
  "BROWSER_SIGNAL_UNSUPPORTED",
  "BROWSER_SIGNAL_FAILED",
  "EMPTY_SIGNAL_PAYLOAD"
)

/**
 * Type produced by {@link PasskeyManagementWarningCode}.
 *
 * @category Passkeys
 */
export type PasskeyManagementWarningCode = typeof PasskeyManagementWarningCode.Type

/**
 * Non-fatal warning returned by passkey management prepare operations.
 *
 * Warnings describe no-op or partial cases, such as missing passkeys, that did
 * not prevent the prepared-token flow from completing.
 *
 * @category Passkeys
 */
export const PasskeyManagementWarning = Schema.Struct({
  code: PasskeyManagementWarningCode,
  message: Schema.String,
  passkeyId: Schema.optional(Schema.String),
})

/**
 * Type produced by {@link PasskeyManagementWarning}.
 *
 * @category Passkeys
 */
export type PasskeyManagementWarning = typeof PasskeyManagementWarning.Type

/**
 * Response returned after preparing passkey username and display-name update
 * instructions.
 *
 * Send only `updatePasskeysToken` to the browser helper.
 *
 * @category Passkeys
 */
export const PreparedPasskeyUpdate = Schema.TaggedStruct("PreparedPasskeyUpdate", {
  updatePasskeysToken: Schema.String,
  expiresAt: Schema.Number,
  warnings: Schema.Array(PasskeyManagementWarning),
})

/**
 * Type produced by {@link PreparedPasskeyUpdate}.
 *
 * @category Passkeys
 */
export type PreparedPasskeyUpdate = typeof PreparedPasskeyUpdate.Type

/**
 * Response returned after preparing passkey deletion instructions.
 *
 * Send only `deletePasskeysToken` to the browser helper.
 *
 * @category Passkeys
 */
export const PreparedPasskeyDeletion = Schema.TaggedStruct("PreparedPasskeyDeletion", {
  deletePasskeysToken: Schema.String,
  expiresAt: Schema.Number,
  warnings: Schema.Array(PasskeyManagementWarning),
})

/**
 * Type produced by {@link PreparedPasskeyDeletion}.
 *
 * @category Passkeys
 */
export type PreparedPasskeyDeletion = typeof PreparedPasskeyDeletion.Type

/**
 * Response returned after preparing passkey pruning instructions.
 *
 * Send only `prunePasskeysToken` to the browser helper.
 *
 * @category Passkeys
 */
export const PreparedPasskeyPruning = Schema.TaggedStruct("PreparedPasskeyPruning", {
  prunePasskeysToken: Schema.String,
  expiresAt: Schema.Number,
  warnings: Schema.Array(PasskeyManagementWarning),
})

/**
 * Type produced by {@link PreparedPasskeyPruning}.
 *
 * @category Passkeys
 */
export type PreparedPasskeyPruning = typeof PreparedPasskeyPruning.Type
