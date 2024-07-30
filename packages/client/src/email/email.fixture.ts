import { UserClient, VerifyEmailReq, VerifyEmailRes } from '@passlock/shared/dist/rpc/user.js'
import { Effect as E, Layer as L, Option as O } from 'effect'
import { URLQueryString } from './email.js'
import { AuthenticationService } from '../authentication/authenticate.js'
import * as Fixtures from '../test/fixtures.js'

export const token = 'token'
export const code = 'code'
export const authType = 'passkey'
export const expireAt = Date.now() + 10000

export const locationSearchTest = L.succeed(
  URLQueryString,
  URLQueryString.of(E.succeed(`?code=${code}`)),
)

export const authenticationServiceTest = L.succeed(
  AuthenticationService,
  AuthenticationService.of({
    authenticatePasskey: () => E.succeed(Fixtures.principal),
  }),
)

export const rpcVerifyEmailReq = new VerifyEmailReq({ token, code })

export const rpcVerifyEmailRes = new VerifyEmailRes({ principal: Fixtures.principal })

export const rpcClientTest = L.succeed(
  UserClient,
  UserClient.of({
    isExistingUser: () => E.succeed({ existingUser: true, detail: O.none() }),
    verifyEmail: () => E.succeed(rpcVerifyEmailRes),
    resendVerificationEmail: () => E.fail(Fixtures.notImplemented),
  }),
)

export const principal = Fixtures.principal

export const storedToken = Fixtures.storedToken

export const storageServiceTest = Fixtures.storageServiceTest
