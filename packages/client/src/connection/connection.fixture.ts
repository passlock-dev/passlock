import { ConnectionClient, ConnectRes } from '@passlock/shared/dist/rpc/connection.js'
import { Effect as E, Layer as L } from 'effect'

export const preConnectRes = new ConnectRes({ warmed: true })

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
