import { OptionsErrors, OptionsReq, OptionsRes, VerificationErrors, VerificationReq, VerificationRes, type RegistrationService } from '@passlock/shared/dist/rpc/registration.js'
import { Context, Effect as E, Layer } from 'effect'
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