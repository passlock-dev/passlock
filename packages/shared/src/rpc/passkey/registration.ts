import * as S from '@effect/schema/Schema'
import { Context, type Effect as E } from 'effect'

import { BadRequest, Duplicate, Forbidden, Unauthorized } from '../../error/error.js'
import { VerifyEmail } from '../../schema/email.js'
import {
  RegistrationCredential,
  RegistrationOptions,
  UserVerification,
} from '../../schema/passkey.js'
import { Principal } from '../../schema/principal.js'

/* Options */

export class OptionsRequest extends S.Class<OptionsRequest>(
  '@passkey/registration/options/request',
)({
  email: S.String,
  givenName: S.OptionFromUndefinedOr(S.String),
  familyName: S.OptionFromUndefinedOr(S.String),
  userVerification: S.OptionFromUndefinedOr(UserVerification),
  verifyEmail: S.OptionFromUndefinedOr(VerifyEmail),
}) {}

export class OptionsResponse extends S.Class<OptionsResponse>(
  '@passkey/registration/options/response',
)({
  session: S.String,
  publicKey: RegistrationOptions,
}) {}

export const OptionsErrors = S.Union(BadRequest, Duplicate)

export type OptionsErrors = S.Schema.Type<typeof OptionsErrors>

/* Verification */

export class VerificationRequest extends S.Class<VerificationRequest>(
  '@passkey/registration/verification/request',
)({
  session: S.String,
  credential: RegistrationCredential,
  verifyEmail: S.OptionFromUndefinedOr(VerifyEmail),
}) {}

export class VerificationResponse extends S.Class<VerificationResponse>(
  '@passkey/registration/verification/response',
)({
  principal: Principal,
}) {}

export const VerificationErrors = S.Union(BadRequest, Duplicate, Unauthorized, Forbidden)

export type VerificationErrors = S.Schema.Type<typeof VerificationErrors>

/* Endpoints */

export const OPTIONS_ENDPOINT = '/passkey/registration/options'
export const VERIFICATION_ENDPOINT = '/passkey/registration/verification'

/* Service */

export type RegistrationService = {
  getRegistrationOptions: (req: OptionsRequest) => E.Effect<OptionsResponse, OptionsErrors>

  verifyRegistrationCredential: (
    req: VerificationRequest,
  ) => E.Effect<VerificationResponse, VerificationErrors>
}

/* Handler */

export class RegistrationHandler extends Context.Tag('@passkey/registration/handler')<
  RegistrationHandler,
  RegistrationService
>() {}
