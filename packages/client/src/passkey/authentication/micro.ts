import {
  type AuthenticationResponseJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  WebAuthnError,
  browserSupportsWebAuthn,
  startAuthentication as simpleAuthentication,
} from "@simplewebauthn/browser";

import { Micro, pipe } from "effect";
import { TenancyId } from "../../tenancy";

import {
  Endpoint,
  type UnexpectedError,
  buildEndpoint,
  makeRequest,
} from "../../network";

import { Logger } from "../../logger";
import { type PasslockOptions } from "../../shared";
import { OtherPasskeyError, PasskeysUnsupportedError } from "../shared";
import type { UserVerification } from "../types";
import { signalCredentialRemoval } from "../signals/micro";

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

export const authenticationEvent = [
  "optionsRequest",
  "getCredential",
  "verifyCredential",
] as const;

export type AuthenticationEvent = (typeof authenticationEvent)[number];

export type OnEventFn = (event: AuthenticationEvent) => void;

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
  /**
   * Use browser autofill.
   */
  autofill?: boolean;
  /**
   * Receive notifications about key stages in the authentication process.
   * For example, you might use event notifications to toggle loading icons or
   * to disable certain form fields.
   * @param event
   * @returns
   */
  onEvent?: OnEventFn;
  timeout?: number | undefined;
}

const fetchOptions = (options: AuthenticationOptions) =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger);
    const { endpoint } = yield* Micro.service(Endpoint);
    const { tenancyId } = yield* Micro.service(TenancyId);

    const { userId, userVerification, allowCredentials, onEvent } = options;

    const url = new URL(
      `${tenancyId}/passkey/authentication/options`,
      endpoint,
    );

    onEvent?.("optionsRequest");
    yield* logger.logInfo(
      "Fetching passkey authentication options from Passlock",
    );

    return yield* makeRequest({
      url,
      payload: { userId, userVerification, allowCredentials },
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

export interface PasskeyNotFound {
  _tag: "@error/PasskeyNotFound";
  message: string;
  credentialId: string;
  rpId: string;
}

export const isPasskeyNotFound = (
  payload: unknown,
): payload is PasskeyNotFound => {
  if (typeof payload !== "object") return false;
  if (payload === null) return false;

  if (!("_tag" in payload)) return false;
  if (typeof payload._tag !== "string") return false;
  if (payload._tag !== "@error/PasskeyNotFound") return false;

  if (!("message" in payload)) return false;
  if (typeof payload.message !== "string") return false;

  if (!("credentialId" in payload)) return false;
  if (typeof payload.credentialId !== "string") return false;

  if (!("rpId" in payload)) return false;
  if (typeof payload.rpId !== "string") return false;

  return true;
};

const startAuthentication = (
  optionsJSON: PublicKeyCredentialRequestOptionsJSON,
  {
    useBrowserAutofill,
    onEvent,
  }: {
    useBrowserAutofill: boolean;
    onEvent?: OnEventFn | undefined;
  },
) =>
  Micro.gen(function* () {
    onEvent?.("getCredential");
    const logger = yield* Micro.service(Logger);
    yield* logger.logInfo("Requesting passkey authentication on device");

    const isSupport = browserSupportsWebAuthn();
    if (!isSupport)
      yield* new PasskeysUnsupportedError({
        message: "Device does not support passkeys",
      });

    return yield* Micro.tryPromise({
      try: () => simpleAuthentication({ optionsJSON, useBrowserAutofill }),
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

const verifyCredential = (
  sessionToken: string,
  response: AuthenticationResponseJSON,
  { onEvent }: { onEvent?: OnEventFn | undefined },
) =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger);
    const { endpoint } = yield* Micro.service(Endpoint);
    const { tenancyId } = yield* Micro.service(TenancyId);

    const url = new URL(
      `${tenancyId}/passkey/authentication/verification`,
      endpoint,
    );

    onEvent?.("verifyCredential");
    yield* logger.logInfo("Verifying passkey in Passlock vault");

    const authenticationResponse = yield* makeRequest({
      url,
      payload: { sessionToken, response },
      label: "authentication verification",
      responsePredicate: isAuthenticationSuccess,
      errorPredicate: (res) => isPasskeyNotFound(res) ? res : null,
    });

    yield* logger.logInfo(
      `Passkey with id ${authenticationResponse.principal.authenticatorId} successfully authenticated`,
    );

    return authenticationResponse;
  });

interface UnknownCredentialOptions {
  rpId: string;
  credentialId: string;
}

interface PublicKeyCredentialFuture {
  signalUnknownCredential?: (
    options: UnknownCredentialOptions,
  ) => Promise<void>;
}

export type AuthenticationError =
  | PasskeysUnsupportedError
  | OtherPasskeyError
  | PasskeyNotFound
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

    const go = (useBrowserAutofill: boolean) =>
      Micro.gen(function* () {
        yield* Micro.sleep(100);

        const response = yield* startAuthentication(optionsJSON, {
          useBrowserAutofill,
          onEvent: options.onEvent,
        });

        options.onEvent?.("verifyCredential");
        return yield* verifyCredential(sessionToken, response, {
          onEvent: options.onEvent,
        });
      });

    if (options.autofill === true) {
      return yield* go(options.autofill);
    } else {
      return yield* go(false);
    }
  });

  const withNotFoundHandling = pipe(
    effect,
    Micro.tapError((err) =>
      err._tag === "@error/PasskeyNotFound"
        ? signalCredentialRemoval(err)
        : Micro.void,
    ),
  );

  return pipe(
    withNotFoundHandling,
    Micro.provideService(TenancyId, options),
    Micro.provideService(Endpoint, endpoint),
  );
};
