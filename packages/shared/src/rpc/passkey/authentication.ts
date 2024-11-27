import * as S from '@effect/schema/Schema'
import { Context, type Effect as E } from 'effect'

import { BadRequest, Disabled, Forbidden, NotFound, Unauthorized } from '../../error/error.js'
import {
  AuthenticationCredential,
  AuthenticationOptions,
  UserVerification,
} from '../../schema/passkey.js'
import { Principal } from '../../schema/principal.js'

/* Options */

export class OptionsRequest extends S.Class<OptionsRequest>(
  `@passkey/authentication/options/request`,
)({
  email: S.OptionFromUndefinedOr(S.String),
  userVerification: S.OptionFromUndefinedOr(UserVerification),
}) {}

export class OptionsResponse extends S.Class<OptionsResponse>(
  '@passkey/authentication/options/response',
)({
  session: S.String,
  publicKey: AuthenticationOptions,
}) {}

export const OptionsErrors = S.Union(BadRequest, NotFound)

export type OptionsErrors = S.Schema.Type<typeof OptionsErrors>

/* Verification */

export class VerificationRequest extends S.Class<VerificationRequest>(
  '@passkey/authentication/verification/request',
)({
  session: S.String,
  credential: AuthenticationCredential,
}) {}

export class VerificationResponse extends S.Class<VerificationResponse>(
  '@passkey/authentication/verification/response',
)({
  principal: Principal,
}) {}

export const VerificationErrors = S.Union(BadRequest, Unauthorized, Forbidden, Disabled)

export type VerificationErrors = S.Schema.Type<typeof VerificationErrors>

/* Endpoints */

export const OPTIONS_ENDPOINT = '/passkey/authentication/options'
export const VERIFICATION_ENDPOINT = '/passkey/authentication/verification'

/* Service */

export type AuthenticationService = {
  getAuthenticationOptions: (req: OptionsRequest) => E.Effect<OptionsResponse, OptionsErrors>

  verifyAuthenticationCredential: (
    req: VerificationRequest,
  ) => E.Effect<VerificationResponse, VerificationErrors>
}

/* Handler */

export class AuthenticationHandler extends Context.Tag('@passkey/authentication/handler')<
  AuthenticationHandler,
  AuthenticationService
>() {}
