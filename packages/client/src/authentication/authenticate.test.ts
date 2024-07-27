import { AuthenticationClient } from '@passlock/shared/dist/rpc/authentication.js'
import { Effect as E, Layer as L, Layer, LogLevel, Logger, Option as O, pipe } from 'effect'
import { describe, expect, test, vi } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { StorageService } from '../storage/storage.js'
import * as Fixture from './authenticate.fixture.js'
import { AuthenticateServiceLive, AuthenticationService, GetCredential } from './authenticate.js'

describe('authenticate should', () => {
  test('return a valid principal', async () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(AuthenticationService)

      const result = yield* _(service.authenticatePasskey({ 
        email: O.none(), 
        userVerification: O.some('preferred') 
      }))

      expect(result).toEqual(Fixture.principal)
    })

    const service = pipe(
      AuthenticateServiceLive,
      L.provide(Fixture.getCredentialTest),
      L.provide(Fixture.capabilitiesTest),
      L.provide(Fixture.storageServiceTest),
      L.provide(Fixture.rpcClientTest),
    )

    const effect = pipe(E.provide(assertions, service), Logger.withMinimumLogLevel(LogLevel.None))

    return E.runPromise(effect)
  })

  test('pass the authentication request to the backend', async () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(AuthenticationService)

      yield* _(service.authenticatePasskey({ 
        email: O.none(), 
        userVerification: O.some('preferred') 
      }))

      const rpcClient = yield* _(AuthenticationClient)
      expect(rpcClient.getAuthenticationOptions).toHaveBeenCalledOnce()
      expect(rpcClient.verifyAuthenticationCredential).toHaveBeenCalledOnce()
    })

    const rpcClientTest = L.effect(
      AuthenticationClient,
      E.sync(() => {
        const rpcMock = mock<AuthenticationClient['Type']>()

        rpcMock.getAuthenticationOptions.mockReturnValue(E.succeed(Fixture.rpcOptionsRes))
        rpcMock.verifyAuthenticationCredential.mockReturnValue(E.succeed(Fixture.rpcVerificationRes))

        return rpcMock
      }),
    )

    const service = pipe(
      AuthenticateServiceLive,
      L.provide(Fixture.getCredentialTest),
      L.provide(Fixture.capabilitiesTest),
      L.provide(Fixture.storageServiceTest),
      L.provide(rpcClientTest),
    )

    const layers = Layer.merge(service, rpcClientTest)
    const effect = pipe(E.provide(assertions, layers), Logger.withMinimumLogLevel(LogLevel.None))

    return E.runPromise(effect)
  })

  test('send the credential to the backend', async () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(AuthenticationService)
      
      yield* _(service.authenticatePasskey({ 
        email: O.none(), 
        userVerification: O.some('preferred') 
      }))

      const rpcClient = yield* _(AuthenticationClient)
      expect(rpcClient.getAuthenticationOptions).toHaveBeenCalledOnce()
      expect(rpcClient.verifyAuthenticationCredential).toHaveBeenCalledWith(Fixture.rpcVerificationReq)
    })

    const rpcClientTest = L.effect(
      AuthenticationClient,
      E.sync(() => {
        const rpcMock = mock<AuthenticationClient['Type']>()

        rpcMock.getAuthenticationOptions.mockReturnValue(E.succeed(Fixture.rpcOptionsRes))
        rpcMock.verifyAuthenticationCredential.mockReturnValue(E.succeed(Fixture.rpcVerificationRes))

        return rpcMock
      }),
    )

    const service = pipe(
      AuthenticateServiceLive,
      L.provide(Fixture.getCredentialTest),
      L.provide(Fixture.capabilitiesTest),
      L.provide(Fixture.storageServiceTest),
      L.provide(rpcClientTest),
    )

    const layers = Layer.merge(service, rpcClientTest)
    const effect = pipe(E.provide(assertions, layers), Logger.withMinimumLogLevel(LogLevel.None))

    return E.runPromise(effect)
  })

  test('store the credential in local storage', async () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(AuthenticationService)
      
      yield* _(service.authenticatePasskey({ 
        email: O.none(), 
        userVerification: O.some('preferred') 
      }))

      const storageService = yield* _(StorageService)
      expect(storageService.storeToken).toHaveBeenCalledWith(Fixture.principal)
    })

    const storageServiceTest = L.effect(
      StorageService,
      E.sync(() => {
        const storageMock = mock<StorageService>()

        storageMock.storeToken.mockReturnValue(E.void)
        storageMock.clearExpiredToken.mockReturnValue(E.void)

        return storageMock
      }),
    )

    const service = pipe(
      AuthenticateServiceLive,
      L.provide(Fixture.getCredentialTest),
      L.provide(Fixture.capabilitiesTest),
      L.provide(Fixture.rpcClientTest),
      L.provide(storageServiceTest),
    )

    const layers = Layer.merge(service, storageServiceTest)
    const effect = pipe(E.provide(assertions, layers), Logger.withMinimumLogLevel(LogLevel.None))

    return E.runPromise(effect)
  })

  test('schedule deletion of the local token', async () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(AuthenticationService)
      
      yield* _(service.authenticatePasskey({ 
        email: O.none(), 
        userVerification: O.some('preferred') 
      }))

      const storageService = yield* _(StorageService)
      expect(storageService.clearExpiredToken).toHaveBeenCalledWith('passkey')
    })

    const storageServiceTest = L.effect(
      StorageService,
      E.sync(() => {
        const storageMock = mock<StorageService>()

        storageMock.storeToken.mockReturnValue(E.void)
        storageMock.clearExpiredToken.mockReturnValue(E.void)

        return storageMock
      }),
    )

    const service = pipe(
      AuthenticateServiceLive,
      L.provide(Fixture.getCredentialTest),
      L.provide(Fixture.capabilitiesTest),
      L.provide(Fixture.rpcClientTest),
      L.provide(storageServiceTest),
    )

    const layers = Layer.merge(service, storageServiceTest)
    const effect = pipe(E.provide(assertions, layers), Logger.withMinimumLogLevel(LogLevel.None))

    return E.runPromise(effect)
  })

  test("return an error if the browser can't create a credential", async () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(AuthenticationService)
      
      yield* _(service.authenticatePasskey({ 
        email: O.none(), 
        userVerification: O.some('preferred') 
      }))

      const getCredential = yield* _(GetCredential)
      expect(getCredential).toHaveBeenCalledOnce()
    })

    const getCredentialTest = L.effect(
      GetCredential,
      E.sync(() => {
        const getCredentialMock = vi.fn()

        getCredentialMock.mockReturnValue(E.succeed(Fixture.credential))

        return getCredentialMock
      }),
    )

    const service = pipe(
      AuthenticateServiceLive,
      L.provide(Fixture.storageServiceTest),
      L.provide(Fixture.capabilitiesTest),
      L.provide(Fixture.rpcClientTest),
      L.provide(getCredentialTest),
    )

    const layers = Layer.merge(service, getCredentialTest)
    const effect = pipe(E.provide(assertions, layers), Logger.withMinimumLogLevel(LogLevel.None))

    return E.runPromise(effect)
  })
})
