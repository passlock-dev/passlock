import { Context, Effect as E, Layer } from 'effect'

import {
  OptionsErrors,
  OptionsReq,
  OptionsRes,
  type RegistrationService,
  VerificationErrors,
  VerificationReq,
  VerificationRes,
} from '@passlock/shared/dist/rpc/registration.js'

import { Dispatcher, makePostRequest } from './client.js'

/* Client */

export class RegistrationClient extends Context.Tag('@passkey/register/client')<
  RegistrationClient,
  RegistrationService
>() {}

export const RegistrationClientLive = Layer.effect(
  RegistrationClient,
  E.gen(function* (_) {
    const dispatcher = yield* _(Dispatcher)

    const optionsResolver = makePostRequest(OptionsReq, OptionsRes, OptionsErrors, dispatcher)

    const verifyResolver = makePostRequest(
      VerificationReq,
      VerificationRes,
      VerificationErrors,
      dispatcher,
    )

    return {
      getRegistrationOptions: req => optionsResolver('/passkey/register/options', req),
      verifyRegistrationCredential: req => verifyResolver('/passkey/register/verify', req),
    }
  }),
)
