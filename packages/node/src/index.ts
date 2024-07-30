import { ErrorCode } from '@passlock/shared/dist/error/error.js'
import { Config } from './config/config.js'

import type {
  Forbidden,
  InternalServerError,
  NotFound,
  Unauthorized,
} from '@passlock/shared/dist/error/error.js'

import { Effect as E, Layer as L, Runtime, Scope, pipe } from 'effect'

import {
  type PrincipalRequest,
  PrincipalService,
  PrincipalServiceLive,
  StreamResponseLive,
} from './principal/principal.js'

export type { PrincipalRequest } from './principal/principal.js'

export { ErrorCode } from '@passlock/shared/dist/error/error.js'

export class PasslockError extends Error {
  readonly _tag = 'PasslockError'
  readonly code: ErrorCode

  constructor(message: string, code: ErrorCode) {
    super(message)
    this.code = code
  }

  static readonly isError = (error: unknown): error is PasslockError => {
    return (
      typeof error === 'object' &&
      error !== null &&
      '_tag' in error &&
      error['_tag'] === 'PasslockError'
    )
  }
}

type PasslockErrors = NotFound | Unauthorized | Forbidden | InternalServerError

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
    NotFound: e => E.succeed(new PasslockError(e.message, ErrorCode.NotFound)),
    Unauthorized: e => E.succeed(new PasslockError(e.message, ErrorCode.Unauthorized)),
    Forbidden: e => E.succeed(new PasslockError(e.message, ErrorCode.Forbidden)),
    InternalServerError: e =>
      E.succeed(new PasslockError(e.message, ErrorCode.InternalServerError)),
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

type Requirements = PrincipalService

export class PasslockUnsafe {
  private readonly runtime: Runtime.Runtime<Requirements>

  constructor(config: { tenancyId: string; apiKey: string; endpoint?: string }) {
    const configLive = L.succeed(Config, Config.of(config))
    const allLayers = pipe(
      PrincipalServiceLive,
      L.provide(configLive),
      L.provide(StreamResponseLive),
    )
    const scope = E.runSync(Scope.make())
    this.runtime = E.runSync(L.toRuntime(allLayers).pipe(Scope.extend(scope)))
  }

  private readonly runPromise = <A, R extends Requirements>(
    effect: E.Effect<A, PasslockErrors, R>,
  ) => {
    return pipe(
      transformErrors(effect),
      E.flatMap(result => (PasslockError.isError(result) ? E.fail(result) : E.succeed(result))),
      effect => Runtime.runPromise(this.runtime)(effect),
    )
  }

  fetchPrincipal = (request: PrincipalRequest) =>
    pipe(
      PrincipalService,
      E.flatMap(service => service.fetchPrincipal(request)),
      effect => this.runPromise(effect),
    )
}

export class Passlock {
  private readonly runtime: Runtime.Runtime<Requirements>

  constructor(config: { tenancyId: string; apiKey: string; endpoint?: string }) {
    const configLive = L.succeed(Config, Config.of(config))
    const allLayers = pipe(
      PrincipalServiceLive,
      L.provide(configLive),
      L.provide(StreamResponseLive),
    )
    const scope = E.runSync(Scope.make())
    this.runtime = E.runSync(L.toRuntime(allLayers).pipe(Scope.extend(scope)))
  }

  private readonly runPromise = <A, R extends Requirements>(
    effect: E.Effect<A, PasslockErrors, R>,
  ) => {
    return pipe(transformErrors(effect), effect => Runtime.runPromise(this.runtime)(effect))
  }

  fetchPrincipal = (request: PrincipalRequest) =>
    pipe(
      PrincipalService,
      E.flatMap(service => service.fetchPrincipal(request)),
      effect => this.runPromise(effect),
    )
}
