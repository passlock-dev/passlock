import {
  type PublicKeyCredentialRequestOptionsJSON,
  type AuthenticationResponseJSON,
  WebAuthnError,
  startAuthentication as simpleAuthentication,
  browserSupportsWebAuthn,
} from "@simplewebauthn/browser";

import { Micro, pipe } from "effect";
import { TenancyId } from "../../tenancy";

import {
  type UnexpectedError,
  buildEndpoint,
  Endpoint,
  makeRequest,
} from "../../network";

import { OtherPasskeyError, PasskeysUnsupportedError } from "../shared";
import { type PasslockOptions } from "../../shared";
import { Logger } from "../../logger";
import type { UserVerification } from "../types";

interface OptionsResponse {
  sessionToken: string;
  optionsJSON: PublicKeyCredentialRequestOptionsJSON;
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

export interface AuthenticationOptions extends PasslockOptions {
  /**
   * Passlock userId. Essentially a shortcut to look up any
   * registered passkeys (allowCredentials) for a given user.
   */
  userId?: string | undefined;
  /**
   * Restrict the passkey(s) the device presents to the user to a given set
   *
   * @see {@link https://passlock.dev/passkeys/authentication/#allowcredentials|allowCredentials}
   */
  allowCredentials?: Array<string> | undefined;
  /**
   * Whether the device should re-authenticate the user locally before registering the passkey.
   *
   * @see {@link https://passlock.dev/passkeys/user-verification/|userVerification}
   */
  userVerification?: UserVerification | undefined;
  timeout?: number | undefined;
}

const fetchOptions = ({ userId, userVerification }: AuthenticationOptions) =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger);
    const { endpoint } = yield* Micro.service(Endpoint);
    const { tenancyId } = yield* Micro.service(TenancyId);

    const url = new URL(
      `${tenancyId}/passkey/authentication/options`,
      endpoint,
    );

    yield* logger.logInfo(
      "Fetching passkey authentication options from Passlock",
    );
    return yield* makeRequest({
      url,
      payload: { userId, userVerification },
      label: "authentication options",
      responsePredicate: isOptionsResponse,
    });
  });

const AuthenticationSuccessTag = "AuthenticationSuccess" as const;
type AuthenticationSuccessTag = typeof AuthenticationSuccessTag;

/**
 * Represents the outcome of a successfull passkey authentication.
 * Submit the code and/or id_token to your backend, then either
 * exchange the code with the passlock REST API or decode and
 * verify the id_token (JWT).
 *
 * Note: The @passlock/node library includes utilities to do this
 * for you.
 */
export interface AuthenticationSuccess {
  _tag: AuthenticationSuccessTag;
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

export const isAuthenticationSuccess = (
  payload: unknown,
): payload is AuthenticationSuccess => {
  if (typeof payload !== "object") return false;
  if (payload === null) return false;

  if (!("_tag" in payload)) return false;
  if (typeof payload._tag !== "string") return false;
  if (payload._tag !== AuthenticationSuccessTag) return false;

  return true;
};

const verifyCredential = (
  sessionToken: string,
  response: AuthenticationResponseJSON,
) =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger);
    const { endpoint } = yield* Micro.service(Endpoint);
    const { tenancyId } = yield* Micro.service(TenancyId);

    const url = new URL(
      `${tenancyId}/passkey/authentication/verification`,
      endpoint,
    );

    yield* logger.logInfo("Verifying passkey in Passlock vault");

    const authenticationResponse = yield* makeRequest({
      url,
      payload: { sessionToken, response },
      label: "authentication verification",
      responsePredicate: isAuthenticationSuccess,
    });

    yield* logger.logInfo(
      `Passkey with id ${authenticationResponse.principal.authenticatorId} successfully authenticated`,
    );

    return authenticationResponse;
  });

const startAuthentication = (
  optionsJSON: PublicKeyCredentialRequestOptionsJSON,
) =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger);
    yield* logger.logInfo("Requesting passkey authentication on device");

    const isSupport = browserSupportsWebAuthn();
    if (!isSupport)
      yield* new PasskeysUnsupportedError({
        message: "Device does not support passkeys",
      });

    return yield* Micro.tryPromise({
      try: () => simpleAuthentication({ optionsJSON }),
      catch: (error) => {
        if (error instanceof WebAuthnError) {
          return new OtherPasskeyError({
            error: error.cause,
            message: error.message,
            code: error.code,
          });
        } else {
          return new OtherPasskeyError({ error, message: "Unexpected error" });
        }
      },
    });
  });

export type AuthenticationError =
  | PasskeysUnsupportedError
  | OtherPasskeyError
  | UnexpectedError;

/**
 * Trigger local passkey authentication then verify the passkey in the Passlock vault.
 * Returns a code and id_token that can be exchanged/decoded in your backend.
 *
 * @param options
 * @returns
 */
export const authenticatePasskey = (
  options: AuthenticationOptions,
): Micro.Micro<AuthenticationSuccess, AuthenticationError, Logger> => {
  const endpoint = buildEndpoint(options);

  const effect = Micro.gen(function* () {
    const { sessionToken, optionsJSON } = yield* fetchOptions(options);

    const response = yield* startAuthentication(optionsJSON);

    return yield* verifyCredential(sessionToken, response);
  });

  return pipe(
    effect,
    Micro.provideService(TenancyId, options),
    Micro.provideService(Endpoint, endpoint),
  );
};
