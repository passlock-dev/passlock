import { Context, Effect as E, Layer } from 'effect'

import {
  AuthOidcErrors,
  AuthOidcReq,
  PrincipalRes,
  RegisterOidcErrors,
  RegisterOidcReq,
  type SocialService,
} from '@passlock/shared/dist/rpc/social.js'

import { Dispatcher, makePostRequest } from './client.js'

/* Client */

export const OIDC_REGISTER_ENDPOINT = '/social/oidc/register'
export const OIDC_AUTH_ENDPOINT = '/social/oidc/auth'

export class SocialClient extends Context.Tag('@social/client')<SocialClient, SocialService>() {}

export const SocialClientLive = Layer.effect(
  SocialClient,
  E.gen(function* (_) {
    const dispatcher = yield* _(Dispatcher)

    const registerResolver = makePostRequest(
      RegisterOidcReq,
      PrincipalRes,
      RegisterOidcErrors,
      dispatcher,
    )

    const authenticateResolver = makePostRequest(
      AuthOidcReq,
      PrincipalRes,
      AuthOidcErrors,
      dispatcher,
    )

    return {
      registerOidc: req => registerResolver(OIDC_REGISTER_ENDPOINT, req),
      authenticateOidc: req => authenticateResolver(OIDC_AUTH_ENDPOINT, req),
    }
  }),
)
