/**
 * Passkey authentication effects
 */
import { Context, Effect as E, Layer, flow } from 'effect'
import * as RPC from '../rpc/social.js'
import { type BadRequest, type NotSupported } from '@passlock/shared/dist/error/error.js'
import type { Principal } from '@passlock/shared/dist/schema/principal.js'

/* Requests */

export type Provider = 'apple' | 'google'

export type RegisterOidcReq = RPC.OIDCRegistrationRequest

export type AuthenticateOidcReq = RPC.OIDCAuthenticationRequest

/* Errors */

export type RegistrationErrors = NotSupported | BadRequest | RPC.OIDCRegistrationErrors

export type AuthenticationErrors = NotSupported | BadRequest | RPC.OIDCAuthenticationErrors

/* Service */

export class SocialService extends Context.Tag('@services/SocialService')<
  SocialService,
  {
    registerOidc: (req: RegisterOidcReq) => E.Effect<Principal, RegistrationErrors>
    authenticateOidc: (req: AuthenticateOidcReq) => E.Effect<Principal, AuthenticationErrors>
  }
>() {}

/* Effects */

type Dependencies = RPC.SocialClient

export const registerOidc = (
  request: RegisterOidcReq,
): E.Effect<Principal, RegistrationErrors, Dependencies> => {
  return E.gen(function* (_) {
    yield* _(E.logInfo('Registering social account'))

    const rpcClient = yield* _(RPC.SocialClient)
    const rpcRequest = new RPC.OIDCRegistrationRequest(request)
    const { principal } = yield* _(rpcClient.oidcRegistration(rpcRequest))

    return principal
  })
}

export const authenticateOidc = (
  request: AuthenticateOidcReq,
): E.Effect<Principal, AuthenticationErrors, Dependencies> => {
  return E.gen(function* (_) {
    yield* _(E.logInfo('Authenticating with social account'))

    const rpcClient = yield* _(RPC.SocialClient)
    const rpcRequest = new RPC.OIDCAuthenticationRequest(request)
    const { principal } = yield* _(rpcClient.oidcAuthentication(rpcRequest))

    return principal
  })
}

/* Live */

/* v8 ignore start */
export const SocialServiceLive = Layer.effect(
  SocialService,
  E.gen(function* (_) {
    const context = yield* _(E.context<RPC.SocialClient>())

    return SocialService.of({
      registerOidc: flow(registerOidc, E.provide(context)),
      authenticateOidc: flow(authenticateOidc, E.provide(context)),
    })
  }),
)
/* v8 ignore stop */
