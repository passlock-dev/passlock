import { IsExistingUserReq, IsExistingUserRes, ResendEmailReq, ResendEmailRes, UserClient, VerifyEmailRes } from '@passlock/shared/dist/rpc/user.js'
import { Effect as E, Layer as L } from 'effect'
import * as Fixtures from '../test/fixtures.js'
import type { ResendEmail } from './user.js'

export const email = 'jdoe@gmail.com'
export const isRegisteredReq = new IsExistingUserReq({ email })
export const isRegisteredRes = new IsExistingUserRes({ existingUser: false })
export const verifyEmailRes = new VerifyEmailRes({ principal: Fixtures.principal })
export const resendEmailReq: ResendEmail = { userId: '123', method: 'code' }
export const rpcResendEmailReq = new ResendEmailReq({ userId: '123', verifyEmail: { method: 'code' }})
export const rpcResendEmailRes = new ResendEmailRes({ })

export const rpcClientTest = L.succeed(
  UserClient,
  UserClient.of({
    isExistingUser: () => E.succeed({ existingUser: true }),
    verifyEmail: () => E.succeed(verifyEmailRes),
    resendVerificationEmail: () => E.fail(Fixtures.notImplemented),
  }),
)