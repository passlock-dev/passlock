/**
 * WebAuthn user-verification preference passed to registration and
 * authentication ceremonies.
 *
 * @see {@link https://passlock.dev/passkeys/user-verification/ User verification (main docs site)}
 * @see {@link https://w3c.github.io/webauthn/#enumdef-userverificationrequirement WebAuthn specification}
 *
 * @category Passkeys (core)
 */
export type UserVerification = "discouraged" | "preferred" | "required"

/**
 * Browser hint describing the authenticator transport the UI should prefer.
 *
 * @see {@link https://w3c.github.io/webauthn/#enumdef-publickeycredentialhint WebAuthn specification}
 */
export type PublicKeyCredentialHint =
  | "hybrid"
  | "security-key"
  | "client-device"

/**
 * IANA-registered WebAuthn attestation statement format identifier.
 *
 * @see {@link https://www.iana.org/assignments/webauthn/webauthn.xhtml#webauthn-attestation-statement-format-ids IANA registry}
 */
export type AttestationFormat =
  | "fido-u2f"
  | "packed"
  | "android-safetynet"
  | "android-key"
  | "tpm"
  | "apple"
  | "none"

/**
 * JSON-serializable variant of
 * `PublicKeyCredentialCreationOptions`.
 *
 * @see {@link https://w3c.github.io/webauthn/#dictdef-publickeycredentialcreationoptionsjson WebAuthn specification}
 */
export type PublicKeyCredentialCreationOptionsJSON = {
  rp: PublicKeyCredentialRpEntity
  user: PublicKeyCredentialUserEntityJSON
  challenge: Base64URLString
  pubKeyCredParams: Array<PublicKeyCredentialParameters>
  timeout?: number
  excludeCredentials?: Array<PublicKeyCredentialDescriptorJSON>
  authenticatorSelection?: AuthenticatorSelectionCriteria
  hints?: Array<PublicKeyCredentialHint>
  attestation?: AttestationConveyancePreference
  attestationFormats?: Array<AttestationFormat>
  extensions?: AuthenticationExtensionsClientInputs
}

/**
 * Duration in milliseconds.
 */
export type Millis = number
