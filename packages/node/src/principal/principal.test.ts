import {
    Forbidden,
    InternalServerError,
    NotFound,
    Unauthorized,
} from '@passlock/shared/dist/error/error.js'
import { Effect as E, Effect, Ref } from 'effect'
import { describe, expect, test } from 'vitest'
import * as Fixture from './principal.fixture.js'
import { PrincipalService } from './principal.js'

describe('fetchPrincipal should', () => {
  test('return a valid principal', () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(PrincipalService)
      const result = yield* _(service.fetchPrincipal({ token: 'token' }))

      expect(result).toEqual(Fixture.principal)
    })

    const effect = Fixture.buildEffect(assertions)

    return E.runPromise(effect)
  })

  test('call the correct url', () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(PrincipalService)
      yield* _(service.fetchPrincipal({ token: 'myToken' }))

      const state = yield* _(Fixture.State)
      const args = yield* _(Ref.get(state))

      expect(args?.hostname).toEqual('api.passlock.dev')
      expect(args?.method).toEqual('GET')
      expect(args?.path).toEqual(`/${Fixture.tenancyId}/token/myToken`)
    })

    const effect = Fixture.buildEffect(assertions)

    return E.runPromise(effect)
  })

  test('pass the api key as a header', () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(PrincipalService)
      yield* _(service.fetchPrincipal({ token: 'myToken' }))

      const state = yield* _(Fixture.State)
      const args = yield* _(Ref.get(state))

      expect(args?.headers?.['Authorization']).toEqual(`Bearer ${Fixture.apiKey}`)
    })

    const effect = Fixture.buildEffect(assertions)

    return E.runPromise(effect)
  })

  test('propagate a 401 error', () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(PrincipalService)
      const result = service.fetchPrincipal({ token: 'myToken' })
      const error = yield* _(Effect.flip(result))
      expect(error).toBeInstanceOf(Unauthorized)
    })

    const effect = Fixture.buildErrorEffect(401)(assertions)

    return E.runPromise(effect)
  })

  test('propagate a 403 error', () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(PrincipalService)
      const result = service.fetchPrincipal({ token: 'myToken' })
      const error = yield* _(Effect.flip(result))
      expect(error).toBeInstanceOf(Forbidden)
    })

    const effect = Fixture.buildErrorEffect(403)(assertions)

    return E.runPromise(effect)
  })

  test('propagate a 404 error', () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(PrincipalService)
      const result = service.fetchPrincipal({ token: 'myToken' })
      const error = yield* _(Effect.flip(result))
      expect(error).toBeInstanceOf(NotFound)
    })

    const effect = Fixture.buildErrorEffect(404)(assertions)

    return E.runPromise(effect)
  })

  test('propagate a 500 error', () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(PrincipalService)
      const result = service.fetchPrincipal({ token: 'myToken' })
      const error = yield* _(Effect.flip(result))
      expect(error).toBeInstanceOf(InternalServerError)
    })

    const effect = Fixture.buildErrorEffect(500)(assertions)

    return E.runPromise(effect)
  })
})
