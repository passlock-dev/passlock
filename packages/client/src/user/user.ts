/**
 * Check for an existing user
 */
import type { BadRequest, Disabled, NotFound } from '@passlock/shared/dist/error/error.js'
import { IsExistingUserReq, ResendEmailReq, UserClient } from '@passlock/shared/dist/rpc/user.js'
import type { VerifyEmail } from '@passlock/shared/dist/schema/email.js'
import { Context, Effect as E, Layer, flow } from 'effect'

/* Requests */

export type Email = { email: string }
export type ResendEmail = VerifyEmail & { user_id: string }

/* Errors */

export type ResendEmailErrors = BadRequest | NotFound | Disabled

/* Service */

export class UserService extends Context.Tag('@services/UserService')<
  UserService,
  {
    isExistingUser: (request: Email) => E.Effect<boolean, BadRequest>
    resendVerificationEmail: (request: ResendEmail) => E.Effect<void, ResendEmailErrors>
  }
>() {}

/* Effects */

type Dependencies = UserClient

export const isExistingUser = (request: Email): E.Effect<boolean, BadRequest, Dependencies> => {
  return E.gen(function* (_) {
    yield* _(E.logInfo('Checking registration status'))
    const rpcClient = yield* _(UserClient)

    yield* _(E.logDebug('Making RPC request'))
    const { is_existing_user } = yield* _(rpcClient.isExistingUser(new IsExistingUserReq(request)))

    return is_existing_user
  })
}

export const resendVerificationEmail = (
  request: ResendEmail,
): E.Effect<void, ResendEmailErrors, Dependencies> => {
  return E.gen(function* (_) {
    yield* _(E.logInfo('Resending verification email'))
    const rpcClient = yield* _(UserClient)

    yield* _(E.logDebug('Making RPC request'))
    const { user_id, ...verify_email } = request
    yield* _(rpcClient.resendVerificationEmail(new ResendEmailReq({ user_id, verify_email })))
  })
}

/* Live */

/* v8 ignore start */
export const UserServiceLive = Layer.effect(
  UserService,
  E.gen(function* (_) {
    const context = yield* _(E.context<UserClient>())
    return UserService.of({
      isExistingUser: flow(isExistingUser, E.provide(context)),
      resendVerificationEmail: flow(resendVerificationEmail, E.provide(context)),
    })
  }),
)
/* v8 ignore stop */
