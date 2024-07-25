import type { Principal } from '@passlock/shared/dist/schema/principal.js'
import { Context, Effect as E, Layer as L, LogLevel, Logger, Ref, Stream, pipe } from 'effect'
import type { RequestOptions } from 'https'
import { Config } from '../config/config.js'
import {
  PrincipalServiceLive,
  StreamResponse,
  buildError,
  type PrincipalService,
} from './principal.js'

export const principal: Principal = {
  token: 'token',
  user: {
    id: '1',
    email: 'john.doe@gmail.com',
    givenName: 'john',
    familyName: 'doe',
    emailVerified: false,
  },
  authStatement: {
    authType: 'passkey',
    userVerified: false,
    authTimestamp: new Date(0),
  },
  expireAt: new Date(0),
}

export const tenancyId = 'tenancyId'
export const apiKey = 'apiKey'

export const configTest = L.succeed(Config, Config.of({ tenancyId, apiKey }))

export class State extends Context.Tag('State')<State, Ref.Ref<RequestOptions | undefined>>() {}

export const buildEffect = <A, E>(
  assertions: E.Effect<A, E, PrincipalService | State>,
): E.Effect<void, E> => {
  const responseStreamTest = L.effect(
    StreamResponse,
    E.gen(function* (_) {
      const ref = yield* _(State)
      const buff = Buffer.from(JSON.stringify(principal))
      return options =>
        pipe(Stream.fromEffect(Ref.set(ref, options)), Stream.zipRight(Stream.make(buff)))
    }),
  )

  const service = pipe(PrincipalServiceLive, L.provide(responseStreamTest), L.provide(configTest))

  const args = L.effect(State, Ref.make<RequestOptions | undefined>(undefined))

  const effect = pipe(
    E.provide(assertions, service),
    E.provide(args),
    Logger.withMinimumLogLevel(LogLevel.None),
  )

  return effect
}

export const buildErrorEffect =
  (statusCode: number) =>
  <A>(assertions: E.Effect<void, A, PrincipalService>): E.Effect<void, A> => {
    const responseStreamTest = L.succeed(StreamResponse, () =>
      Stream.fail(buildError({ statusCode })),
    )

    const service = pipe(PrincipalServiceLive, L.provide(responseStreamTest), L.provide(configTest))

    const args = L.effect(State, Ref.make<RequestOptions | undefined>(undefined))

    const effect = pipe(
      E.provide(assertions, service),
      E.provide(args),
      Logger.withMinimumLogLevel(LogLevel.None),
    )

    return effect
  }
