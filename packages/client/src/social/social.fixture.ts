import * as Shared from '@passlock/shared/dist/rpc/social.js'
import { SocialClient } from '@passlock/shared/dist/rpc/social.js'
import { Effect as E, Layer as L, Option as O } from 'effect'
import * as Fixtures from '../test/fixtures.js'
import type { AuthenticateOidcReq, RegisterOidcReq } from './social.js'

export const session = 'session'
export const token = 'token'
export const code = 'code'
export const authType = 'passkey'
export const expireAt = Date.now() + 10000

export const registerOidcReq: RegisterOidcReq = {
  provider: 'google',
  idToken: 'google-token',
  nonce: 'nonce',
  givenName: 'john',
  familyName: 'doe'
}

export const authOidcReq: AuthenticateOidcReq = {
  provider: 'google',
  idToken: 'google-token',
  nonce: 'nonce'
}

export const rpcRegisterReq = new Shared.RegisterOidcReq({ 
  ...registerOidcReq, 
  givenName: O.fromNullable(registerOidcReq.givenName), 
  familyName: O.fromNullable(registerOidcReq.familyName) 
})

export const rpcRegisterRes = new Shared.PrincipalRes({ principal: Fixtures.principal })

export const rpcAuthenticateReq = new Shared.AuthOidcReq({ ...authOidcReq })

export const rpcAuthenticateRes = new Shared.PrincipalRes({ principal: Fixtures.principal })

export const rpcClientTest = L.succeed(
  SocialClient,
  SocialClient.of({
    registerOidc: () => E.fail(Fixtures.notImplemented),
    authenticateOidc: () => E.fail(Fixtures.notImplemented),
  })
)

export const principal = Fixtures.principal

export const capabilitiesTest = Fixtures.capabilitiesTest

export const storageServiceTest = Fixtures.storageServiceTest
