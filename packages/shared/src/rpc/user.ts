import * as S from '@effect/schema/Schema'
import { Context, Effect as E, Layer } from 'effect'

import { BadRequest } from '../error/error.js'
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

/* Service */

export type UserService = {
  isExistingUser: (req: IsExistingUserReq) => E.Effect<IsExistingUserRes, BadRequest>
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

    return {
      isExistingUser: req => isExistingUserResolver(USER_STATUS_ENDPOINT, req),
    }
  })
)

/* Handler */

export class UserHandler extends Context.Tag('@user/handler')<
  UserClient,
  UserService
>() {}