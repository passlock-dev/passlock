/*
 * Publicly exposed errors.
 * The errors we receive from the API live in the schemas/errors.ts module.
 * The errors here have the same shape but they are simple types
 * so are easier for non Effect consumers to handle.
 */

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

/* Unauthorized */

/**
 * @category Authentication
 */
export type UnauthorizedError = {
  _tag: "@error/Unauthorized"
  message: string
}

export const isUnauthorizedError = isTagged<UnauthorizedError>(
  "@error/Unauthorized"
)

/* Forbidden */

/**
 * @category Authentication
 */
export type ForbiddenError = {
  _tag: "@error/Forbidden"
  message: string
}

export const isForbiddenError = isTagged<ForbiddenError>("@error/Forbidden")

/* InvalidCode */

/**
 * @category Principal
 */
export type InvalidCodeError = {
  _tag: "@error/InvalidCode"
  message: string
}

export const isInvalidCodeError =
  isTagged<InvalidCodeError>("@error/InvalidCode")

/* VerificationFailure */

/**
 * @category Principal
 */
export type VerificationError = {
  _tag: "@error/Verification"
  message: string
}

export const isVerificationError = isTagged<VerificationError>(
  "@error/Verification"
)

/* InvalidTenancy */

export type InvalidTenancyError = {
  _tag: "@error/InvalidTenancy"
  message: string
}

export const isInvalidTenancyError = isTagged<InvalidTenancyError>(
  "@error/InvalidTenancy"
)

/* PasskeyNotFound */

/**
 * Error payload returned when a passkey cannot be found for a given
 * authentication attempt.
 *
 * @category Passkeys
 */
export type PasskeyNotFoundError = {
  _tag: "@error/PasskeyNotFound"
  message: string
  credentialId: string
  rpId: string
}

export const isPasskeyNotFoundError = isTagged<PasskeyNotFoundError>(
  "@error/PasskeyNotFound"
)

/* NotFound */

export type NotFoundError = {
  _tag: "@error/NotFound"
  message: string
}

export const isNotFoundError = isTagged<NotFoundError>("@error/NotFound")

/* InvalidEmail */

export type InvalidEmailError = {
  _tag: "@error/InvalidEmail"
  message: string
}

export const isInvalidEmailError = isTagged<InvalidEmailError>(
  "@error/InvalidEmail"
)

/* DuplicateEmail */

export type DuplicateEmailError = {
  _tag: "@error/DuplicateEmail"
  message: string
}

export const isDuplicateEmailError = isTagged<DuplicateEmailError>(
  "@error/DuplicateEmail"
)

/* BadRequest */

export type BadRequestError = {
  _tag: "@error/BadRequest"
  message: string
}

export const isBadRequestError = isTagged<BadRequestError>("@error/BadRequest")
