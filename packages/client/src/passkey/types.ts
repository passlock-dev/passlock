/**
 * https://w3c.github.io/webauthn/#enumdef-publickeycredentialhint
 */
export type PublicKeyCredentialHint = 'hybrid' | 'security-key' | 'client-device';

/**
 * https://www.iana.org/assignments/webauthn/webauthn.xhtml#webauthn-attestation-statement-format-ids
 */
export type AttestationFormat = 'fido-u2f' | 'packed' | 'android-safetynet' | 'android-key' | 'tpm' | 'apple' | 'none';

/**
 * https://w3c.github.io/webauthn/#dictdef-publickeycredentialcreationoptionsjson
 */
export interface PublicKeyCredentialCreationOptionsJSON {
    rp: PublicKeyCredentialRpEntity;
    user: PublicKeyCredentialUserEntityJSON;
    challenge: Base64URLString;
    pubKeyCredParams: PublicKeyCredentialParameters[];
    timeout?: number;
    excludeCredentials?: PublicKeyCredentialDescriptorJSON[];
    authenticatorSelection?: AuthenticatorSelectionCriteria;
    hints?: PublicKeyCredentialHint[];
    attestation?: AttestationConveyancePreference;
    attestationFormats?: AttestationFormat[];
    extensions?: AuthenticationExtensionsClientInputs;
}