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

export class PrincipalResponse extends S.Class<PrincipalResponse>('@social/principal/response')({
  principal: Principal,
}) {}

/* Registration */

export class OIDCRegistrationRequest extends S.Class<OIDCRegistrationRequest>(
  '@social/oidc/registration/request',
)({
  provider: Provider,
  idToken: S.String,
  givenName: S.OptionFromUndefinedOr(S.String),
  familyName: S.OptionFromUndefinedOr(S.String),
  nonce: S.String,
}) {}

export const OIDCRegistrationErrors = S.Union(
  BadRequest,
  Unauthorized,
  Forbidden,
  Disabled,
  Duplicate,
)

export type OIDCRegistrationErrors = S.Schema.Type<typeof OIDCRegistrationErrors>

/* Authentication */

export class OIDCAuthenticationRequest extends S.Class<OIDCAuthenticationRequest>(
  '@social/oidc/authentication/request',
)({
  provider: Provider,
  idToken: S.String,
  nonce: S.String,
}) {}

export const OIDCAuthenticationErrors = S.Union(
  BadRequest,
  Unauthorized,
  Forbidden,
  Disabled,
  NotFound,
)

export type OIDCAuthenticationErrors = S.Schema.Type<typeof OIDCAuthenticationErrors>

/* Endpoints */

export const OIDC_REGISTRATION_ENDPOINT = '/social/oidc/registration'
export const OIDC_AUTHENTICATION_ENDPOINT = '/social/oidc/authentication'

/* Service */

export type SocialService = {
  oidcRegistration: (
    req: OIDCRegistrationRequest,
  ) => E.Effect<PrincipalResponse, OIDCRegistrationErrors>
  oidcAuthentication: (
    req: OIDCAuthenticationRequest,
  ) => E.Effect<PrincipalResponse, OIDCAuthenticationErrors>
}

/* Handler */

export class SocialHandler extends Context.Tag('@social/handler')<SocialHandler, SocialService>() {}
