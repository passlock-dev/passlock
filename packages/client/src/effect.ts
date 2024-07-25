import { create, get as getCredential } from '@github/webauthn-json/browser-ponyfill'

import { AuthenticationClientLive } from '@passlock/shared/dist/rpc/authentication.js'
import { ConnectionClientLive } from '@passlock/shared/dist/rpc/connection.js'
import { RegistrationClientLive } from '@passlock/shared/dist/rpc/registration.js'
import { SocialClientLive } from '@passlock/shared/dist/rpc/social.js'
import { UserClientLive } from '@passlock/shared/dist/rpc/user.js'

import {
  Duplicate,
  InternalBrowserError,
  type BadRequest,
  type Disabled,
  type Forbidden,
  type NotFound,
  type NotSupported,
  type Unauthorized,
} from '@passlock/shared/dist/error/error.js'

import type { Principal } from '@passlock/shared/dist/schema/principal.js'

import { Context, Effect as E, Layer as L, Layer, Schedule, pipe } from 'effect'
import type { NoSuchElementException } from 'effect/Cause'

import {
  AuthenticateServiceLive,
  AuthenticationService,
  GetCredential,
  type AuthenticationRequest,
} from './authentication/authenticate.js'

import { capabilitiesLive } from './capabilities/capabilities.js'
import { ConnectionService, ConnectionServiceLive } from './connection/connection.js'
import { EmailService, EmailServiceLive, URLQueryString, type VerifyRequest } from './email/email.js'

import {
  CreateCredential,
  RegistrationService,
  RegistrationServiceLive,
  type RegistrationRequest,
} from './registration/register.js'

import {
  Storage,
  StorageService,
  StorageServiceLive,
  type AuthType,
  type StoredToken,
} from './storage/storage.js'

import { RetrySchedule, RpcConfig } from '@passlock/shared/dist/rpc/config.js'
import { DispatcherLive } from '@passlock/shared/dist/rpc/dispatcher.js'
import { SocialService, SocialServiceLive, type RegisterOidcReq } from './social/social.js'
import { UserService, UserServiceLive, type Email } from './user/user.js'

/* Layers */

const createCredentialLive = L.succeed(
  CreateCredential,
  CreateCredential.of((options: CredentialCreationOptions) =>
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
      E.map(credential => credential.toJSON())
    ),
  ),
)

const getCredentialLive = L.succeed(
  GetCredential,
  GetCredential.of((options: CredentialRequestOptions) =>
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
  ),
)

const schedule = Schedule.intersect(Schedule.recurs(3), Schedule.exponential('100 millis'))

const retryScheduleLive = L.succeed(RetrySchedule, RetrySchedule.of({ schedule }))

/* RPC Clients */
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

const socialServiceLive = pipe(
  SocialServiceLive,
  L.provide(socialClientLive),
)

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

export class Config extends Context.Tag('Config')<
  Config,
  {
    tenancyId: string
    clientId: string
    endpoint?: string
  }
>() {}

const storageLive = Layer.effect(
  Storage,
  E.sync(() => Storage.of(globalThis.localStorage)),
)

const exchangeConfig = <A, E>(effect: E.Effect<A, E, RpcConfig | Storage>) => {
  return pipe(
    Config,
    E.flatMap(config => E.provideService(effect, RpcConfig, RpcConfig.of(config))),
    effect => E.provide(effect, storageLive),
  )
}

export const preConnect = (): E.Effect<void, never, Config> =>
  pipe(
    ConnectionService,
    E.flatMap(service => service.preConnect()),
    E.provide(connectionServiceLive),
    exchangeConfig,
  )

export const isRegistered = (email: Email): E.Effect<boolean, BadRequest, Config> =>
  pipe(
    UserService,
    E.flatMap(service => service.isExistingUser(email)),
    E.provide(userServiceLive),
    exchangeConfig,
  )

export type RegistrationErrors = NotSupported | BadRequest | Duplicate | Unauthorized | Forbidden

export const registerPasskey = (
  request: RegistrationRequest,
): E.Effect<Principal, RegistrationErrors, Config> =>
  pipe(
    RegistrationService,
    E.flatMap(service => service.registerPasskey(request)),
    E.provide(registrationServiceLive),
    exchangeConfig,
  )

export type AuthenticationErrors =
  | NotSupported
  | BadRequest
  | NotFound
  | Disabled
  | Unauthorized
  | Forbidden

export const authenticatePasskey = (
  request: AuthenticationRequest,
): E.Effect<Principal, AuthenticationErrors, Config> =>
  pipe(
    AuthenticationService,
    E.flatMap(service => service.authenticatePasskey(request)),
    E.provide(authenticationServiceLive),
    exchangeConfig,
  )

export type VerifyEmailErrors =
  | NotSupported
  | BadRequest
  | NotFound
  | Disabled
  | Unauthorized
  | Forbidden

export const verifyEmailCode = (
  request: VerifyRequest,
): E.Effect<Principal, VerifyEmailErrors, Config> =>
  pipe(
    EmailService,
    E.flatMap(service => service.verifyEmailCode(request)),
    E.provide(emailServiceLive),
    exchangeConfig,
  )

export const verifyEmailLink = (): E.Effect<Principal, VerifyEmailErrors, Config> =>
  pipe(
    EmailService,
    E.flatMap(service => service.verifyEmailLink()),
    E.provide(emailServiceLive),
    exchangeConfig,
  )

export const getSessionToken = (
  authType: AuthType,
): E.Effect<StoredToken, NoSuchElementException> =>
  pipe(
    StorageService,
    E.flatMap(service => service.getToken(authType)),
    E.provide(storageServiceLive),
    E.provide(storageLive),
  )

export const clearExpiredTokens = (): E.Effect<void> =>
  pipe(
    StorageService,
    E.flatMap(service => service.clearExpiredTokens),
    E.provide(storageServiceLive),
    E.provide(storageLive),
  )

export const authenticateOIDC = (request: RegisterOidcReq) => 
  pipe(
    SocialService,
    E.flatMap(service => service.registerOidc(request)),
    E.provide(socialServiceLive)
  )