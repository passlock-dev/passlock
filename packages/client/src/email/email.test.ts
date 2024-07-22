import { UserClient } from '@passlock/shared/dist/rpc/user.js'
import { Effect as E, Layer as L, LogLevel, Logger, pipe } from 'effect'
import { NoSuchElementException } from 'effect/Cause'
import { describe, expect, test } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { AuthenticationService } from '../authentication/authenticate.js'
import { StorageService } from '../storage/storage.js'
import * as Fixture from './email.fixture.js'
import { EmailService, EmailServiceLive } from './email.js'

describe('verifyEmailCode should', () => {
  test('return a principal when the verification is successful', async () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(EmailService)
      const result = yield* _(service.verifyEmailCode({ code: '123' }))

      expect(result).toEqual(Fixture.principal)
    })

    const service = pipe(
      EmailServiceLive,
      L.provide(Fixture.locationSearchTest),
      L.provide(Fixture.authenticationServiceTest),
      L.provide(Fixture.storageServiceTest),
      L.provide(Fixture.rpcClientTest),
    )

    const effect = pipe(E.provide(assertions, service), Logger.withMinimumLogLevel(LogLevel.None))

    return E.runPromise(effect)
  })

  test('check for a token in local storage', async () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(EmailService)
      yield* _(service.verifyEmailCode({ code: '123' }))

      const storageService = yield* _(StorageService)
      expect(storageService.getToken).toHaveBeenCalledWith('passkey')
    })

    const storageServiceTest = L.effect(
      StorageService,
      E.sync(() => {
        const storageServiceMock = mock<StorageService>()

        storageServiceMock.getToken.mockReturnValue(E.succeed(Fixture.storedToken))
        storageServiceMock.clearToken.mockReturnValue(E.void)

        return storageServiceMock
      }),
    )

    const service = pipe(
      EmailServiceLive,
      L.provide(Fixture.locationSearchTest),
      L.provide(Fixture.authenticationServiceTest),
      L.provide(storageServiceTest),
      L.provide(Fixture.rpcClientTest),
    )

    const layers = L.merge(service, storageServiceTest)
    const effect = pipe(E.provide(assertions, layers), Logger.withMinimumLogLevel(LogLevel.None))

    return E.runPromise(effect)
  })

  test('re-authenticate the user if no local token', async () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(EmailService)
      yield* _(service.verifyEmailCode({ code: '123' }))

      const authService = yield* _(AuthenticationService)
      expect(authService.authenticatePasskey).toHaveBeenCalled()
    })

    const storageServiceTest = L.effect(
      StorageService,
      E.sync(() => {
        const storageServiceMock = mock<StorageService>()

        storageServiceMock.getToken.mockReturnValue(E.fail(new NoSuchElementException()))
        storageServiceMock.clearToken.mockReturnValue(E.void)

        return storageServiceMock
      }),
    )

    const authServiceTest = L.effect(
      AuthenticationService,
      E.sync(() => {
        const authServiceMock = mock<AuthenticationService>()

        authServiceMock.authenticatePasskey.mockReturnValue(E.succeed(Fixture.principal))

        return authServiceMock
      }),
    )

    const service = pipe(
      EmailServiceLive,
      L.provide(Fixture.locationSearchTest),
      L.provide(authServiceTest),
      L.provide(storageServiceTest),
      L.provide(Fixture.rpcClientTest),
    )

    const layers = L.mergeAll(service, storageServiceTest, authServiceTest)
    const effect = pipe(E.provide(assertions, layers), Logger.withMinimumLogLevel(LogLevel.None))

    return E.runPromise(effect)
  })

  test('call the backend', async () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(EmailService)
      yield* _(service.verifyEmailCode({ code: Fixture.code }))

      const rpcClient = yield* _(UserClient)
      expect(rpcClient.verifyEmail).toHaveBeenCalledWith(Fixture.rpcVerifyEmailReq)
    })

    const rpcClientTest = L.effect(
      UserClient,
      E.sync(() => {
        const rpcMock = mock<UserClient['Type']>()

        rpcMock.verifyEmail.mockReturnValue(E.succeed(Fixture.rpcVerifyEmailRes))

        return rpcMock
      }),
    )

    const service = pipe(
      EmailServiceLive,
      L.provide(Fixture.locationSearchTest),
      L.provide(Fixture.authenticationServiceTest),
      L.provide(Fixture.storageServiceTest),
      L.provide(rpcClientTest),
    )

    const layers = L.merge(service, rpcClientTest)
    const effect = pipe(E.provide(assertions, layers), Logger.withMinimumLogLevel(LogLevel.None))

    return E.runPromise(effect)
  })
})

describe('verifyEmailLink should', () => {
  test('extract the code from the current url', async () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(EmailService)
      yield* _(service.verifyEmailLink())

      // LocationSearch return ?code=code
      // and we expect rpcClient to be called with code
      const rpcClient = yield* _(UserClient)
      expect(rpcClient.verifyEmail).toBeCalledWith(Fixture.rpcVerifyEmailReq)
    })

    const rpcClientTest = L.effect(
      UserClient,
      E.sync(() => {
        const rpcMock = mock<UserClient['Type']>()

        rpcMock.verifyEmail.mockReturnValue(E.succeed(Fixture.rpcVerifyEmailRes))

        return rpcMock
      }),
    )

    const service = pipe(
      EmailServiceLive,
      L.provide(Fixture.locationSearchTest),
      L.provide(Fixture.storageServiceTest),
      L.provide(Fixture.authenticationServiceTest),
      L.provide(rpcClientTest),
    )

    const layers = L.merge(service, rpcClientTest)
    const effect = pipe(E.provide(assertions, layers), Logger.withMinimumLogLevel(LogLevel.None))

    return E.runPromise(effect)
  })
})
