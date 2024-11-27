import { create, get as getCredential } from '@github/webauthn-json/browser-ponyfill'
import { Effect as E, Layer as L, Layer, Schedule, pipe } from 'effect'
import type { NoSuchElementException } from 'effect/Cause'

import {
  type BadRequest,
  Duplicate,
  InternalBrowserError,
} from '@passlock/shared/dist/error/error.js'
import type { Principal } from '@passlock/shared/dist/schema/principal.js'

import {
  AuthenticateServiceLive,
  type AuthenticationErrors,
  type AuthenticationRequest,
  AuthenticationService,
  GetCredential,
} from './authentication/authenticate.js'
import { Capabilities, capabilitiesLive } from './capabilities/capabilities.js'
import { ConnectionService, ConnectionServiceLive } from './connection/connection.js'
import {
  EmailService,
  EmailServiceLive,
  URLQueryString,
  type VerifyEmailErrors,
  type VerifyRequest,
} from './email/email.js'
import {
  CreateCredential,
  type RegistrationErrors,
  type RegistrationRequest,
  RegistrationService,
  RegistrationServiceLive,
} from './registration/register.js'
import { AuthenticationClientLive } from './rpc/passkey/authentication.js'
import { DispatcherLive } from './rpc/client.js'
import type { RpcConfig } from './rpc/config.js'
import { RetrySchedule } from './rpc/config.js'
import { ConnectionClientLive } from './rpc/connection.js'
import { RegistrationClientLive } from './rpc/passkey/registration.js'
import { SocialClientLive } from './rpc/social.js'
import { UserClientLive } from './rpc/user.js'
import {
  type AuthenticateOidcReq,
  type AuthenticationErrors as OidcAuthenticationErrors,
  type RegistrationErrors as OidcRegistrationErrors,
  type RegisterOidcReq,
  SocialService,
  SocialServiceLive,
} from './social/social.js'
import {
  type AuthType,
  BrowserStorage,
  StorageService,
  StorageServiceLive,
  type StoredToken,
} from './storage/storage.js'
import {
  type Email,
  type ResendEmail,
  type ResendEmailErrors,
  UserService,
  UserServiceLive,
} from './user/user.js'

/* Layers */

const createCredentialLive = L.succeed(
  CreateCredential,
  CreateCredential.of({
    createCredential: options =>
      pipe(
        E.tryPromise({
          try: () => create(options),
          catch: e => {
            if (e instanceof Error && e.message.includes('excludeCredentials')) {
              return new Duplicate({
                message: 'Passkey already registered to this device or cloud account',
              })
            } else {
              return new InternalBrowserError({
                message: 'Unable to create credential',
                detail: String(e),
              })
            }
          },
        }),
        E.map(credential => credential.toJSON()),
      ),
  }),
)

const getCredentialLive = L.succeed(
  GetCredential,
  GetCredential.of({
    getCredential: (options: CredentialRequestOptions) =>
      pipe(
        E.tryPromise({
          try: () => getCredential(options),
          catch: e =>
            new InternalBrowserError({
              message: 'Unable to get authentication credential',
              detail: String(e),
            }),
        }),
        E.map(credential => credential.toJSON()),
      ),
  }),
)

const schedule = Schedule.intersect(Schedule.recurs(3), Schedule.exponential('100 millis'))

const retryScheduleLive = L.succeed(RetrySchedule, RetrySchedule.of({ schedule }))

/* Services */
const dispatcherLive = pipe(DispatcherLive, L.provide(retryScheduleLive))
const connectClientLive = pipe(ConnectionClientLive, L.provide(dispatcherLive))
const registerClientLive = pipe(RegistrationClientLive, L.provide(dispatcherLive))
const authenticateClientLive = pipe(AuthenticationClientLive, L.provide(dispatcherLive))
const socialClientLive = pipe(SocialClientLive, L.provide(dispatcherLive))
const userClientLive = pipe(UserClientLive, L.provide(dispatcherLive))
const storageServiceLive = StorageServiceLive
const userServiceLive = pipe(UserServiceLive, L.provide(userClientLive))

const registrationServiceLive = pipe(
  RegistrationServiceLive,
  L.provide(registerClientLive),
  L.provide(userServiceLive),
  L.provide(capabilitiesLive),
  L.provide(createCredentialLive),
  L.provide(storageServiceLive),
)

