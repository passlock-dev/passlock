/**
 * Passkey authentication effects
 */
import {
  type CredentialRequestOptionsJSON,
  parseRequestOptionsFromJSON,
} from '@github/webauthn-json/browser-ponyfill'
import { InternalBrowserError, type NotSupported } from '@passlock/shared/dist/error/error.js'
import {
  type OptionsErrors,
  type OptionsReq,
  type VerificationErrors,
  VerificationReq,
} from '@passlock/shared/dist/rpc/authentication.js'
import type { AuthenticationCredential } from '@passlock/shared/dist/schema/passkey.js'
import type { Principal } from '@passlock/shared/dist/schema/principal.js'
import { Context, Effect as E, Layer, flow, pipe } from 'effect'
import { Capabilities } from '../capabilities/capabilities.js'
import { AuthenticationClient } from '../rpc/authentication.js'
import { StorageService } from '../storage/storage.js'

/* Requests */

export type AuthenticationRequest = OptionsReq
/* Errors */

export type AuthenticationErrors = NotSupported | OptionsErrors | VerificationErrors

/* Dependencies */

export class GetCredential extends Context.Tag('@services/GetCredential')<
  GetCredential,
  {
    getCredential: (
      request: CredentialRequestOptions,
    ) => E.Effect<AuthenticationCredential, InternalBrowserError>
  }
>() {}

/* Service */

export class AuthenticationService extends Context.Tag('@services/AuthenticationService')<
  AuthenticationService,
  {
    authenticatePasskey: (
      request: AuthenticationRequest,
    ) => E.Effect<Principal, AuthenticationErrors>
  }
>() {}

/* Utilities */

const fetchOptions = (request: OptionsReq) => {
  return E.gen(function* (_) {
    yield* _(E.logDebug('Making request'))

    const rpcClient = yield* _(AuthenticationClient)
    const { publicKey, session } = yield* _(rpcClient.getAuthenticationOptions(request))

    yield* _(E.logDebug('Converting Passlock options to CredentialRequestOptions'))
    const options = yield* _(toRequestOptions({ publicKey }))

    return { options, session }
  })
}

const toRequestOptions = (request: CredentialRequestOptionsJSON) => {
  return pipe(
    E.try(() => parseRequestOptionsFromJSON(request)),
    E.mapError(
      error =>
        new InternalBrowserError({
          message: 'Browser was unable to create credential request options',
          detail: String(error.error),
        }),
    ),
  )
}

const verifyCredential = (request: VerificationReq) => {
  return E.gen(function* (_) {
    yield* _(E.logDebug('Making request'))

    const rpcClient = yield* _(AuthenticationClient)
    const { principal } = yield* _(rpcClient.verifyAuthenticationCredential(request))

    return principal
  })
}

/* Effects */

type Dependencies = GetCredential | Capabilities | StorageService | AuthenticationClient

export const authenticatePasskey = (
  request: AuthenticationRequest,
): E.Effect<Principal, AuthenticationErrors, Dependencies> => {
  const effect = E.gen(function* (_) {
    yield* _(E.logInfo('Checking if browser supports Passkeys'))
    const capabilities = yield* _(Capabilities)
    yield* _(capabilities.passkeySupport)

    yield* _(E.logInfo('Fetching authentication options from Passlock'))

    const { options, session } = yield* _(fetchOptions(request))

    yield* _(E.logInfo('Looking up credential'))
    const { getCredential } = yield* _(GetCredential)
    const credential = yield* _(getCredential(options))

    yield* _(E.logInfo('Verifying credential with Passlock'))
    const principal = yield* _(verifyCredential(new VerificationReq({ credential, session })))

    const storageService = yield* _(StorageService)
    yield* _(storageService.storeToken(principal))
    yield* _(E.logDebug('Stored token in local storage'))

    yield* _(E.logDebug('Defering local token deletion'))
    const delayedClearTokenE = pipe(
      storageService.clearExpiredToken('passkey'),
      E.delay('6 minutes'),
      E.fork,
    )
    yield* _(delayedClearTokenE)

    return principal
  })

  return E.catchTag(effect, 'InternalBrowserError', e => E.die(e))
}

/* Live */

/* v8 ignore start */
export const AuthenticateServiceLive = Layer.effect(
  AuthenticationService,
  E.gen(function* (_) {
    const context = yield* _(
      E.context<GetCredential | AuthenticationClient | Capabilities | StorageService>(),
    )

    return AuthenticationService.of({
      authenticatePasskey: flow(authenticatePasskey, E.provide(context)),
    })
  }),
)
/* v8 ignore stop */
