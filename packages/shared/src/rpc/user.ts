import * as S from '@effect/schema/Schema'
import { Context, Effect as E, Layer } from 'effect'

import { VerifyEmail } from '../schema/email.js'
import { Principal } from '../schema/principal.js'

import { BadRequest, Disabled, Forbidden, NotFound, Unauthorized } from '../error/error.js'
import { makePostRequest } from './client.js'
import { Dispatcher } from './dispatcher.js'

/* Is existing user */

export class IsExistingUserReq extends S.Class<IsExistingUserReq>('@user/isExistingUserReq')({
  email: S.String
}) {}

export class IsExistingUserRes extends S.Class<IsExistingUserRes>('@user/isExistingUserRes')({
  existingUser: S.Boolean,
  detail: S.optional(S.String),
}) {}

/* Verify email */

export class VerifyEmailReq extends S.Class<VerifyEmailReq>('@user/verifyEmailReq')({
  code: S.String,
  token: S.String,
}) {}

export class VerifyEmailRes extends S.Class<VerifyEmailRes>('@user/verifyEmailRes')({
  principal: Principal,
}) {}

export const VerifyEmailErrors = S.Union(BadRequest, NotFound, Disabled, Unauthorized, Forbidden)

export type VerifyEmailErrors = S.Schema.Type<typeof VerifyEmailErrors>

/* Resend email */

export class ResendEmailReq extends S.Class<ResendEmailReq>('@user/resendEmailReq',)({
  userId: S.String,
  verifyEmail: VerifyEmail,
 }) { }

export class ResendEmailRes extends S.Class<ResendEmailRes>('@user/resendEmailRes')({ }) {}

export const ResendEmailErrors = S.Union(BadRequest, NotFound, Disabled)

export type ResendEmailErrors = S.Schema.Type<typeof ResendEmailErrors>

/* Service */

export type UserService = {
  isExistingUser: (req: IsExistingUserReq) => E.Effect<IsExistingUserRes, BadRequest>
  verifyEmail: (req: VerifyEmailReq) => E.Effect<VerifyEmailRes, VerifyEmailErrors>
  resendVerificationEmail: (req: ResendEmailReq) => E.Effect<ResendEmailRes, ResendEmailErrors>
}

/* Client */

export const USER_STATUS_ENDPOINT = '/user/status'
export const VERIFY_EMAIL_ENDPOINT = '/user/verify-email'
export const RESEND_EMAIL_ENDPOINT = '/user/verify-email/resend'

export class UserClient extends Context.Tag('@user/client')<
  UserClient,
  UserService
>() {}

export const UserClientLive = Layer.effect(
  UserClient,
  E.gen(function* (_) {
    const dispatcher = yield* _(Dispatcher)
    const isExistingUserResolver = makePostRequest(IsExistingUserReq, IsExistingUserRes, S.Never, dispatcher)
    const verifyEmailResolver = makePostRequest(VerifyEmailReq, VerifyEmailRes, VerifyEmailErrors, dispatcher)
    const resendEmailResolver = makePostRequest(ResendEmailReq, ResendEmailRes, ResendEmailErrors, dispatcher)

    return {
      isExistingUser: req => isExistingUserResolver(USER_STATUS_ENDPOINT, req),
      verifyEmail: req => verifyEmailResolver(VERIFY_EMAIL_ENDPOINT, req),
      resendVerificationEmail: req => resendEmailResolver(RESEND_EMAIL_ENDPOINT, req)
    }
  })
)

/* Handler */

export class UserHandler extends Context.Tag('@user/handler')<
  UserClient,
  UserService
>() {}