const authenticationServiceLive = pipe(
  AuthenticateServiceLive,
  L.provide(authenticateClientLive),
  L.provide(capabilitiesLive),
  L.provide(getCredentialLive),
  L.provide(storageServiceLive),
)

const connectionServiceLive = pipe(
  ConnectionServiceLive,
  L.provide(connectClientLive),
  L.provide(dispatcherLive),
)

const urlQueryStringLive = Layer.succeed(
  URLQueryString,
  URLQueryString.of(E.sync(() => globalThis.window.location.search)),
)

const emailServiceLive = pipe(
  EmailServiceLive,
  L.provide(urlQueryStringLive),
  L.provide(userClientLive),
  L.provide(capabilitiesLive),
  L.provide(authenticationServiceLive),
  L.provide(storageServiceLive),
)

const socialServiceLive = pipe(SocialServiceLive, L.provide(socialClientLive))

export const allRequirements = Layer.mergeAll(
  capabilitiesLive,
  userServiceLive,
  registrationServiceLive,
  authenticationServiceLive,
  connectionServiceLive,
  emailServiceLive,
  storageServiceLive,
  socialServiceLive,
)

const browserStorageLive = Layer.effect(
  BrowserStorage,
  E.sync(() => BrowserStorage.of(globalThis.localStorage)),
)

export const preConnect = (): E.Effect<void, never, RpcConfig> =>
  pipe(
    ConnectionService,
    E.flatMap(service => service.preConnect()),
    E.provide(connectionServiceLive),
  )

export const isPasskeySupport: E.Effect<boolean> = pipe(
  Capabilities,
  E.flatMap(service => service.isPasskeySupport),
  E.provide(capabilitiesLive),
)

export const isExistingUser = (request: Email): E.Effect<boolean, BadRequest, RpcConfig> =>
  pipe(
    UserService,
    E.flatMap(service => service.isExistingUser(request)),
    E.provide(userServiceLive),
  )

export const registerPasskey = (
  request: RegistrationRequest,
): E.Effect<Principal, RegistrationErrors, RpcConfig> =>
  pipe(
    RegistrationService,
    E.flatMap(service => service.registerPasskey(request)),
    E.provide(registrationServiceLive),
    E.provide(browserStorageLive),
  )

export const authenticatePasskey = (
  request: AuthenticationRequest,
): E.Effect<Principal, AuthenticationErrors, RpcConfig> =>
  pipe(
    AuthenticationService,
    E.flatMap(service => service.authenticatePasskey(request)),
    E.provide(authenticationServiceLive),
    E.provide(browserStorageLive),
  )

export const verifyEmailCode = (
  request: VerifyRequest,
): E.Effect<Principal, VerifyEmailErrors, RpcConfig> =>
  pipe(
    EmailService,
    E.flatMap(service => service.verifyEmailCode(request)),
    E.provide(emailServiceLive),
    E.provide(browserStorageLive),
  )

export const verifyEmailLink: E.Effect<Principal, VerifyEmailErrors, RpcConfig> = pipe(
  EmailService,
  E.flatMap(service => service.verifyEmailLink()),
  E.provide(emailServiceLive),
  E.provide(browserStorageLive),
)

export const resendVerificationEmail = (
  request: ResendEmail,
): E.Effect<void, ResendEmailErrors, RpcConfig> =>
  pipe(
    UserService,
    E.flatMap(service => service.resendVerificationEmail(request)),
    E.provide(userServiceLive),
    E.provide(browserStorageLive),
  )

export const getSessionToken = (
  authType: AuthType,
): E.Effect<StoredToken, NoSuchElementException> =>
  pipe(
    StorageService,
    E.flatMap(service => service.getToken(authType)),
    E.provide(storageServiceLive),
    E.provide(browserStorageLive),
  )

export const clearExpiredTokens: E.Effect<void> = pipe(
  StorageService,
  E.flatMap(service => service.clearExpiredTokens),
  E.provide(storageServiceLive),
  E.provide(browserStorageLive),
)

export const registerOidc = (
  request: RegisterOidcReq,
): E.Effect<Principal, OidcRegistrationErrors, RpcConfig> =>
  pipe(
    SocialService,
    E.flatMap(service => service.registerOidc(request)),
    E.provide(socialServiceLive),
  )

export const authenticateOidc = (
  request: AuthenticateOidcReq,
): E.Effect<Principal, OidcAuthenticationErrors, RpcConfig> =>
  pipe(
    SocialService,
    E.flatMap(service => service.authenticateOidc(request)),
    E.provide(socialServiceLive),
  )
