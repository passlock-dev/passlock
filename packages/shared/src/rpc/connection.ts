import * as S from '@effect/schema/Schema'
import { Context, type Effect as E } from 'effect'

/* Pre connect */

export class ConnectResponse extends S.Class<ConnectResponse>('@connection/connect/response')({
  warmed: S.Boolean,
}) {}

/* Endpoints */

export const CONNECT_ENDPOINT = '/connection/pre-connect'

/* Service */

export type ConnectionService = {
  preConnect: () => E.Effect<ConnectResponse>
}

/* Handler */

export class ConnectionHandler extends Context.Tag('@connection/handler')<
  ConnectionHandler,
  ConnectionService
>() {}
