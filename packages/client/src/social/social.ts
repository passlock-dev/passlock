/**
 * Passkey authentication effects
 */
import { type BadRequest, type NotSupported } from '@passlock/shared/dist/error/error.js'
import * as RPC from '@passlock/shared/dist/rpc/social.js'
import type { Principal } from '@passlock/shared/dist/schema/principal.js'
import { Context, Effect as E, Layer, flow } from 'effect'
import { SocialClient } from '../rpc/social.js'

/* Requests */

export type Provider = 'apple' | 'google'

export type RegisterOidcReq = RPC.RegisterOidcReq

export type AuthenticateOidcReq = RPC.AuthOidcReq

/* Errors */

export type RegistrationErrors = NotSupported | BadRequest | RPC.RegisterOidcErrors

export type AuthenticationErrors = NotSupported | BadRequest | RPC.AuthOidcErrors

/* Service */

export class SocialService extends Context.Tag('@services/SocialService')<
  SocialService,
  {
    registerOidc: (req: RegisterOidcReq) => E.Effect<Principal, RegistrationErrors>
    authenticateOidc: (req: AuthenticateOidcReq) => E.Effect<Principal, AuthenticationErrors>
  }
>() {}

/* Effects */

type Dependencies = SocialClient

export const registerOidc = (
  request: RegisterOidcReq,
): E.Effect<Principal, RegistrationErrors, Dependencies> => {
  return E.gen(function* (_) {
    yield* _(E.logInfo('Registering social account'))

    const rpcClient = yield* _(SocialClient)
    const rpcRequest = new RPC.RegisterOidcReq(request)
    const { principal } = yield* _(rpcClient.registerOidc(rpcRequest))

    return principal
  })
}

export const authenticateOidc = (
  request: AuthenticateOidcReq,
): E.Effect<Principal, AuthenticationErrors, Dependencies> => {
  return E.gen(function* (_) {
    yield* _(E.logInfo('Authenticating with social account'))

    const rpcClient = yield* _(SocialClient)
    const rpcRequest = new RPC.AuthOidcReq(request)
    const { principal } = yield* _(rpcClient.authenticateOidc(rpcRequest))

    return principal
  })
}

/* Live */

/* v8 ignore start */
export const SocialServiceLive = Layer.effect(
  SocialService,
  E.gen(function* (_) {
    const context = yield* _(E.context<SocialClient>())

    return SocialService.of({
      registerOidc: flow(registerOidc, E.provide(context)),
      authenticateOidc: flow(authenticateOidc, E.provide(context)),
    })
  }),
)
/* v8 ignore stop */
