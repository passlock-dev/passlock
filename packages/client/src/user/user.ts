/**
 * Check for an existing user
 */
import { Context, Effect as E, Layer, flow } from 'effect'

import type { BadRequest, Disabled, NotFound } from '@passlock/shared/dist/error/error.js'
import type { VerifyEmail } from '@passlock/shared/dist/schema/email.js'
import * as RPC from '../rpc/user.js'

/* Requests */

export type Email = { email: string }
export type ResendEmail = VerifyEmail & { userId: string }

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

type Dependencies = RPC.UserClient

export const isExistingUser = (request: Email): E.Effect<boolean, BadRequest, Dependencies> => {
  return E.gen(function* (_) {
    yield* _(E.logInfo('Checking registration status'))
    const rpcClient = yield* _(RPC.UserClient)

    yield* _(E.logDebug('Making RPC request'))
    const { existingUser } = yield* _(rpcClient.isExistingUser(new RPC.IsExistingUserRequest(request)))

    return existingUser
  })
}

export const resendVerificationEmail = (
  request: ResendEmail,
): E.Effect<void, ResendEmailErrors, Dependencies> => {
  return E.gen(function* (_) {
    yield* _(E.logInfo('Resending verification email'))
    const rpcClient = yield* _(RPC.UserClient)

    yield* _(E.logDebug('Making RPC request'))
    const { userId, ...verifyEmail } = request
    yield* _(rpcClient.resendVerificationEmail(new RPC.ResendEmailRequest({ userId, verifyEmail })))
  })
}

/* Live */

/* v8 ignore start */
export const UserServiceLive = Layer.effect(
  UserService,
  E.gen(function* (_) {
    const context = yield* _(E.context<RPC.UserClient>())
    return UserService.of({
      isExistingUser: flow(isExistingUser, E.provide(context)),
      resendVerificationEmail: flow(resendVerificationEmail, E.provide(context)),
    })
  }),
)
/* v8 ignore stop */
