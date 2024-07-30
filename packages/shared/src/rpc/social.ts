import * as S from '@effect/schema/Schema'
import { Context, Effect as E, Layer } from 'effect'

import {
  BadRequest,
  Disabled,
  Duplicate,
  Forbidden,
  NotFound,
  Unauthorized,
} from '../error/error.js'
import { Principal } from '../schema/principal.js'
import { Dispatcher, makePostRequest } from './client.js'

const Provider = S.Literal('apple', 'google')

/* Registration */

export class PrincipalRes extends S.Class<PrincipalRes>('@social/principalRes')({
  principal: Principal,
}) {}

export class RegisterOidcReq extends S.Class<RegisterOidcReq>('@social/oidc/registerReq')({
  provider: Provider,
  idToken: S.String,
  givenName: S.Option(S.String),
  familyName: S.Option(S.String),
  nonce: S.String,
}) {}

export const RegisterOidcErrors = S.Union(BadRequest, Unauthorized, Forbidden, Disabled, Duplicate)

export type RegisterOidcErrors = S.Schema.Type<typeof RegisterOidcErrors>

/* Authentication */

export class AuthOidcReq extends S.Class<AuthOidcReq>('@social/oidc/authReq')({
  provider: Provider,
  idToken: S.String,
  nonce: S.String,
}) {}

export const AuthOidcErrors = S.Union(BadRequest, Unauthorized, Forbidden, Disabled, NotFound)

export type AuthOidcErrors = S.Schema.Type<typeof AuthOidcErrors>

/* Service */

export type SocialService = {
  registerOidc: (req: RegisterOidcReq) => E.Effect<PrincipalRes, RegisterOidcErrors>

  authenticateOidc: (req: AuthOidcReq) => E.Effect<PrincipalRes, AuthOidcErrors>
}

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

/* Handler */

export class SocialHandler extends Context.Tag('@social/handler')<SocialHandler, SocialService>() {}
