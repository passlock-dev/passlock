import { Effect as E, Layer as L, Layer, LogLevel, Logger, pipe } from 'effect'
import { describe, expect, test } from 'vitest'
import { mock } from 'vitest-mock-extended'

import * as Fixture from './connection.fixture.js'
import { Dispatcher } from '../rpc/client.js'
import { RpcConfig } from '../rpc/config.js'
import { ConnectionClient } from '../rpc/connection.js'
import { ConnectionService, ConnectionServiceLive } from './connection.js'

describe('preConnect should', () => {
  test('hit the rpc endpoint', async () => {
    const assertions = E.gen(function* (_) {
      const service = yield* _(ConnectionService)
      yield* _(service.preConnect())

      const rpcClient = yield* _(ConnectionClient)
      expect(rpcClient.preConnect).toBeCalled()

      const dispatcher = yield* _(Dispatcher)
      expect(dispatcher.get).toBeCalledWith(`/token/token?warm=true`)
    })

    const rpcClientTest = Layer.effect(
      ConnectionClient,
      E.sync(() => {
        const rpcMock = mock<ConnectionClient['Type']>()

        rpcMock.preConnect.mockReturnValue(E.succeed(Fixture.preConnectRes))

        return rpcMock
      }),
    )

    const rpcConfigTest = Layer.succeed(RpcConfig, RpcConfig.of(Fixture.rpcConfig))

    const dispatcherTest = Layer.effect(
      Dispatcher,
      E.sync(() => {
        const dispatcherMock = mock<Dispatcher['Type']>()

        dispatcherMock.get.mockReturnValue(E.succeed({ status: 200, body: {} }))

        return dispatcherMock
      }),
    )

    const service = pipe(
      ConnectionServiceLive,
      L.provide(rpcClientTest),
      L.provide(dispatcherTest),
      L.provide(rpcConfigTest),
    )

    const layers = L.mergeAll(service, rpcClientTest, dispatcherTest)
    const effect = pipe(E.provide(assertions, layers), Logger.withMinimumLogLevel(LogLevel.None))

    return E.runPromise(effect)
  })
})
