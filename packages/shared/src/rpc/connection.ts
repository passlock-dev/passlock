import * as S from '@effect/schema/Schema'
import { Context, Effect as E } from 'effect'

/* Pre connect */

export class ConnectRes extends S.Class<ConnectRes>('@connection/preConnectRes')({
  warmed: S.Boolean,
}) {}

/* Endpoints */

export const CONNECT_ENDPOINT = '/connection/pre-connect'

/* Service */

export type ConnectionService = {
  preConnect: () => E.Effect<ConnectRes>
}

/* Handler */

export class ConnectionHandler extends Context.Tag('@connection/handler')<
  ConnectionHandler,
  ConnectionService
>() {}
