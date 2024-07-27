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
import { UserPrincipal, type Principal } from '@passlock/shared/dist/schema/principal.js'
import { Effect as E, Layer as L, Layer, Option as O, Runtime, Scope, pipe } from 'effect'
import { AuthenticationService } from './authentication/authenticate.js'
import { Capabilities } from './capabilities/capabilities.js'
import { ConnectionService } from './connection/connection.js'
import { allRequirements } from './effect.js'
import { EmailService, type VerifyRequest } from './email/email.js'
import { RegistrationService } from './registration/register.js'
import { SocialService, type Provider } from './social/social.js'
import { Storage, StorageService, type AuthType, type StoredToken } from './storage/storage.js'
import { UserService, type Email, type ResendEmail } from './user/user.js'

/* Exports */

export type Options = { signal?: AbortSignal }
export type { VerifyEmail } from '@passlock/shared/dist/schema/email.js'
export type { UserVerification } from '@passlock/shared/dist/schema/passkey.js'
export type { Principal } from '@passlock/shared/dist/schema/principal.js'

export type { VerifyRequest } from './email/email.js'
export type { AuthType, StoredToken } from './storage/storage.js'
export type { Email } from './user/user.js'

export type PasslockProps = {
  tenancyId: string; 
  clientId: string; 
  endpoint?: string
}

export type RegistrationRequest = {
  email: string
  givenName?: string
  familyName?: string
  userVerification?: UserVerification
  verifyEmail?: VerifyEmail
}

const toRpcRegistrationRequest = (request: RegistrationRequest) => {
  return {
    email: request.email,
    givenName: O.fromNullable(request.givenName),
    familyName: O.fromNullable(request.familyName),
    userVerification: O.fromNullable(request.userVerification),
    verifyEmail: O.fromNullable(request.verifyEmail)
  }
}

export type AuthenticationRequest = {
  email?: string
  userVerification?: UserVerification
}

const toRpcAuthenticationRequest = (request: AuthenticationRequest) => {
  return {
    email: O.fromNullable(request.email),
    userVerification: O.fromNullable(request.userVerification),
  }
}

export type RegisterOidcReq = {
  provider: Provider,
  idToken: string,
  givenName?: string,
  familyName?: string,
  nonce: string,
}

const toRpcRegisterOidcReq = (request: RegisterOidcReq) => {
  return {
    provider: request.provider,
    idToken: request.idToken,
    givenName: O.fromNullable(request.givenName),
    familyName: O.fromNullable(request.familyName),
    nonce: request.nonce
  }
}

export type AuthenticateOidcReq = {
  provider: Provider,
  idToken: string,
  nonce: string,
}


