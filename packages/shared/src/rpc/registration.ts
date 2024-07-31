import * as S from '@effect/schema/Schema'
import { Context, Effect as E } from 'effect'

import { BadRequest, Duplicate, Forbidden, Unauthorized } from '../error/error.js'

import { VerifyEmail } from '../schema/email.js'
import { RegistrationCredential, RegistrationOptions, UserVerification } from '../schema/passkey.js'

import { Principal } from '../schema/principal.js'

/* Options */

export class OptionsReq extends S.Class<OptionsReq>('@passkey/register/optionsReq')({
  email: S.String,
  givenName: S.Option(S.String),
  familyName: S.Option(S.String),
  userVerification: S.Option(UserVerification),
  verifyEmail: S.Option(VerifyEmail),
}) {}

export class OptionsRes extends S.Class<OptionsRes>('@passkey/register/optionsRes')({
  session: S.String,
  publicKey: RegistrationOptions,
}) {}

export const OptionsErrors = S.Union(BadRequest, Duplicate)

export type OptionsErrors = S.Schema.Type<typeof OptionsErrors>

/* Verification */

export class VerificationReq extends S.Class<VerificationReq>('@passkey/register/verificationReq')({
  session: S.String,
  credential: RegistrationCredential,
  verifyEmail: S.Option(VerifyEmail),
}) {}

export class VerificationRes extends S.Class<VerificationRes>('@passkey/register/verificationRes')({
  principal: Principal,
}) {}

export const VerificationErrors = S.Union(BadRequest, Duplicate, Unauthorized, Forbidden)

export type VerificationErrors = S.Schema.Type<typeof VerificationErrors>

/* Endpoints */

export const OPTIONS_ENDPOINT = '/passkey/register/options'
export const VERIFY_ENDPOINT = '/passkey/register/verify'

/* Service */

export type RegistrationService = {
  getRegistrationOptions: (req: OptionsReq) => E.Effect<OptionsRes, OptionsErrors>

  verifyRegistrationCredential: (
    req: VerificationReq,
  ) => E.Effect<VerificationRes, VerificationErrors>
}

/* Handler */

export class RegistrationHandler extends Context.Tag('@passkey/register/handler')<
  RegistrationHandler,
  RegistrationService
>() {}
