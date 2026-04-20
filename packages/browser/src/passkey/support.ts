import { browserSupportsWebAuthn, browserSupportsWebAuthnAutofill } from "@simplewebauthn/browser"

/**
 * Test whether the current browser supports passkeys.
 *
 * @returns `true` if the current browser supports passkeys.
 *
 * @category Passkeys (other)
 */
export const isPasskeySupport = (): boolean => browserSupportsWebAuthn()

/**
 * Test whether the current browser supports passkey
 * [autofill](https://passlock.dev/passkeys/autofill/).
 *
 * @returns A promise that resolves to `true` if passkey autofill is supported.
 *
 * @category Passkeys (other)
 */
export const isAutofillSupport = (): Promise<boolean> => browserSupportsWebAuthnAutofill()

export {
  isPasskeyDeleteSupport,
  isPasskeyPruningSupport as isPasskeySyncSupport,
  isPasskeyUpdateSupport,
} from "./signals/signals.js"
