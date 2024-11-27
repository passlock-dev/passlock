import { Effect as E, Layer as L } from 'effect'

import { ConnectResponse } from '@passlock/shared/dist/rpc/connection.js'

import { ConnectionClient } from '../rpc/connection.js'

export const preConnectRes = new ConnectResponse({ warmed: true })

export const rpcClientTest = L.succeed(
  ConnectionClient,
  ConnectionClient.of({
    preConnect: () => E.succeed(preConnectRes),
  }),
)

export const rpcConfig = {
  endpoint: 'https://example.com',
  tenancyId: 'tenancyId',
  clientId: 'clientId',
}
