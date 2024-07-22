import { RpcConfig } from '@passlock/shared/dist/rpc/config.js'
import { Context, Layer } from 'effect'

export const DefaultEndpoint = 'https://api.passlock.dev'

export type Tenancy = {
  tenancyId: string
  clientId: string
}
export const Tenancy = Context.GenericTag<Tenancy>('@services/Tenancy')

/**
 * Allow developers to override the endpoint e.g. to
 * point to a regional endpoint or a self-hosted backend
 */
export type Endpoint = {
  endpoint?: string
}
export const Endpoint = Context.GenericTag<Endpoint>('@services/Endpoint')

export type Config = Tenancy & Endpoint
export const Config = Context.GenericTag<Config>('@services/Config')

export const buildConfigLayers = (config: Config) => {
  const tenancyLayer = Layer.succeed(Tenancy, Tenancy.of(config))
  const endpointLayer = Layer.succeed(Endpoint, Endpoint.of(config))
  return Layer.mergeAll(tenancyLayer, endpointLayer)
}

export const buildRpcConfigLayers = (config: Config) => {
  const endpoint = config.endpoint || DefaultEndpoint
  return Layer.succeed(
    RpcConfig,
    RpcConfig.of({
      endpoint: endpoint,
      tenancyId: config.tenancyId,
      clientId: config.clientId,
    }),
  )
}

export type RequestDependencies = Endpoint | Tenancy | Storage | RpcConfig
