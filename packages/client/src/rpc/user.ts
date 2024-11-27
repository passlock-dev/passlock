import * as S from '@effect/schema/Schema'
import { Context, Effect as E, Layer } from 'effect'

import {
  IsExistingUserRequest,
  IsExistingUserResponse,
  RESEND_EMAIL_ENDPOINT,
  ResendEmailErrors,
  ResendEmailRequest,
  ResendEmailResponse,
  USER_STATUS_ENDPOINT,
  type UserService,
  VERIFY_EMAIL_ENDPOINT,
  VerifyEmailErrors,
  VerifyEmailRequest,
  VerifyEmailResponse,
} from '@passlock/shared/dist/rpc/user.js'

import { Dispatcher, makePostRequest } from './client.js'

/* Client */

export class UserClient extends Context.Tag('@user/client')<UserClient, UserService>() {}

export const UserClientLive = Layer.effect(
  UserClient,
  E.gen(function* (_) {
    const dispatcher = yield* _(Dispatcher)

    const isExistingUserResolver = makePostRequest(
      IsExistingUserRequest,
      IsExistingUserResponse,
      S.Never,
      dispatcher,
    )

    const verifyEmailResolver = makePostRequest(
      VerifyEmailRequest,
      VerifyEmailResponse,
      VerifyEmailErrors,
      dispatcher,
    )

    const resendEmailResolver = makePostRequest(
      ResendEmailRequest,
      ResendEmailResponse,
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

export {
  IsExistingUserRequest,
  IsExistingUserResponse,
  ResendEmailErrors,
  ResendEmailRequest,
  ResendEmailResponse,
  VerifyEmailErrors,
  VerifyEmailRequest,
  VerifyEmailResponse,
} from '@passlock/shared/dist/rpc/user.js'