const toRpcAuthenticateOidcReq = (request: AuthenticateOidcReq) => {
  return {
    provider: request.provider,
    idToken: request.idToken,
    nonce: request.nonce
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
    return (
      typeof error === 'object' &&
      error !== null &&
      error instanceof PasslockError
    )
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

export class PasslockUnsafe {
  private readonly runtime: Runtime.Runtime<Requirements>

  constructor(config: PasslockProps) {
    const rpcConfig = Layer.succeed(RpcConfig, RpcConfig.of(config))
    const storage = Layer.succeed(Storage, Storage.of(globalThis.localStorage))
    const allLayers = pipe(allRequirements, L.provide(rpcConfig), L.provide(storage))
    const scope = E.runSync(Scope.make())
    this.runtime = E.runSync(Layer.toRuntime(allLayers).pipe(Scope.extend(scope)))
  }

  static isUserPrincipal = (principal: Principal): principal is UserPrincipal => {
    return principal.given_name !== undefined && 
    principal.family_name !== undefined && 
    principal.email !== undefined && 
    principal.email_verified !== undefined
  }

  private readonly runPromise = <A, R extends Requirements>(
    effect: E.Effect<A, PasslockErrors, R>,
    options: Options | undefined = undefined
  ) => {
    return pipe(
      transformErrors(effect),
      E.flatMap(result => (PasslockError.isError(result) ? E.fail(result) : E.succeed(result))),
      effect => Runtime.runPromise(this.runtime)(effect, options),
    )
  }

  preConnect = (options?: Options): Promise<void> =>
    pipe(
      ConnectionService,
      E.flatMap(service => service.preConnect()),
      effect => Runtime.runPromise(this.runtime)(effect, options),
    )

  isPasskeySupport = (): Promise<boolean> =>
    pipe(
      Capabilities,
      E.flatMap(service => service.isPasskeySupport),
      effect => Runtime.runPromise(this.runtime)(effect),
    )

  isExistingUser = (email: Email, options?: Options): Promise<boolean> =>
    pipe(
      UserService,
      E.flatMap(service => service.isExistingUser(email)),
      effect => this.runPromise(effect, options),
    )

  registerPasskey = (request: RegistrationRequest, options?: Options): Promise<Principal> =>
    pipe(
      RegistrationService,
      E.flatMap(service => service.registerPasskey(toRpcRegistrationRequest(request))),
      effect => this.runPromise(effect, options),
    )

  authenticatePasskey = (request: AuthenticationRequest, options?: Options): Promise<Principal> =>
    pipe(
      AuthenticationService,
      E.flatMap(service => service.authenticatePasskey(toRpcAuthenticationRequest(request))),
      effect => this.runPromise(effect, options),
    )

  registerOidc = (request: RegisterOidcReq, options?: Options) => 
    pipe(
      SocialService,
      E.flatMap(service => service.registerOidc(toRpcRegisterOidcReq(request))),
      effect => this.runPromise(effect, options),
    )   
    
  authenticateOidc = (request: AuthenticateOidcReq, options?: Options) => 
    pipe(
      SocialService,
      E.flatMap(service => service.authenticateOidc(toRpcAuthenticateOidcReq(request))),
      effect => this.runPromise(effect, options),
    )      

  verifyEmailCode = (request: VerifyRequest, options?: Options): Promise<Principal> =>
    pipe(
      EmailService,
      E.flatMap(service => service.verifyEmailCode(request)),
      effect => this.runPromise(effect, options),
    )

  resendVerificationEmail = (request: ResendEmail, options?: Options): Promise<void> =>
    pipe(
      UserService,
      E.flatMap(service => service.resendVerificationEmail(request)),
      effect => this.runPromise(effect, options),
    )    

  verifyEmailLink = (options?: Options): Promise<Principal> =>
    pipe(
      EmailService,
      E.flatMap(service => service.verifyEmailLink()),
      effect => this.runPromise(effect, options),
    )

  getSessionToken = (authType: AuthType): StoredToken | undefined =>
    pipe(
      StorageService,
      E.flatMap(service => service.getToken(authType).pipe(effect => E.option(effect))),
      E.map(O.getOrUndefined),
      effect => Runtime.runSync(this.runtime)(effect),
    )

  clearExpiredTokens = (): void =>
    pipe(
      StorageService,
      E.flatMap(service => service.clearExpiredTokens),
      effect => Runtime.runSync(this.runtime)(effect),
    )
}

export class Passlock {
  private readonly runtime: Runtime.Runtime<Requirements>

  constructor(config: PasslockProps) {
    const rpcConfig = Layer.succeed(RpcConfig, RpcConfig.of(config))
    const storage = Layer.succeed(Storage, Storage.of(globalThis.localStorage))
    const allLayers = pipe(allRequirements, L.provide(rpcConfig), L.provide(storage))
    const scope = E.runSync(Scope.make())
    this.runtime = E.runSync(Layer.toRuntime(allLayers).pipe(Scope.extend(scope)))
  }

  static isUserPrincipal = (principal: Principal): principal is UserPrincipal => {
    return principal.given_name !== undefined && 
    principal.family_name !== undefined && 
    principal.email !== undefined && 
    principal.email_verified !== undefined
  }

  private readonly runPromise = <A, R extends Requirements>(
    effect: E.Effect<A, PasslockErrors, R>,
    options: Options | undefined = undefined
  ) => {
    return pipe(
      transformErrors(effect), 
      effect => Runtime.runPromise(this.runtime)(effect, options)
    )
  }

  preConnect = (options?: Options): Promise<void | PasslockError> =>
    pipe(
      ConnectionService,
      E.flatMap(service => service.preConnect()),
      effect => this.runPromise(effect, options),
    )

  isPasskeySupport = (): Promise<boolean> =>
    pipe(
      Capabilities,
      E.flatMap(service => service.isPasskeySupport),
      effect => Runtime.runPromise(this.runtime)(effect),
    )

  isExistingUser = (email: Email, options?: Options): Promise<boolean | PasslockError> =>
    pipe(
      UserService,
      E.flatMap(service => service.isExistingUser(email)),
      effect => this.runPromise(effect, options),
    )

  registerPasskey = (request: RegistrationRequest, options?: Options): Promise<Principal | PasslockError> =>
    pipe(
      RegistrationService,
      E.flatMap(service => service.registerPasskey(toRpcRegistrationRequest(request))),
      effect => this.runPromise(effect, options),
    )

  authenticatePasskey = (request: AuthenticationRequest = {}, options?: Options): Promise<Principal | PasslockError> =>
    pipe(
      AuthenticationService,
      E.flatMap(service => service.authenticatePasskey(toRpcAuthenticationRequest(request))),
      effect => this.runPromise(effect, options),
    )

  registerOidc = (request: RegisterOidcReq, options?: Options) => 
    pipe(
      SocialService,
      E.flatMap(service => service.registerOidc(toRpcRegisterOidcReq(request))),
      effect => this.runPromise(effect, options),
    )     

  authenticateOidc = (request: AuthenticateOidcReq, options?: Options) => 
    pipe(
      SocialService,
      E.flatMap(service => service.authenticateOidc(request)),
      effect => this.runPromise(effect, options),
    )      

  verifyEmailCode = (request: VerifyRequest, options?: Options): Promise<Principal | PasslockError> =>
    pipe(
      EmailService,
      E.flatMap(service => service.verifyEmailCode(request)),
      effect => this.runPromise(effect, options),
    )

  verifyEmailLink = (options?: Options): Promise<Principal | PasslockError> =>
    pipe(
      EmailService,
      E.flatMap(service => service.verifyEmailLink()),
      effect => this.runPromise(effect, options),
    )

  resendVerificationEmail = (request: ResendEmail, options?: Options): Promise<void | PasslockError> =>
    pipe(
      UserService,
      E.flatMap(service => service.resendVerificationEmail(request)),
      effect => this.runPromise(effect, options),
    )      

  getSessionToken = (authType: AuthType): StoredToken | undefined =>
    pipe(
      StorageService,
      E.flatMap(service => service.getToken(authType).pipe(effect => E.option(effect))),
      E.map(maybeToken => O.getOrUndefined(maybeToken)),
      effect => Runtime.runSync(this.runtime)(effect),
    )

  clearExpiredTokens = (): void =>
    pipe(
      StorageService,
      E.flatMap(service => service.clearExpiredTokens),
      effect => Runtime.runSync(this.runtime)(effect),
    )
}
