import { Effect as E, Layer, LogLevel, Logger, identity, pipe } from 'effect'
import { describe, expect, test } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { principal, testLayers } from './storage.fixture.js'
import {
  BrowserStorage,
  StorageService,
  clearExpiredToken,
  clearToken,
  getToken,
} from './storage.js'

// eslint chokes on expect(storage.setItem) etc
/* eslint @typescript-eslint/unbound-method: 0 */

describe('storeToken should', () => {
  test('set the token in local storage', () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(StorageService)
      yield* _(service.storeToken(principal))

      const storage = yield* _(BrowserStorage)
      expect(storage.setItem).toHaveBeenCalled()
    })

    const effect = pipe(
      E.provide(assertions, testLayers()),
      Logger.withMinimumLogLevel(LogLevel.None),
    )

    E.runSync(effect)
  })

  test('with the key passlock:passkey:token', () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(StorageService)
      yield* _(service.storeToken(principal))

      const storage = yield* _(BrowserStorage)
      expect(storage.setItem).toHaveBeenCalledWith('passlock:passkey:token', expect.any(String))
    })

    const effect = pipe(
      E.provide(assertions, testLayers()),
      Logger.withMinimumLogLevel(LogLevel.None),
    )

    E.runSync(effect)
  })

  test('with the value token:expiry', () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(StorageService)
      yield* _(service.storeToken(principal))

      const storage = yield* _(BrowserStorage)
      const token = principal.jti
      const expiry = principal.exp.getTime()
      expect(storage.setItem).toHaveBeenCalledWith(
        'passlock:passkey:token',
        `${token}:${expiry.toFixed(0)}`,
      )
    })

    const effect = pipe(
      E.provide(assertions, testLayers()),
      Logger.withMinimumLogLevel(LogLevel.None),
    )

    E.runSync(effect)
  })
})

describe('getToken should', () => {
  test('get the token from local storage', () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(StorageService)
      yield* _(service.getToken('passkey'))

      const storage = yield* _(BrowserStorage)
      expect(storage.getItem).toHaveBeenCalled()
      expect(storage.getItem).toHaveBeenCalledWith('passlock:passkey:token')
    })

    const storageTest = Layer.effect(
      BrowserStorage,
      E.sync(() => {
        const mockStorage = mock<Storage>()
        const expiry = Date.now() + 1000
        mockStorage.getItem.mockReturnValue(`token:${expiry.toFixed(0)}`)
        return mockStorage
      }),
    )

    const effect = pipe(
      E.provide(assertions, testLayers(storageTest)),
      Logger.withMinimumLogLevel(LogLevel.None),
    )

    E.runSync(effect)
  })

  test('filter out expired tokens', () => {
    const assertions = pipe(
      getToken('passkey'),
      E.match({
        onSuccess: identity,
        onFailure: () => undefined,
      }),
      E.flatMap(result =>
        E.sync(() => {
          expect(result).toBeUndefined()
        }),
      ),
    )

    const storageTest = Layer.effect(
      BrowserStorage,
      E.sync(() => {
        const mockStorage = mock<Storage>()
        const expiry = Date.now() - 1000
        mockStorage.getItem.mockReturnValue(`token:${expiry.toFixed(0)}`)
        return mockStorage
      }),
    )

    const effect = pipe(
      E.provide(assertions, testLayers(storageTest)),
      Logger.withMinimumLogLevel(LogLevel.None),
    )

    E.runSync(effect)
  })
})

describe('clearToken should', () => {
  test('clear the token in local storage', () => {
    const assertions = E.gen(function* (_) {
      const storage = yield* _(BrowserStorage)
      yield* _(clearToken('passkey'))
      expect(storage.removeItem).toHaveBeenCalledWith('passlock:passkey:token')
    })

    const effect = pipe(
      E.provide(assertions, testLayers()),
      Logger.withMinimumLogLevel(LogLevel.None),
    )

    E.runSync(effect)
  })
})

describe('clearExpiredToken should', () => {
  test('clear an expired token from local storage', () => {
    const assertions = E.gen(function* (_) {
      const storage = yield* _(BrowserStorage)
      yield* _(clearExpiredToken('passkey'))
      expect(storage.getItem).toHaveBeenCalledWith('passlock:passkey:token')
      expect(storage.removeItem).toHaveBeenCalledWith('passlock:passkey:token')
    })

    const storageTest = Layer.effect(
      BrowserStorage,
      E.sync(() => {
        const mockStorage = mock<Storage>()
        const expiry = Date.now() - 1000
        mockStorage.getItem.mockReturnValue(`token:${expiry.toFixed(0)}`)
        return mockStorage
      }),
    )

    const effect = pipe(
      E.provide(assertions, testLayers(storageTest)),
      Logger.withMinimumLogLevel(LogLevel.None),
    )

    E.runSync(effect)
  })

  test('leave a live token in local storage', () => {
    const assertions = E.gen(function* (_) {
      const storage = yield* _(BrowserStorage)
      yield* _(clearExpiredToken('passkey'))
      expect(storage.getItem).toHaveBeenCalledWith('passlock:passkey:token')
      expect(storage.removeItem).not.toHaveBeenCalled()
    })

    const storageTest = Layer.effect(
      BrowserStorage,
      E.sync(() => {
        const mockStorage = mock<Storage>()
        const expiry = Date.now() + 1000
        mockStorage.getItem.mockReturnValue(`token:${expiry.toFixed(0)}`)
        return mockStorage
      }),
    )

    const effect = pipe(
      E.provide(assertions, testLayers(storageTest)),
      Logger.withMinimumLogLevel(LogLevel.None),
    )

    E.runSync(effect)
  })
})
