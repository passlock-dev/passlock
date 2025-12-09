import { Schema } from "effect";
import { Principal } from "./principal.js";

/* Registration Options */

export const UserVerificationSchema = Schema.Literal(
  "required",
  "preferred",
  "discouraged",
);

export const RegistrationOptionsRequest = Schema.Struct({
  username: Schema.String,
  userId: Schema.optionalWith(Schema.String, { as: "Option" }),
  userDisplayName: Schema.optionalWith(Schema.String, { as: "Option" }),
  excludeCredentials: Schema.optionalWith(Schema.Array(Schema.String), {
    as: "Option",
  }),
  userVerification: Schema.optionalWith(UserVerificationSchema, {
    as: "Option",
  }),
  timeout: Schema.optionalWith(Schema.Number, { as: "Option" }),
});

export type RegistrationOptionsRequest = typeof RegistrationOptionsRequest.Type;

export const RegistrationOptionsResponse = Schema.Struct({
  sessionToken: Schema.String,
  // TODO type response
  optionsJSON: Schema.Object,
});

export type RegistrationOptionsResponse =
  typeof RegistrationOptionsResponse.Type;

/* Registration Verification */

export const RegistrationVerificationRequest = Schema.Struct({
  sessionToken: Schema.String,
  // TODO type response
  response: Schema.Object,
});

export type RegistrationVerificationRequest =
  typeof RegistrationVerificationRequest.Type;

// maps to RegistrationSuccess on the client side
export const RegistrationVerificationResponse = Schema.TaggedStruct(
  "RegistrationSuccess",
  {
    code: Schema.String,
    id_token: Schema.String,
    principal: Principal,
  },
);

export type RegistrationVerificationResponse =
  typeof RegistrationVerificationResponse.Type;

/* Authentication Options */

export const AuthenticationOptionsRequest = Schema.Struct({
  userId: Schema.optionalWith(Schema.String, { as: "Option" }),
  userVerification: Schema.optionalWith(UserVerificationSchema, {
    as: "Option",
  }),
  allowCredentials: Schema.optionalWith(Schema.Array(Schema.String), {
    default: () => [],
  }),
  timeout: Schema.optionalWith(Schema.Number, { as: "Option" }),
});

export type AuthenticationOptionsRequest =
  typeof AuthenticationOptionsRequest.Type;

/* Authentication Verification */

export const AuthenticationVerificationRequest = Schema.Struct({
  sessionToken: Schema.String,
  response: Schema.Object,
});

// maps to AuthenticationSuccess on the client
export const AuthenticationVerificationResponse = Schema.TaggedStruct(
  "AuthenticationSuccess",
  {
    code: Schema.String,
    id_token: Schema.String,
    principal: Principal,
  },
);

export type AuthenticationVerificationResponse =
  typeof AuthenticationVerificationResponse.Type;

/* Passkey */

export const CredentialDeviceType = ["singleDevice", "multiDevice"] as const;
export type CredentialDeviceType = (typeof CredentialDeviceType)[number];

export const Transports = [
  "ble",
  "hybrid",
  "internal",
  "nfc",
  "usb",
  "cable",
  "smart-card",
] as const;
export type Transports = (typeof Transports)[number];

/* Passkey */

export const Passkey = Schema.TaggedStruct("Passkey", {
  authenticatorId: Schema.String,
  createdAt: Schema.Number,
  credential: Schema.Struct({
    aaguid: Schema.String,
    backedUp: Schema.Boolean,
    counter: Schema.Number,
    deviceType: Schema.Literal(...CredentialDeviceType),
    id: Schema.String, // webAuthnId (Base64Url)
    userId: Schema.String, // webAuthnUserId (Base64Url)
    transports: Schema.Array(Schema.Literal(...Transports)),
  }),
  enabled: Schema.Boolean,
  lastUsed: Schema.optional(Schema.Number),
  platform: Schema.optional(
    Schema.Struct({
      name: Schema.optional(Schema.String),
      icon: Schema.optional(Schema.String),
    }),
  ),
  updatedAt: Schema.Number,
  userId: Schema.optional(Schema.String),
});

export type Passkey = typeof Passkey.Type;

export const isPasskey = (payload: unknown): payload is Passkey =>
  Schema.is(Passkey)(payload);
