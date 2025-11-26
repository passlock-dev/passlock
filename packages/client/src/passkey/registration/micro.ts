import {
  browserSupportsWebAuthn,
  type PublicKeyCredentialCreationOptionsJSON,
  type RegistrationResponseJSON,
  startRegistration as simpleRegistration,
  WebAuthnError,
} from "@simplewebauthn/browser";

import { Micro, pipe } from "effect";
import { TenancyId } from "../../tenancy";

import {
  buildEndpoint,
  Endpoint,
  makeRequest,
  NetworkError
} from "../../network";

import { PasskeyError, PasskeysUnsupportedError } from "../shared";
import { type PasslockOptions } from "../../shared";
import { Logger, EventLogger } from "../../logger";
import type { UserVerification } from "../types";

interface OptionsResponse {
  sessionToken: string;
  optionsJSON: PublicKeyCredentialCreationOptionsJSON;
}

export const isDuplicatePasskeyError = (err: unknown): err is DuplicatePasskeyError => err instanceof DuplicatePasskeyError;

/**
 * Raised if excludeCredentials or userId was provided and the
 * device recognises one of the passkey ids i.e. the user currently
 * has a passkey registered on the current device for a given userId.
 */
export class DuplicatePasskeyError extends Micro.TaggedError(
  "DuplicatePasskeyError",
)<{
  readonly message: string;
}> {
  static isDuplicatePasskeyError = isDuplicatePasskeyError;
}  

const isOptionsResponse = (payload: unknown): payload is OptionsResponse => {
  if (typeof payload !== "object") return false;
  if (payload === null) return false;

  if (!("optionsJSON" in payload)) return false;
  if (typeof payload.optionsJSON !== "object") return false;
  if (payload.optionsJSON === null) return false;

  if (!("sessionToken" in payload)) return false;
  if (typeof payload.sessionToken !== "string") return false;

  return true;
};

/**
 * Passkey registration options
 */
export interface RegistrationOptions extends PasslockOptions {
  /**
   * The username associated with the newly reguistered passkey..
   * 
   * @see {@link https://passlock.dev/getting-started/passkey-registration/#passkey-username|username}
   */
  username: string;
  /**
   * Human palateable username
   */
  userDisplayName?: string | undefined;  
  /**
   * Passlock userId. Essentially a shortcut to look up any 
   * currently registered passkeys (excludeCredentials) for a given user.
   */
  userId?: string | undefined;
  /**
   * Prevents the user registering a passkey if they already have one
   * (for the same user account) registered on the current device.
   * 
   * @see {@link https://passlock.dev/passkeys/registration/#excludecredentials|excludeCredentials}
   */
  excludeCredentials?: Array<string> | undefined;
  /**
   * Whether the device should re-authenticate the user locally before registering the passkey.
   * 
   * @see {@link https://passlock.dev/passkeys/user-verification/|userVerification}
   */
  userVerification?: UserVerification | undefined;
  timeout?: number | undefined;
}

const fetchOptions = ({ 
  username, 
  userDisplayName, 
  userId, 
  excludeCredentials, 
  userVerification, 
  timeout 
}: RegistrationOptions) =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger);
    const { endpoint } = yield* Micro.service(Endpoint);
    const { tenancyId } = yield* Micro.service(TenancyId);

    const url = new URL(`${tenancyId}/passkey/registration/options`, endpoint);

    yield* logger.logInfo("Fetching passkey registration options from Passlock");
    return yield* makeRequest({
      url,
      payload: { 
        username, 
        userDisplayName,
        userId, 
        excludeCredentials, 
        userVerification, 
        timeout 
      },
      responsePredicate: isOptionsResponse,
      label: "registration options",
    });
  });

const RegistrationSuccessTag = "RegistrationSuccess" as const;
type RegistrationSuccessTag = typeof RegistrationSuccessTag;

/**
 * Represents the outcome of a successfull passkey registration.
 * Submit the code and/or id_token to your backend, then either
 * exchange the code with the passlock REST API or decode and
 * verify the id_token (JWT).
 * 
 * Note: The @passlock/node library includes utilities to do this
 * for you.
 */  
export interface RegistrationSuccess {
  _tag: RegistrationSuccessTag,
  principal: {
    authenticatorId: string;
    userId: string;
  };  
  /**
   * A signed JWT representing the newly registered passkey.
   * Decode and verify this in your backend or use one of the @passlock/node
   * helper utilities.
   * 
   * @see {@link https://passlock.dev/principal/idtoken-verification/|id_token}
   */
  id_token: string;
  /**
   * Call the Passlock API to exchange this code for details about the newly 
   * registered passkey.
   * 
   * @see {@link https://passlock.dev/principal/code-exchange//|code exchange}
   */  
  code: string;
}

export const isRegistrationSuccess = (payload: unknown): payload is RegistrationSuccess => {
  if (typeof payload !== "object") return false;
  if (payload === null) return false;

  if (!('_tag' in payload)) return false;
  if (typeof payload._tag !== "string") return false;
  if (payload._tag !== RegistrationSuccessTag) return false;
  
  return true;
}

const verifyCredential = (
  sessionToken: string,
  response: RegistrationResponseJSON,
) =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger);
    const { endpoint } = yield* Micro.service(Endpoint);
    const { tenancyId } = yield* Micro.service(TenancyId);

    const url = new URL(
      `${tenancyId}/passkey/registration/verification`,
      endpoint,
    );

    yield* logger.logInfo("Registering passkey in Passlock vault");

    const registrationResponse = yield* makeRequest({
      url,
      payload: { sessionToken, response },
      responsePredicate: isRegistrationSuccess,
      label: "registration verification",
    });

    yield* logger.logInfo(
      `Passkey registered with id ${registrationResponse.principal.authenticatorId}`
    );

    return registrationResponse;
  });

const startRegistration = (
  optionsJSON: PublicKeyCredentialCreationOptionsJSON,
) =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger);
    yield* logger.logInfo("Registering passkey on device");

    const isSupport = browserSupportsWebAuthn()
    if (!isSupport) yield* new PasskeysUnsupportedError({ 
      message: "Device does not support passkeys" 
    })

    return yield* Micro.tryPromise({
      try: () => simpleRegistration({ optionsJSON }),
      catch: (error) => { 
        if (error instanceof WebAuthnError && error.code === 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED') {
         return new DuplicatePasskeyError({ message: error.message }) 
        } else if (error instanceof WebAuthnError) {
         return new PasskeyError({ error: error.cause, message: error.message, code: error.code }) 
        } else {
          return new PasskeyError({ error, message: "Unexpected error" }) 
        }
      },
    });
  });

/**
 * Potential errors associated with Passkey registration
 */
export type RegistrationErrors = PasskeysUnsupportedError | DuplicatePasskeyError | PasskeyError | NetworkError;

/**
 * Register a passkey on the local device and store the 
 * associated public key in your Passlock vault. 
 * @param options 
 * @returns 
 */
export const registerPasskey = (
  options: RegistrationOptions,
): Micro.Micro<RegistrationSuccess, RegistrationErrors> => {
  const endpoint = buildEndpoint(options);

  const effect = Micro.gen(function* () {
    const { sessionToken, optionsJSON } = yield* fetchOptions(options);
    const response = yield* startRegistration(optionsJSON);
    return yield* verifyCredential(sessionToken, response);
  });

  return pipe(
    effect,
    Micro.provideService(TenancyId, options),
    Micro.provideService(Endpoint, endpoint),
    Micro.provideService(Logger, EventLogger)
  );
};
