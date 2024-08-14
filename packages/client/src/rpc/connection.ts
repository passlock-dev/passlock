import * as S from '@effect/schema/Schema'
import { Context, Effect as E, Layer } from 'effect'

import {
  CONNECT_ENDPOINT,
  ConnectRes,
  type ConnectionService,
} from '@passlock/shared/dist/rpc/connection.js'

import { Dispatcher, makeGetRequest } from './client.js'

/* Client */

export class ConnectionClient extends Context.Tag('@connection/client')<
  ConnectionClient,
  ConnectionService
>() {}

export const ConnectionClientLive = Layer.effect(
  ConnectionClient,
  E.gen(function* (_) {
    const dispatcher = yield* _(Dispatcher)

    const preConnectResolver = makeGetRequest(ConnectRes, S.Never, dispatcher)

    return {
      preConnect: () => preConnectResolver(CONNECT_ENDPOINT),
    }
  }),
)
