import { Effect as E, Layer as L, Option as O } from 'effect'

import * as Fixtures from '../test/fixtures.js'
import { SocialClient } from '../rpc/social.js'
import type { AuthenticateOidcReq } from './social.js'
import { OIDCAuthenticationRequest, OIDCRegistrationRequest, PrincipalResponse } from '@passlock/shared/dist/rpc/social.js'

export const session = 'session'
export const token = 'token'
export const code = 'code'
export const authType = 'passkey'
export const expireAt = Date.now() + 10000

export const registerOidcReq = new OIDCRegistrationRequest({
  provider: 'google',
  idToken: 'google-token',
  nonce: 'nonce',
  givenName: O.some('john'),
  familyName: O.some('doe'),
})

export const authOidcReq: AuthenticateOidcReq = new OIDCAuthenticationRequest({
  provider: 'google',
  idToken: 'google-token',
  nonce: 'nonce',
})

export const rpcRegisterRes = new PrincipalResponse({ principal: Fixtures.principal })

export const rpcAuthenticateRes = new PrincipalResponse({ principal: Fixtures.principal })

export const rpcClientTest = L.succeed(
  SocialClient,
  SocialClient.of({
    oidcRegistration: () => E.fail(Fixtures.notImplemented),
    oidcAuthentication: () => E.fail(Fixtures.notImplemented),
  }),
)

export const principal = Fixtures.principal

export const capabilitiesTest = Fixtures.capabilitiesTest

export const storageServiceTest = Fixtures.storageServiceTest
