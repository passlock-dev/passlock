import type {
  BadRequest,
  Disabled,
  Duplicate,
  Forbidden,
  NotFound,
  NotSupported,
  Unauthorized,
} from '@passlock/shared/dist/error/error.js'

import { ErrorCode } from '@passlock/shared/dist/error/error.js'
import { RpcConfig } from '@passlock/shared/dist/rpc/config.js'
import type { VerifyEmail } from '@passlock/shared/dist/schema/email.js'
import type { UserVerification } from '@passlock/shared/dist/schema/passkey.js'
import type { Principal, UserPrincipal } from '@passlock/shared/dist/schema/principal.js'

import { Effect as E, Layer as L, Layer, Option as O, Runtime, Scope, pipe } from 'effect'

import type { AuthenticationService } from './authentication/authenticate.js'
import type { Capabilities } from './capabilities/capabilities.js'
import type { ConnectionService } from './connection/connection.js'

import { dual } from 'effect/Function'
import {
  allRequirements,
  authenticateOidc,
  authenticatePasskey,
  clearExpiredTokens,
  getSessionToken,
  isExistingUser,
  isPasskeySupport,
  preConnect,
  registerOidc,
  registerPasskey,
  resendVerificationEmail,
  verifyEmailCode,
  verifyEmailLink,
} from './effect.js'
import type { EmailService, VerifyRequest } from './email/email.js'
import type { RegistrationService } from './registration/register.js'
import type { Provider, SocialService } from './social/social.js'
import {
  type AuthType,
  BrowserStorage,
  StorageService,
  type StoredToken,
} from './storage/storage.js'
import type { Email, ResendEmail, UserService } from './user/user.js'

/* Exports */

export type Options = { signal?: AbortSignal }
export type { VerifyEmail } from '@passlock/shared/dist/schema/email.js'
export type { UserVerification } from '@passlock/shared/dist/schema/passkey.js'
export type { Principal } from '@passlock/shared/dist/schema/principal.js'

export type { VerifyRequest } from './email/email.js'
export type { AuthType, StoredToken } from './storage/storage.js'
export type { Email } from './user/user.js'

export type PasslockProps = {
  tenancyId: string
  clientId: string
  endpoint?: string
}

export type RegistrationRequest = {
  email: string
  given_name?: string
  family_name?: string
  user_verification?: UserVerification
  verify_email?: VerifyEmail
}

const nonEmpty = (text: string): O.Option<string> => {
  const trimmed = text.trim()
  if (trimmed.length > 0) return O.some(trimmed)
  return O.none()
}

const toRpcRegistrationRequest = (request: RegistrationRequest) => {
  return {
    email: request.email,
    given_name: pipe(O.fromNullable(request.given_name), O.flatMap(nonEmpty)),
    family_name: pipe(O.fromNullable(request.family_name), O.flatMap(nonEmpty)),
    user_verification: O.fromNullable(request.user_verification),
    verify_email: O.fromNullable(request.verify_email),
  }
}

export type AuthenticationRequest = {
  email?: string
  user_verification?: UserVerification
}

const toRpcAuthenticationRequest = (request: AuthenticationRequest) => {
  return {
    email: O.fromNullable(request.email),
    user_verification: O.fromNullable(request.user_verification),
  }
}

export type RegisterOidcReq = {
  provider: Provider
  id_token: string
  given_name?: string
  family_name?: string
  nonce: string
}

const toRpcRegisterOidcReq = (request: RegisterOidcReq) => {
  return {
    provider: request.provider,
    id_token: request.id_token,
    given_name: pipe(O.fromNullable(request.given_name), O.flatMap(nonEmpty)),
    family_name: pipe(O.fromNullable(request.family_name), O.flatMap(nonEmpty)),
    nonce: request.nonce,
  }
}

export type AuthenticateOidcReq = {
  provider: Provider
  id_token: string
  nonce: string
}

const toRpcAuthenticateOidcReq = (request: AuthenticateOidcReq) => {
  return {
    provider: request.provider,
    id_token: request.id_token,
    nonce: request.nonce,
  }
}

export { ErrorCode } from '@passlock/shared/dist/error/error.js'

export class PasslockError extends Error {
  readonly code: ErrorCode
  readonly detail: string | undefined

  constructor(message: string, code: ErrorCode, detail?: string) {
    super(message)
    this.code = code
    this.detail = detail
  }

  static readonly isError = (error: unknown): error is PasslockError => {
    return typeof error === 'object' && error !== null && error instanceof PasslockError
  }
}

/* // Exports */

type PasslockErrors =
  | BadRequest
  | NotSupported
  | Duplicate
  | Unauthorized
  | Forbidden
  | Disabled
  | NotFound

