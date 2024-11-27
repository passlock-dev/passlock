import { Context, Effect as E, Layer } from 'effect'

import {
  OIDCRegistrationRequest,
  OIDCRegistrationErrors,
  OIDCAuthenticationRequest,
  OIDCAuthenticationErrors,
  OIDC_REGISTRATION_ENDPOINT,
  OIDC_AUTHENTICATION_ENDPOINT,
  PrincipalResponse,
  type SocialService
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
      OIDCRegistrationRequest,
      PrincipalResponse,
      OIDCRegistrationErrors,
      dispatcher,
    )

    const authenticateResolver = makePostRequest(
      OIDCAuthenticationRequest,
      PrincipalResponse,
      OIDCAuthenticationErrors,
      dispatcher,
    )

    return {
      oidcRegistration: req => registerResolver(OIDC_REGISTRATION_ENDPOINT, req),
      oidcAuthentication: req => authenticateResolver(OIDC_AUTHENTICATION_ENDPOINT, req),
    }
  }),
)

export {
  OIDCRegistrationRequest,
  OIDCRegistrationErrors,
  OIDCAuthenticationRequest,
  OIDCAuthenticationErrors,
  PrincipalResponse,
} from '@passlock/shared/dist/rpc/social.js'
