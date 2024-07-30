import {
  IsExistingUserReq,
  IsExistingUserRes,
  ResendEmailReq,
  ResendEmailRes,
  UserClient,
  VerifyEmailRes,
} from '@passlock/shared/dist/rpc/user.js'
import { Effect as E, Layer as L, Option as O } from 'effect'
import * as Fixtures from '../test/fixtures.js'
import type { ResendEmail } from './user.js'

export const email = 'jdoe@gmail.com'
export const isRegisteredReq = new IsExistingUserReq({ email })
export const isRegisteredRes = new IsExistingUserRes({ is_existing_user: false, detail: O.none() })
export const verifyEmailRes = new VerifyEmailRes({ principal: Fixtures.principal })
export const resendEmailReq: ResendEmail = { user_id: '123', method: 'code' }
export const rpcResendEmailReq = new ResendEmailReq({
  user_id: '123',
  verify_email: { method: 'code' },
})
export const rpcResendEmailRes = new ResendEmailRes({})

export const rpcClientTest = L.succeed(
  UserClient,
  UserClient.of({
    isExistingUser: () => E.succeed({ is_existing_user: true, detail: O.none() }),
    verifyEmail: () => E.succeed(verifyEmailRes),
    resendVerificationEmail: () => E.fail(Fixtures.notImplemented),
  }),
)
