import * as S from '@effect/schema/Schema'
import { Context, Effect as E, Layer } from 'effect'
import { Dispatcher, makeGetRequest } from './client.js'

/* Pre connect */

export class ConnectRes extends S.Class<ConnectRes>('@connection/preConnectRes')({
  warmed: S.Boolean,
}) {}

export type ConnectionService = {
  preConnect: () => E.Effect<ConnectRes>
}

/* Client */

export const CONNECT_ENDPOINT = '/connection/pre-connect'

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

/* Handler */

export class ConnectionHandler extends Context.Tag('@connection/handler')<
  ConnectionHandler,
  ConnectionService
>() {}
