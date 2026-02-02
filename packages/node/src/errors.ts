/* Unauthorized */

const isTagged =
  <A extends { _tag: string }>(tag: A["_tag"]) =>
  (payload: unknown): payload is A => {
    if (typeof payload !== "object") return false
    if (payload === null) return false

    if (!("_tag" in payload)) return false
    if (typeof payload._tag !== "string") return false
    if (payload._tag !== tag) return false

    return true
  }

/**
 * @category Authentication
 */
export type Unauthorized = {
  _tag: "@error/Unauthorized"
  message: string
}

export const isUnauthorized = isTagged<Unauthorized>("@error/Unauthorized")

/* Forbidden */

/**
 * @category Authentication
 */
export type Forbidden = {
  _tag: "@error/Forbidden"
  message: string
}

export const isForbidden = isTagged<Forbidden>("@error/Forbidden")

/* InvalidCode */

/**
 * @category Principal
 */
export type InvalidCode = {
  _tag: "@error/InvalidCode"
  message: string
}

export const isInvalidCode = isTagged<InvalidCode>("@error/InvalidCode")

/* VerificationFailure */

/**
 * @category Principal
 */
export type VerificationFailure = {
  _tag: "@error/VerificationFailure"
  message: string
}

export const isVerificationFailure = isTagged<VerificationFailure>(
  "@error/VerificationFailure"
)

/* InvalidTenancy */

export type InvalidTenancy = {
  _tag: "@error/InvalidTenancy"
  message: string
}

export const isInvalidTenancy = isTagged<InvalidTenancy>(
  "@error/InvalidTenancy"
)

/* PasskeyNotFound */

/**
 * Error payload returned when a passkey cannot be found for a given
 * authentication attempt.
 *
 * @category Passkeys
 */
export type PasskeyNotFound = {
  _tag: "@error/PasskeyNotFound"
  message: string
  credentialId: string
  rpId: string
}

export const isPasskeyNotFound = isTagged<PasskeyNotFound>(
  "@error/PasskeyNotFound"
)

/* NotFound */

export type NotFound = {
  _tag: "@error/NotFound"
  message: string
}

export const isNotFound = isTagged<NotFound>("@error/NotFound")

/* InvalidEmail */

export type InvalidEmail = {
  _tag: "@error/InvalidEmail"
  message: string
}

export const isInvalidEmail = isTagged<InvalidEmail>("@error/InvalidEmail")

/* DuplicateEmail */

export type DuplicateEmail = {
  _tag: "@error/DuplicateEmail"
  message: string
}

export const isDuplicateEmail = isTagged<DuplicateEmail>(
  "@error/DuplicateEmail"
)

/* BadRequest */

export type BadRequest = {
  _tag: "@error/BadRequest"
  message: string
}

export const isBadRequest = isTagged<BadRequest>("@error/BadRequest")
