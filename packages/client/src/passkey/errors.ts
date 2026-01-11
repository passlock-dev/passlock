import { Micro } from "effect"

export const isPasskeysUnsupported = (error: unknown): error is PasskeysUnsupportedError =>
  error instanceof PasskeysUnsupportedError

export class PasskeysUnsupportedError extends Micro.TaggedError("@error/PasskeysUnsupported")<{
  readonly message: string
}> {
  static isPasskeysUnsupported = isPasskeysUnsupported
}

export type ErrorCode =
  | "ERROR_CEREMONY_ABORTED"
  | "ERROR_INVALID_DOMAIN"
  | "ERROR_INVALID_RP_ID"
  | "ERROR_INVALID_USER_ID_LENGTH"
  | "ERROR_MALFORMED_PUBKEYCREDPARAMS"
  | "ERROR_AUTHENTICATOR_GENERAL_ERROR"
  | "ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT"
  | "ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT"
  | "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED"
  | "ERROR_AUTHENTICATOR_NO_SUPPORTED_PUBKEYCREDPARAMS_ALG"
  | "ERROR_AUTO_REGISTER_USER_VERIFICATION_FAILURE"
  | "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY"

export const isOtherPasskeyError = (error: unknown): error is OtherPasskeyError =>
  error instanceof OtherPasskeyError

export class OtherPasskeyError extends Micro.TaggedError("@error/OtherPasskeyError")<{
  readonly error: unknown
  readonly message: string
  readonly code?: ErrorCode
  readonly cause?: unknown
}> {
  static isOtherPasskeyError = isOtherPasskeyError
}
