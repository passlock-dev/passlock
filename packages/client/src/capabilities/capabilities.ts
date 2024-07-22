/**
 * Test if the browser supports passkeys, conditional UI etc
 */
import { NotSupported } from '@passlock/shared/dist/error/error.js'
import { Context, Effect as E, Layer, identity, pipe } from 'effect'

/* Service */

export type Capabilities = {
  passkeySupport: E.Effect<void, NotSupported>
  isPasskeySupport: E.Effect<boolean>
  autofillSupport: E.Effect<void, NotSupported>
  isAutofillSupport: E.Effect<boolean>
}

export const Capabilities = Context.GenericTag<Capabilities>('@services/Capabilities')

/* Effects */

const hasWebAuthn = E.suspend(() =>
  typeof window.PublicKeyCredential === 'function'
    ? E.void
    : new NotSupported({ message: 'WebAuthn API is not supported on this device' }),
)

const hasPlatformAuth = pipe(
  E.tryPromise(() => window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()),
  E.filterOrFail(
    identity,
    () => new NotSupported({ message: 'No platform authenticator available on this device' }),
  ),
  E.asVoid,
)

const hasConditionalUi = pipe(
  E.tryPromise({
    try: () => window.PublicKeyCredential.isConditionalMediationAvailable(),
    catch: () =>
      new NotSupported({ message: 'Conditional mediation not available on this device' }),
  }),
  E.filterOrFail(
    identity,
    () => new NotSupported({ message: 'Conditional mediation not available on this device' }),
  ),
  E.asVoid,
)

export const passkeySupport = pipe(
  hasWebAuthn,
  E.andThen(hasPlatformAuth),
  E.catchTag('UnknownException', e => E.die(e)),
)

export const isPasskeySupport = pipe(
  passkeySupport,
  E.match({
    onFailure: () => false,
    onSuccess: () => true,
  }),
)

export const autofillSupport = pipe(passkeySupport, E.andThen(hasConditionalUi))

export const isAutofillSupport = pipe(
  autofillSupport,
  E.match({
    onFailure: () => false,
    onSuccess: () => true,
  }),
)

/* Live */

/* v8 ignore start */
export const capabilitiesLive = Layer.succeed(Capabilities, {
  passkeySupport,
  isPasskeySupport,
  autofillSupport,
  isAutofillSupport,
})
/* v8 ignore stop */
