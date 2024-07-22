import { UserClient } from '@passlock/shared/dist/rpc/user.js'
import { Effect as E, Layer as L, Layer, LogLevel, Logger, pipe } from 'effect'
import { describe, expect, test } from 'vitest'
import { mock } from 'vitest-mock-extended'
import * as Fixture from './user.fixture.js'
import { UserService, UserServiceLive } from './user.js'

describe('isExistingUser should', () => {
  test('return true when the user already has a passkey', async () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(UserService)
      const result = yield* _(service.isExistingUser({ email: Fixture.email }))

      expect(result).toBe(true)
    })

    const service = pipe(UserServiceLive, L.provide(Fixture.rpcClientTest))

    const effect = pipe(E.provide(assertions, service), Logger.withMinimumLogLevel(LogLevel.None))

    return E.runPromise(effect)
  })

  test('send the email to the backend', async () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(UserService)
      const result = yield* _(service.isExistingUser({ email: Fixture.email }))

      expect(result).toBe(false)
      const rpcClient = yield* _(UserClient)
      expect(rpcClient.isExistingUser).toBeCalledWith(Fixture.isRegisteredReq)
    })

    const rpcClientTest = Layer.effect(
      UserClient,
      E.sync(() => {
        const rpcMock = mock<UserClient['Type']>()

        rpcMock.isExistingUser.mockReturnValue(E.succeed(Fixture.isRegisteredRes))

        return rpcMock
      }),
    )

    const service = pipe(UserServiceLive, L.provide(rpcClientTest))

    const layers = L.merge(service, rpcClientTest)
    const effect = pipe(E.provide(assertions, layers), Logger.withMinimumLogLevel(LogLevel.None))

    return E.runPromise(effect)
  })
})

describe('resendVerificationEmail should', () => {
  test('forward the request to the backend', async () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(UserService)
      yield* _(service.resendVerificationEmail(Fixture.resendEmailReq))

      const rpcClient = yield* _(UserClient)
      expect(rpcClient.resendVerificationEmail).toBeCalledWith(Fixture.rpcResendEmailReq)
    })

    const rpcClientTest = Layer.effect(
      UserClient,
      E.sync(() => {
        const rpcMock = mock<UserClient['Type']>()

        rpcMock.resendVerificationEmail.mockReturnValue(E.succeed(Fixture.rpcResendEmailRes))

        return rpcMock
      }),
    )

    const service = pipe(UserServiceLive, L.provide(rpcClientTest))

    const layers = L.merge(service, rpcClientTest)

    const effect = pipe(
      E.provide(assertions, layers),
      Logger.withMinimumLogLevel(LogLevel.None)
    )

    return E.runPromise(effect)
  })
})