const hasMessage = (defect: unknown): defect is { message: string } => {
  return (
    typeof defect === 'object' &&
    defect !== null &&
    'message' in defect &&
    typeof defect['message'] === 'string'
  )
}

const transformErrors = <A, R>(
  effect: E.Effect<A, PasslockErrors, R>,
): E.Effect<A | PasslockError, never, R> => {
  const withErrorHandling = E.catchTags(effect, {
    NotSupported: e => E.succeed(new PasslockError(e.message, ErrorCode.NotSupported)),
    BadRequest: e => E.succeed(new PasslockError(e.message, ErrorCode.BadRequest, e.detail)),
    Duplicate: e => E.succeed(new PasslockError(e.message, ErrorCode.Duplicate, e.detail)),
    Unauthorized: e => E.succeed(new PasslockError(e.message, ErrorCode.Unauthorized, e.detail)),
    Forbidden: e => E.succeed(new PasslockError(e.message, ErrorCode.Forbidden, e.detail)),
    Disabled: e => E.succeed(new PasslockError(e.message, ErrorCode.Disabled, e.detail)),
    NotFound: e => E.succeed(new PasslockError(e.message, ErrorCode.NotFound, e.detail)),
  })

  const sandboxed = E.sandbox(withErrorHandling)

  const withSandboxing = E.catchTags(sandboxed, {
    Die: ({ defect }) => {
      return hasMessage(defect)
        ? E.succeed(new PasslockError(defect.message, ErrorCode.InternalServerError))
        : E.succeed(new PasslockError('Sorry, something went wrong', ErrorCode.InternalServerError))
    },

    Interrupt: () => {
      console.error("Interrupt")
      return E.succeed(new PasslockError('Operation aborted', ErrorCode.InternalBrowserError))
    },

    Sequential: errors => {
      console.error(errors)

      return E.succeed(
        new PasslockError('Sorry, something went wrong', ErrorCode.InternalServerError),
      )
    },

    Parallel: errors => {
      console.error(errors)
      
      return E.succeed(
        new PasslockError('Sorry, something went wrong', ErrorCode.InternalServerError),
      )
    },
  })

  return E.unsandbox(withSandboxing)
}

type Requirements =
  | UserService
  | RegistrationService
  | AuthenticationService
  | ConnectionService
  | EmailService
  | StorageService
  | Capabilities
  | SocialService
  | RpcConfig

export class PasslockUnsafe {
  private readonly runtime: Runtime.Runtime<Requirements>

  constructor(props: PasslockProps) {
    const config = Layer.succeed(RpcConfig, RpcConfig.of(props))
    const storage = Layer.succeed(BrowserStorage, BrowserStorage.of(globalThis.localStorage))

    const allLayers = pipe(allRequirements, L.provide(config), L.provide(storage), L.merge(config))

    const scope = E.runSync(Scope.make())
    this.runtime = E.runSync(Layer.toRuntime(allLayers).pipe(Scope.extend(scope)))
  }

  static isUserPrincipal = (principal: Principal): principal is UserPrincipal => {
    return (
      principal.given_name !== undefined &&
      principal.family_name !== undefined &&
      principal.email !== undefined &&
      principal.email_verified !== undefined
    )
  }

  private readonly runPromise: {
    <A, R extends Requirements>(options: Options | undefined): (effect: E.Effect<A, PasslockErrors, R>) => Promise<A>
    <A, R extends Requirements>(effect: E.Effect<A, PasslockErrors, R>, options: Options | undefined): Promise<A>
  } = dual(
    2,
    <A, R extends Requirements>(effect: E.Effect<A, PasslockErrors, R>, options: Options | undefined): Promise<A> => pipe(
      transformErrors(effect), 
      E.flatMap(result => (PasslockError.isError(result) ? E.fail(result) : E.succeed(result))),
      effect => Runtime.runPromise(this.runtime)(effect, options)
    )
  )

  preConnect = (options?: Options): Promise<void> => pipe(preConnect(), this.runPromise(options))

  arePasskeysSupported = (): Promise<boolean> =>
    pipe(isPasskeySupport, effect => Runtime.runPromise(this.runtime)(effect))

  isExistingUser = (email: Email, options?: Options): Promise<boolean> =>
    pipe(isExistingUser(email), this.runPromise(options))

  registerPasskey = (request: RegistrationRequest, options?: Options): Promise<Principal> =>
    pipe(registerPasskey(toRpcRegistrationRequest(request)), this.runPromise(options))

  authenticatePasskey = (request: AuthenticationRequest, options?: Options): Promise<Principal> =>
    pipe(authenticatePasskey(toRpcAuthenticationRequest(request)), this.runPromise(options))

  registerOidc = (request: RegisterOidcReq, options?: Options) =>
    pipe(registerOidc(toRpcRegisterOidcReq(request)), this.runPromise(options))

