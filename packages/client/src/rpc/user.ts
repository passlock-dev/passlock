import * as S from '@effect/schema/Schema'
import { IsExistingUserReq, IsExistingUserRes, RESEND_EMAIL_ENDPOINT, ResendEmailErrors, ResendEmailReq, ResendEmailRes, USER_STATUS_ENDPOINT, VERIFY_EMAIL_ENDPOINT, VerifyEmailErrors, VerifyEmailReq, VerifyEmailRes, type UserService } from '@passlock/shared/dist/rpc/user.js'
import { Context, Effect as E, Layer } from 'effect'
import { Dispatcher, makePostRequest } from './client.js'

/* Client */

export class UserClient extends Context.Tag('@user/client')<UserClient, UserService>() {}

export const UserClientLive = Layer.effect(
  UserClient,
  E.gen(function* (_) {
    const dispatcher = yield* _(Dispatcher)

    const isExistingUserResolver = makePostRequest(
      IsExistingUserReq,
      IsExistingUserRes,
      S.Never,
      dispatcher,
    )

    const verifyEmailResolver = makePostRequest(
      VerifyEmailReq,
      VerifyEmailRes,
      VerifyEmailErrors,
      dispatcher,
    )

    const resendEmailResolver = makePostRequest(
      ResendEmailReq,
      ResendEmailRes,
      ResendEmailErrors,
      dispatcher,
    )

    return {
      isExistingUser: req => isExistingUserResolver(USER_STATUS_ENDPOINT, req),
      verifyEmail: req => verifyEmailResolver(VERIFY_EMAIL_ENDPOINT, req),
      resendVerificationEmail: req => resendEmailResolver(RESEND_EMAIL_ENDPOINT, req),
    }
  }),
)
