import { browserSupportsWebAuthn, browserSupportsWebAuthnAutofill } from "@simplewebauthn/browser"

export const isPasskeySupport = (): boolean => browserSupportsWebAuthn()

export const isAutofillSupport = (): Promise<boolean> => browserSupportsWebAuthnAutofill()
