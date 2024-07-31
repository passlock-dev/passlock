import * as S from '@effect/schema/Schema'
import { Context, Effect as E } from 'effect'

import { BadRequest, Disabled, Forbidden, NotFound, Unauthorized } from '../error/error.js'

import {
  AuthenticationCredential,
  AuthenticationOptions,
  UserVerification,
} from '../schema/passkey.js'

import { Principal } from '../schema/principal.js'

/* Options */

export class OptionsReq extends S.Class<OptionsReq>(`@passkey/auth/optionsReq`)({
  email: S.Option(S.String),
  userVerification: S.Option(UserVerification),
}) {}

export class OptionsRes extends S.Class<OptionsRes>('@passkey/auth/optionsRes')({
  session: S.String,
  publicKey: AuthenticationOptions,
}) {}

export const OptionsErrors = S.Union(BadRequest, NotFound)

export type OptionsErrors = S.Schema.Type<typeof OptionsErrors>

/* Verification */

export class VerificationReq extends S.Class<VerificationReq>('@passkey/auth/verificationReq')({
  session: S.String,
  credential: AuthenticationCredential,
}) {}

export class VerificationRes extends S.Class<VerificationRes>('@passkey/auth/verificationRes')({
  principal: Principal,
}) {}

export const VerificationErrors = S.Union(BadRequest, Unauthorized, Forbidden, Disabled)

export type VerificationErrors = S.Schema.Type<typeof VerificationErrors>

/* Endpoints */

export const OPTIONS_ENDPOINT = '/passkey/auth/options'
export const VERIFY_ENDPOINT = '/passkey/auth/verify'

/* Service */

export type AuthenticationService = {
  getAuthenticationOptions: (req: OptionsReq) => E.Effect<OptionsRes, OptionsErrors>

  verifyAuthenticationCredential: (
    req: VerificationReq,
  ) => E.Effect<VerificationRes, VerificationErrors>
}

/* Handler */
export class AuthenticationHandler extends Context.Tag('@passkey/auth/handler')<
  AuthenticationHandler,
  AuthenticationService
>() {}
