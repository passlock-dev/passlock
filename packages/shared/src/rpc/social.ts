import * as S from '@effect/schema/Schema'
import { Context, type Effect as E } from 'effect'

import {
  BadRequest,
  Disabled,
  Duplicate,
  Forbidden,
  NotFound,
  Unauthorized,
} from '../error/error.js'
import { Principal } from '../schema/principal.js'

const Provider = S.Literal('apple', 'google')

/* Registration */

export class PrincipalRes extends S.Class<PrincipalRes>('@social/principalRes')({
  principal: Principal,
}) {}

export class RegisterOidcReq extends S.Class<RegisterOidcReq>('@social/oidc/registerReq')({
  provider: Provider,
  idToken: S.String,
  givenName: S.OptionFromUndefinedOr(S.String),
  familyName: S.OptionFromUndefinedOr(S.String),
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

/* Endpoints */

export const OIDC_REGISTER_ENDPOINT = '/social/oidc/register'
export const OIDC_AUTH_ENDPOINT = '/social/oidc/auth'

/* Service */

export type SocialService = {
  registerOidc: (req: RegisterOidcReq) => E.Effect<PrincipalRes, RegisterOidcErrors>
  authenticateOidc: (req: AuthOidcReq) => E.Effect<PrincipalRes, AuthOidcErrors>
}

/* Handler */

export class SocialHandler extends Context.Tag('@social/handler')<SocialHandler, SocialService>() {}
