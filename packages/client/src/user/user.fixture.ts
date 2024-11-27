import { Effect as E, Layer as L, Option as O } from 'effect'

import {
  IsExistingUserRequest,
  IsExistingUserResponse,
  ResendEmailRequest,
  ResendEmailResponse,
  VerifyEmailResponse,
} from '@passlock/shared/dist/rpc/user.js'

import * as Fixtures from '../test/fixtures.js'
import { UserClient } from '../rpc/user.js'
import type { ResendEmail } from './user.js'

export const email = 'jdoe@gmail.com'
export const isRegisteredReq = new IsExistingUserRequest({ email })
export const isRegisteredRes = new IsExistingUserResponse({ existingUser: false, detail: O.none() })
export const verifyEmailRes = new VerifyEmailResponse({ principal: Fixtures.principal })
export const resendEmailReq: ResendEmail = { userId: '123', method: 'code' }
export const rpcResendEmailReq = new ResendEmailRequest({
  userId: '123',
  verifyEmail: { method: 'code' },
})
export const rpcResendEmailRes = new ResendEmailResponse({})

export const rpcClientTest = L.succeed(
  UserClient,
  UserClient.of({
    isExistingUser: () => E.succeed({ existingUser: true, detail: O.none() }),
    verifyEmail: () => E.succeed(verifyEmailRes),
    resendVerificationEmail: () => E.fail(Fixtures.notImplemented),
  }),
)
