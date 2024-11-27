import { Context, Effect as E, Layer } from 'effect'

import {
  OptionsErrors,
  OptionsRequest,
  OptionsResponse,
  type RegistrationService,
  VerificationErrors,
  VerificationRequest,
  VerificationResponse,
  OPTIONS_ENDPOINT,
  VERIFICATION_ENDPOINT
} from '@passlock/shared/dist/rpc/passkey/registration.js'

import { Dispatcher, makePostRequest } from '../client.js'

/* Client */

export class RegistrationClient extends Context.Tag('@passkey/register/client')<
  RegistrationClient,
  RegistrationService
>() {}

export const RegistrationClientLive = Layer.effect(
  RegistrationClient,
  E.gen(function* (_) {
    const dispatcher = yield* _(Dispatcher)

    const optionsResolver = makePostRequest(OptionsRequest, OptionsResponse, OptionsErrors, dispatcher)

    const verifyResolver = makePostRequest(
      VerificationRequest,
      VerificationResponse,
      VerificationErrors,
      dispatcher,
    )

    return {
      getRegistrationOptions: req => optionsResolver(OPTIONS_ENDPOINT, req),
      verifyRegistrationCredential: req => verifyResolver(VERIFICATION_ENDPOINT, req),
    }
  }),
)

export {
  OptionsErrors,
  OptionsRequest,
  OptionsResponse,
  VerificationErrors,
  VerificationRequest,
  VerificationResponse,
} from '@passlock/shared/dist/rpc/passkey/registration.js'