  authenticateOidc = (request: AuthenticateOidcReq, options?: Options) =>
    pipe(authenticateOidc(toRpcAuthenticateOidcReq(request)), this.runPromise(options))

  verifyEmailCode = (request: VerifyRequest, options?: Options): Promise<Principal> =>
    pipe(verifyEmailCode(request), this.runPromise(options))

  resendVerificationEmail = (request: ResendEmail, options?: Options): Promise<void> =>
    pipe(resendVerificationEmail(request), this.runPromise(options))

  verifyEmailLink = (options?: Options): Promise<Principal> =>
    pipe(verifyEmailLink, this.runPromise(options))

  getSessionToken = (auth_type: AuthType): StoredToken | undefined =>
    pipe(
      getSessionToken(auth_type),
      E.orElseSucceed(() => undefined),
      effect => Runtime.runSync(this.runtime)(effect),
    )

  clearExpiredTokens = (): void => {
    pipe(clearExpiredTokens, effect => {
      Runtime.runSync(this.runtime)(effect)
    })
  }
}

export class Passlock {
  private readonly runtime: Runtime.Runtime<Requirements>

  constructor(props: PasslockProps) {
    const config = Layer.succeed(RpcConfig, RpcConfig.of(props))
    const storage = Layer.succeed(BrowserStorage, BrowserStorage.of(globalThis.localStorage))
    const allLayers = pipe(allRequirements, L.provide(config), L.provide(storage), L.merge(config))
    const scope = E.runSync(Scope.make())

    this.runtime = E.runSync(Layer.toRuntime(allLayers).pipe(Scope.extend(scope)))
  }

  static isUserPrincipal = (principal: Principal): principal is UserPrincipal => {
    return (
      principal.given_name !== undefined &&
      principal.family_name !== undefined &&
      principal.email !== undefined &&
      principal.email_verified !== undefined
    )
  }

  private readonly runPromise: {
    <A, R extends Requirements>(options: Options | undefined): (effect: E.Effect<A, PasslockErrors, R>) => Promise<A | PasslockError>
    <A, R extends Requirements>(effect: E.Effect<A, PasslockErrors, R>, options: Options | undefined): Promise<A | PasslockError>
  } = dual(
    2,
    <A, R extends Requirements>(effect: E.Effect<A, PasslockErrors, R>, options: Options | undefined): Promise<A | PasslockError> => pipe(
      transformErrors(effect), 
      effect => Runtime.runPromise(this.runtime)(effect, options)
    )
  )

  preConnect = async (options?: Options): Promise<boolean | PasslockError> => {
    return pipe(
      preConnect(), 
      E.as(true), 
      this.runPromise(options)
    )
  }

  arePasskeysSupported = (): Promise<boolean> =>
    pipe(isPasskeySupport, effect => Runtime.runPromise(this.runtime)(effect))

  isExistingUser = (email: Email, options?: Options): Promise<boolean | PasslockError> =>
    pipe(isExistingUser(email), this.runPromise(options))

  registerPasskey = (
    request: RegistrationRequest,
    options?: Options,
  ): Promise<Principal | PasslockError> =>
    pipe(registerPasskey(toRpcRegistrationRequest(request)), this.runPromise(options))

  authenticatePasskey = (
    request: AuthenticationRequest = {},
    options?: Options,
  ): Promise<Principal | PasslockError> => pipe(
      toRpcAuthenticationRequest(request),
      authenticatePasskey, 
      this.runPromise(options)
    )

  registerOidc = (request: RegisterOidcReq, options?: Options) =>
    pipe(registerOidc(toRpcRegisterOidcReq(request)), this.runPromise(options))

  authenticateOidc = (request: AuthenticateOidcReq, options?: Options) =>
    pipe(authenticateOidc(request), this.runPromise(options))

  verifyEmailCode = (
    request: VerifyRequest,
    options?: Options,
  ): Promise<Principal | PasslockError> => pipe(verifyEmailCode(request), this.runPromise(options))

  verifyEmailLink = (options?: Options): Promise<Principal | PasslockError> =>
    pipe(verifyEmailLink, this.runPromise(options))

  resendVerificationEmail = (
    request: ResendEmail,
    options?: Options,
  ): Promise<boolean | PasslockError> =>
    pipe(resendVerificationEmail(request), E.as(true), this.runPromise(options))

  getSessionToken = (auth_type: AuthType): Promise<StoredToken | undefined> =>
    pipe(
      getSessionToken(auth_type),
      E.orElseSucceed(() => undefined),
      effect => E.runPromise(effect),
    )

  clearExpiredTokens = (): void => {
    pipe(
      StorageService,
      E.flatMap(service => service.clearExpiredTokens),
      effect => {
        Runtime.runSync(this.runtime)(effect)
      },
    )
  }
}
