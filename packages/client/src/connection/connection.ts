/**
 * Hits the rpc endpoint to warm up a lambda
 */
import { Context, Effect as E, Layer, flow, pipe } from 'effect'

import { Dispatcher } from '../rpc/client.js'
import type { RpcConfig } from '../rpc/config.js'
import { ConnectionClient } from '../rpc/connection.js'

/* Service */

export class ConnectionService extends Context.Tag('@services/ConnectionService')<
  ConnectionService,
  {
    preConnect: () => E.Effect<void>
  }
>() {}

/* Effects */

const hitPrincipal = pipe(
  E.logInfo('Pre-connecting to Principal endpoint'),
  E.zipRight(Dispatcher),
  E.flatMap(dispatcher => dispatcher.get('/token/token?warm=true')),
  E.asVoid,
  E.catchAll(() => E.void),
)

const hitRpc = pipe(
  E.logInfo('Pre-connecting to RPC endpoint'),
  E.zipRight(ConnectionClient),
  E.flatMap(rpcClient => rpcClient.preConnect()),
  E.asVoid,
)

export const preConnect = () => pipe(E.all([hitPrincipal, hitRpc], { concurrency: 2 }), E.asVoid)

/* Live */

/* v8 ignore start */
export const ConnectionServiceLive = Layer.effect(
  ConnectionService,
  E.gen(function* (_) {
    const context = yield* _(E.context<ConnectionClient | Dispatcher | RpcConfig>())

    return ConnectionService.of({
      preConnect: flow(preConnect, E.provide(context)),
    })
  }),
)
/* v8 ignore stop */
