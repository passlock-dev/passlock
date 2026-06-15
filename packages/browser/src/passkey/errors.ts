/**
 * The local browser or device does not support passkeys.
 * See the `message` property for more details.
 *
 * @category Passkeys (errors)
 */
export const isPasskeyUnsupportedError = (payload: unknown): payload is PasskeyUnsupportedError => {
  if (typeof payload !== "object") return false
  if (payload === null) return false
  return payload instanceof PasskeyUnsupportedError
}

/**
 * The local browser or device does not support passkeys.
 * See the `message` property for more details.
 *
 * @category Passkeys (errors)
 */
export class PasskeyUnsupportedError extends Error {
  readonly _tag = "@error/PasskeyUnsupported" as const
  readonly message: string

  constructor({ message }: { message: string }) {
    super()
    this.message = message
  }
}

/**
 * The device tried to authenticate with a passkey that was not found in the vault.
 * Your backend can prepare a deletion token for local cleanup, then pass that
 * token to the browser's `deletePasskeys` helper.
 *
 * @category Passkeys (errors)
 */
export const isOrphanedPasskeyError = (payload: unknown): payload is OrphanedPasskeyError => {
  if (typeof payload !== "object") return false
  if (payload === null) return false
  return payload instanceof OrphanedPasskeyError
}

/**
 * The device tried to authenticate with a passkey that was not found in the vault.
 * Your backend can prepare a deletion token for local cleanup, then pass that
 * token to the browser's `deletePasskeys` helper.
 *
 * @category Passkeys (errors)
 */
export class OrphanedPasskeyError extends Error {
  readonly _tag = "@error/OrphanedPasskey" as const
  readonly message: string
  readonly credentialId: string
  readonly rpId: string

  constructor({
    message,
    credentialId,
    rpId,
  }: { message: string; credentialId: string; rpId: string }) {
    super()
    this.message = message
    this.credentialId = credentialId
    this.rpId = rpId
  }
}

/**
 * WebAuthn/browser error codes surfaced via {@link OtherPasskeyError#code}.
 *
 * @category Passkeys (errors)
 */
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

/**
 * An unexpected passkey specific error occurred.
 * Check the code and message for more information. The original
 * underlying cause is exposed via `cause`.
 *
 * @category Passkeys (errors)
 */
export const isOtherPasskeyError = (payload: unknown): payload is OtherPasskeyError => {
  if (typeof payload !== "object") return false
  if (payload === null) return false
  return payload instanceof OtherPasskeyError
}

/**
 * An unexpected passkey specific error occurred.
 * Check the code and message for more information. The original
 * underlying cause is exposed via `cause`.
 *
 * @category Passkeys (errors)
 */
export class OtherPasskeyError extends Error {
  readonly _tag = "@error/OtherPasskey" as const
  readonly message: string
  readonly code?: ErrorCode
  readonly cause?: unknown

  constructor({
    error,
    message,
    code,
    cause,
  }: { error: unknown; message: string; code?: ErrorCode; cause?: unknown }) {
    super()
    this.message = message
    if (code) this.code = code
    if (cause !== undefined || error !== undefined) this.cause = cause ?? error
  }
}

/**
 * Raised when an authorized registration excludes a credential that the device
 * recognises, meaning the user already has one of those passkeys on the
 * current device.
 *
 * @category Passkeys (errors)
 */
export const isDuplicatePasskeyError = (payload: unknown): payload is DuplicatePasskeyError => {
  if (typeof payload !== "object") return false
  if (payload === null) return false
  return payload instanceof DuplicatePasskeyError
}

/**
 * Raised when an authorized registration excludes a credential that the device
 * recognises, meaning the user already has one of those passkeys on the
 * current device.
 *
 * @category Passkeys (errors)
 */
export class DuplicatePasskeyError extends Error {
  readonly _tag = "@error/DuplicatePasskey" as const
  readonly message: string
  constructor({ message }: { message: string }) {
    super()
    this.message = message
  }
}

/**
 * Raised when the prepared deletion token exchange fails or returns an
 * unexpected payload. Unsupported browser signalling and browser-side signal
 * failures are returned as warnings when the helper can otherwise complete.
 *
 * @category Passkeys (errors)
 */
export const isDeleteError = (payload: unknown): payload is DeleteError => {
  if (typeof payload !== "object") return false
  if (payload === null) return false
  return payload instanceof DeleteError
}

/**
 * Raised when the prepared deletion token exchange fails or returns an
 * unexpected payload. Unsupported browser signalling and browser-side signal
 * failures are returned as warnings when the helper can otherwise complete.
 *
 * @category Passkeys (errors)
 */
export class DeleteError extends Error {
  readonly _tag = "@error/Delete" as const
  readonly message: string
  readonly code: "PASSKEY_DELETION_UNSUPPORTED" | "PASSKEY_NOT_FOUND" | "OTHER_ERROR"

  constructor({
    message,
    code,
  }: {
    message: string
    code: "PASSKEY_DELETION_UNSUPPORTED" | "PASSKEY_NOT_FOUND" | "OTHER_ERROR"
  }) {
    super()
    this.message = message
    this.code = code
  }
}

/* Pruning error */

/**
 * Raised when the prepared pruning token exchange fails or returns an
 * unexpected payload. Unsupported browser signalling and browser-side signal
 * failures are returned as warnings when the helper can otherwise complete.
 *
 * @category Passkeys (errors)
 */
export const isPruningError = (payload: unknown): payload is PruningError => {
  if (typeof payload !== "object") return false
  if (payload === null) return false
  return payload instanceof PruningError
}

/**
 * Raised when the prepared pruning token exchange fails or returns an
 * unexpected payload. Unsupported browser signalling and browser-side signal
 * failures are returned as warnings when the helper can otherwise complete.
 *
 * @category Passkeys (errors)
 */
export class PruningError extends Error {
  readonly _tag = "@error/Pruning" as const
  readonly message: string
  readonly code: "PASSKEY_PRUNING_UNSUPPORTED" | "OTHER_ERROR"

  constructor({
    message,
    code,
  }: { message: string; code: "PASSKEY_PRUNING_UNSUPPORTED" | "OTHER_ERROR" }) {
    super()
    this.message = message
    this.code = code
  }
}

/**
 * Raised when the prepared update token exchange fails or returns an
 * unexpected payload. Unsupported browser signalling and browser-side signal
 * failures are returned as warnings when the helper can otherwise complete.
 *
 * @category Passkeys (errors)
 */
export const isUpdateError = (payload: unknown): payload is UpdateError => {
  if (typeof payload !== "object") return false
  if (payload === null) return false
  return payload instanceof UpdateError
}

/**
 * Raised when the prepared update token exchange fails or returns an
 * unexpected payload. Unsupported browser signalling and browser-side signal
 * failures are returned as warnings when the helper can otherwise complete.
 *
 * @category Passkeys (errors)
 */
export class UpdateError extends Error {
  readonly _tag = "@error/Update" as const
  readonly message: string
  readonly code: "PASSKEY_UPDATE_UNSUPPORTED" | "OTHER_ERROR"

  constructor({
    message,
    code,
  }: { message: string; code: "PASSKEY_UPDATE_UNSUPPORTED" | "OTHER_ERROR" }) {
    super()
    this.message = message
    this.code = code
  }
}
