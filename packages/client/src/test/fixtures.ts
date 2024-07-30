import { BadRequest } from '@passlock/shared/dist/error/error.js'
import type { Principal } from '@passlock/shared/dist/schema/principal.js'
import { Effect as E, Layer as L } from 'effect'
import { Capabilities } from '../capabilities/capabilities.js'
import { StorageService, type StoredToken } from '../storage/storage.js'

export const session = 'session'
export const token = 'token'
export const code = 'code'
export const auth_type = 'passkey'
export const expire_at = Date.now() + 10000

export const principal: Principal = {
  jti: 'token',
  token: 'token',
  sub: 'user-1',
  iss: 'idp.passlock.dev',
  aud: 'tenancy_id',
  iat: new Date(),
  nbf: new Date(),
  exp: new Date(Date.now() + 5 * 60 * 1000),
  email: 'john.doe@gmail.com',
  given_name: 'john',
  family_name: 'doe',
  email_verified: false,
  auth_type: 'passkey',
  auth_id: 'auth-1',
  user_verified: true,
}

export const capabilitiesTest = L.succeed(
  Capabilities,
  Capabilities.of({
    passkeySupport: E.void,
    isPasskeySupport: E.succeed(true),
    autofillSupport: E.void,
    isAutofillSupport: E.succeed(true),
  }),
)

export const storedToken: StoredToken = { token, auth_type: auth_type, expiry: expire_at }

export const storageServiceTest = L.succeed(
  StorageService,
  StorageService.of({
    storeToken: () => E.void,
    getToken: () => E.succeed(storedToken),
    clearToken: () => E.void,
    clearExpiredToken: () => E.void,
    clearExpiredTokens: E.void,
  }),
)

export const notImplemented = new BadRequest({ message: 'Not implemented' })
