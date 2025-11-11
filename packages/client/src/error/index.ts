import { Micro } from "effect";

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
  | "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY";

export interface PasslockError {
  readonly error: unknown;
  readonly message: string;
  readonly code: ErrorCode;
}

export class NetworkError extends Micro.TaggedError("@error/NetworkError")<{
  readonly message: string;
  readonly isRetryAble: boolean;
  readonly url: string;
}> {}

export class RegistrationError extends Micro.TaggedError(
  "@error/RegistrationError",
)<{
  readonly error: unknown;
  readonly message: string;
  readonly code?: ErrorCode;
}> {}

export class AuthenticationError extends Micro.TaggedError(
  "@error/AuthenticationError",
)<{
  readonly error: unknown;
  readonly message: string;
  readonly code?: ErrorCode;
}> {}

export const isRegistrationError = (error: unknown): error is RegistrationError => error instanceof RegistrationError;

export const isAuthenticationError = (error: unknown): error is AuthenticationError => error instanceof AuthenticationError;

export const isPasslockError = (error: unknown): error is PasslockError => error instanceof RegistrationError || error instanceof AuthenticationError;

export const isNetworkError = (error: unknown): error is NetworkError => error instanceof NetworkError;