import * as S from '@effect/schema/Schema'
import { Context, type Effect as E } from 'effect'

import { BadRequest, Disabled, Forbidden, NotFound, Unauthorized } from '../error/error.js'
import { VerifyEmail } from '../schema/email.js'
import { Principal } from '../schema/principal.js'

/* Is existing user */

export class IsExistingUserRequest extends S.Class<IsExistingUserRequest>(
  '@user/isExistingUser/request',
)({
  email: S.String,
}) {}

export class IsExistingUserResponse extends S.Class<IsExistingUserResponse>(
  '@user/isExistingUser/response',
)({
  existingUser: S.Boolean,
  detail: S.OptionFromUndefinedOr(S.String),
}) {}

/* Verify email */

export class VerifyEmailRequest extends S.Class<VerifyEmailRequest>('@user/verifyEmail/request')({
  code: S.String,
  token: S.String,
}) {}

export class VerifyEmailResponse extends S.Class<VerifyEmailResponse>('@user/verifyEmail/response')({
  principal: Principal,
}) {}

export const VerifyEmailErrors = S.Union(BadRequest, NotFound, Disabled, Unauthorized, Forbidden)

export type VerifyEmailErrors = S.Schema.Type<typeof VerifyEmailErrors>

/* Resend email */

export class ResendEmailRequest extends S.Class<ResendEmailRequest>('@user/resendEmail/request')({
  userId: S.String,
  verifyEmail: VerifyEmail,
}) {}

export class ResendEmailResponse extends S.Class<ResendEmailResponse>('@user/resendEmail/response')(
  {},
) {}

export const ResendEmailErrors = S.Union(BadRequest, NotFound, Disabled)

export type ResendEmailErrors = S.Schema.Type<typeof ResendEmailErrors>

/* Endpoints */

export const USER_STATUS_ENDPOINT = '/user/status'
export const VERIFY_EMAIL_ENDPOINT = '/user/verify-email'
export const RESEND_EMAIL_ENDPOINT = '/user/verify-email/resend'

/* Service */

export type UserService = {
  isExistingUser: (req: IsExistingUserRequest) => E.Effect<IsExistingUserResponse, BadRequest>
  verifyEmail: (req: VerifyEmailRequest) => E.Effect<VerifyEmailResponse, VerifyEmailErrors>
  resendVerificationEmail: (
    req: ResendEmailRequest,
  ) => E.Effect<ResendEmailResponse, ResendEmailErrors>
}

/* Handler */

export class UserHandler extends Context.Tag('@user/handler')<UserHandler, UserService>() {}
