import { Context, Effect as E, Layer } from 'effect'

import {
  type AuthenticationService,
  OPTIONS_ENDPOINT,
  OptionsErrors,
  OptionsRequest,
  OptionsResponse,
  VERIFICATION_ENDPOINT,
  VerificationErrors,
  VerificationRequest,
  VerificationResponse,
} from '@passlock/shared/dist/rpc/passkey/authentication.js'

import { Dispatcher, makePostRequest } from '../client.js'

/* Client */

export class AuthenticationClient extends Context.Tag('@passkey/authentication/client')<
  AuthenticationClient,
  AuthenticationService
>() { }

export const AuthenticationClientLive = Layer.effect(
  AuthenticationClient,
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
      getAuthenticationOptions: req => optionsResolver(OPTIONS_ENDPOINT, req),
      verifyAuthenticationCredential: req => verifyResolver(VERIFICATION_ENDPOINT, req),
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
} from '@passlock/shared/dist/rpc/passkey/authentication.js'
