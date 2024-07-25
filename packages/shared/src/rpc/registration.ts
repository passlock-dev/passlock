import * as S from '@effect/schema/Schema'
import { Context, Effect as E, Layer } from 'effect'

import { BadRequest, Duplicate, Forbidden, Unauthorized } from '../error/error.js'

import {
  RegistrationCredential,
  RegistrationOptions,
  UserVerification,
} from '../schema/passkey.js'

import { VerifyEmail } from '../schema/email.js'
import { Principal } from '../schema/principal.js'

import { makePostRequest } from './client.js'
import { Dispatcher } from './dispatcher.js'

/* Options */

export class OptionsReq extends S.Class<OptionsReq>('@passkey/register/optionsReq')({
  email: S.String,
  givenName: S.String,
  familyName: S.String,
  userVerification: S.optional(UserVerification),
  verifyEmail: S.optional(VerifyEmail),
  redirectUrl: S.optional(S.String),
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
  verifyEmail: S.optional(VerifyEmail),
  redirectUrl: S.optional(S.String),
}) {}

export class VerificationRes extends S.Class<VerificationRes>('@passkey/register/verificationRes')({
  principal: Principal,
}) {}

export const VerificationErrors = S.Union(BadRequest, Duplicate, Unauthorized, Forbidden)

export type VerificationErrors = S.Schema.Type<typeof VerificationErrors>

/* Service */

export type RegistrationService = {
  getRegistrationOptions: (req: OptionsReq) => E.Effect<OptionsRes, OptionsErrors>
  verifyRegistrationCredential: (
    req: VerificationReq,
  ) => E.Effect<VerificationRes, VerificationErrors>
}

/* Client */

export const OPTIONS_ENDPOINT = '/passkey/register/options'
export const VERIFY_ENDPOINT = '/passkey/register/verify'

export class RegistrationClient extends Context.Tag('@passkey/register/client')<
  RegistrationClient,
  RegistrationService
>() {}

export const RegistrationClientLive = Layer.effect(
  RegistrationClient,
  E.gen(function* (_) {
    const dispatcher = yield* _(Dispatcher)
    const optionsResolver = makePostRequest(OptionsReq, OptionsRes, OptionsErrors, dispatcher)
    const verifyResolver = makePostRequest(VerificationReq, VerificationRes, VerificationErrors, dispatcher)

    return {
      getRegistrationOptions: req => optionsResolver("/passkey/register/options", req),
      verifyRegistrationCredential: req => verifyResolver("/passkey/register/verify", req)
    }
  })
)

/* Handler */

export class RegistrationHandler extends Context.Tag('@passkey/register/handler')<
  RegistrationHandler,
  RegistrationService
>() {}
