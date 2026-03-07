import {
  browserSupportsWebAuthn,
  browserSupportsWebAuthnAutofill,
} from "@simplewebauthn/browser"

/**
 * Test for passkey support on the device
 *
 * @returns `true` if the current browser supports passkeys.
 *
 * @category Passkeys (other)
 */
export const isPasskeySupport = (): boolean => browserSupportsWebAuthn()

/**
 * Test for passkey [autofill](https://passlock.dev/passkeys/autofill/) support on the device.
 *
 * @returns A promise that resolves to `true` if passkey autofill is supported.
 *
 * @category Passkeys (other)
 */
export const isAutofillSupport = (): Promise<boolean> =>
  browserSupportsWebAuthnAutofill()

export {
  isPasskeyDeleteSupport,
  isPasskeyPruningSupport as isPasskeySyncSupport,
  isPasskeyUpdateSupport,
} from "./signals/signals.js"
