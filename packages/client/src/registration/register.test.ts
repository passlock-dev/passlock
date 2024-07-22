import { Duplicate, InternalBrowserError } from '@passlock/shared/dist/error/error.js'
import { RegistrationClient } from '@passlock/shared/dist/rpc/registration.js'
import { Effect as E, Layer as L, Layer, LogLevel, Logger, pipe } from 'effect'
import { describe, expect, test, vi } from 'vitest'
import { mock } from 'vitest-mock-extended'
import * as Fixture from './register.fixture.js'
import { CreateCredential, RegistrationService, RegistrationServiceLive } from './register.js'

describe('register should', () => {
  test('return a valid credential', async () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(RegistrationService)
      const result = yield* _(service.registerPasskey(Fixture.registrationRequest))
      expect(result).toEqual(Fixture.principal)
    })

    const service = pipe(
      RegistrationServiceLive,
      L.provide(Fixture.createCredentialTest),
      L.provide(Fixture.userServiceTest),
      L.provide(Fixture.capabilitiesTest),
      L.provide(Fixture.storageServiceTest),
      L.provide(Fixture.rpcClientTest),
    )

    const effect = pipe(E.provide(assertions, service), Logger.withMinimumLogLevel(LogLevel.None))

    return E.runPromise(effect)
  })

  test('pass the registration data to the backend', async () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(RegistrationService)
      yield* _(service.registerPasskey(Fixture.registrationRequest))

      const rpcClient = yield* _(RegistrationClient)
      expect(rpcClient.getRegistrationOptions).toHaveBeenCalledWith(Fixture.rpcOptionsReq)
    })

    const rpcClientTest = L.effect(
      RegistrationClient,
      E.sync(() => {
        const rpcMock = mock<RegistrationClient['Type']>()

        rpcMock.getRegistrationOptions.mockReturnValue(E.succeed(Fixture.rpcOptionsRes))
        rpcMock.verifyRegistrationCredential.mockReturnValue(E.succeed(Fixture.rpcVerificationRes))

        return rpcMock
      }),
    )

    const service = pipe(
      RegistrationServiceLive,
      L.provide(Fixture.createCredentialTest),
      L.provide(Fixture.capabilitiesTest),
      L.provide(Fixture.storageServiceTest),
      L.provide(Fixture.userServiceTest),
      L.provide(rpcClientTest),
    )

    const layers = Layer.merge(service, rpcClientTest)
    const effect = pipe(E.provide(assertions, layers), Logger.withMinimumLogLevel(LogLevel.None))

    return E.runPromise(effect)
  })

  test('send the new credential to the backend', async () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(RegistrationService)
      yield* _(service.registerPasskey(Fixture.registrationRequest))

      const rpcClient = yield* _(RegistrationClient)
      expect(rpcClient.verifyRegistrationCredential).toHaveBeenCalledWith(Fixture.rpcVerificationReq)
    })

    const rpcClientTest = L.effect(
      RegistrationClient,
      E.sync(() => {
        const rpcMock = mock<RegistrationClient['Type']>()

        rpcMock.getRegistrationOptions.mockReturnValue(E.succeed(Fixture.rpcOptionsRes))
        rpcMock.verifyRegistrationCredential.mockReturnValue(E.succeed(Fixture.rpcVerificationRes))

        return rpcMock
      }),
    )

    const service = pipe(
      RegistrationServiceLive,
      L.provide(Fixture.createCredentialTest),
      L.provide(Fixture.capabilitiesTest),
      L.provide(Fixture.storageServiceTest),
      L.provide(Fixture.userServiceTest),
      L.provide(rpcClientTest),
    )

    const layers = Layer.merge(service, rpcClientTest)
    const effect = pipe(E.provide(assertions, layers), Logger.withMinimumLogLevel(LogLevel.None))

    return E.runPromise(effect)
  })

  test('short-circuit if the user is already registered', async () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(RegistrationService)

      const error = yield* _(service.registerPasskey(Fixture.registrationRequest), E.flip)

      expect(error).toBeInstanceOf(Duplicate)
    })

    const rpcClientTest = L.effect(
      RegistrationClient,
      E.sync(() => {
        const rpcMock = mock<RegistrationClient['Type']>()

        rpcMock.getRegistrationOptions.mockReturnValue(E.fail(new Duplicate({ message: 'User already exists' })))

        return rpcMock
      }),
    )

    const service = pipe(
      RegistrationServiceLive,
      L.provide(Fixture.createCredentialTest),
      L.provide(Fixture.capabilitiesTest),
      L.provide(Fixture.storageServiceTest),
      L.provide(Fixture.userServiceTest),
      L.provide(rpcClientTest),
    )

    const layers = Layer.merge(service, rpcClientTest)
    const effect = pipe(E.provide(assertions, layers), Logger.withMinimumLogLevel(LogLevel.None))

    return E.runPromise(effect)
  })

  test('return an error if we try to re-register a credential', async () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(RegistrationService)

      const defect = yield* _(service.registerPasskey(Fixture.registrationRequest), E.flip)

      expect(defect).toBeInstanceOf(Duplicate)
    })

    const createTest = L.effect(
      CreateCredential,
      E.sync(() => {
        const createTest = vi.fn()

        createTest.mockReturnValue(E.fail(new Duplicate({ message: 'boom!' })))

        return createTest
      }),
    )

    const service = pipe(
      RegistrationServiceLive,
      L.provide(Fixture.userServiceTest),
      L.provide(Fixture.capabilitiesTest),
      L.provide(Fixture.storageServiceTest),
      L.provide(Fixture.rpcClientTest),
      L.provide(createTest),
    )

    const layers = Layer.merge(service, createTest)
    const effect = pipe(E.provide(assertions, layers), Logger.withMinimumLogLevel(LogLevel.None))

    return E.runPromise(effect)
  })

  test("throw an error if the browser can't create a credential", async () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(RegistrationService)

      const defect = yield* _(
        service.registerPasskey(Fixture.registrationRequest),
        E.catchAllDefect(defect => E.succeed(defect)),
      )

      expect(defect).toBeInstanceOf(InternalBrowserError)
    })

    const createTest = L.effect(
      CreateCredential,
      E.sync(() => {
        const createTest = vi.fn()

        createTest.mockReturnValue(E.fail(new InternalBrowserError({ message: 'boom!' })))

        return createTest
      }),
    )

    const service = pipe(
      RegistrationServiceLive,
      L.provide(Fixture.userServiceTest),
      L.provide(Fixture.capabilitiesTest),
      L.provide(Fixture.storageServiceTest),
      L.provide(Fixture.rpcClientTest),
      L.provide(createTest),
    )

    const layers = Layer.merge(service, createTest)
    const effect = pipe(E.provide(assertions, layers), Logger.withMinimumLogLevel(LogLevel.None))

    return E.runPromise(effect)
  })
})
