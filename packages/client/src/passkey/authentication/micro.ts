import {
  type PublicKeyCredentialRequestOptionsJSON,
  type AuthenticationResponseJSON,
  WebAuthnError,
  startAuthentication as simpleAuthentication,
} from "@simplewebauthn/browser";
import { Micro, pipe } from "effect";
import { TenancyId } from "../../tenancy";
import {
  buildEndpoint,
  Endpoint,
  makeRequest,
} from "../../network";
import type { PasslockOptions } from "../../shared";
import { Logger, EventLogger } from "../../logger";
import { AuthenticationError, NetworkError } from "../../error";

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
  userId?: string | undefined;
}

const fetchOptions = ({ userId }: AuthenticationOptions) =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger);
    const { endpoint } = yield* Micro.service(Endpoint);
    const { tenancyId } = yield* Micro.service(TenancyId);

    const url = new URL(
      `${tenancyId}/passkey/authentication/options`,
      endpoint,
    );

    yield* logger.logInfo('Fetching passkey authentication options from Passlock');
    return yield* makeRequest({
      url,
      payload: { userId },
      operation: "options",
      responsePredicate: isOptionsResponse,
    });
  });

export interface AuthenticationResponse {
  idToken: string;
  code: string;
  principal: {
    authenticatorId: string;
    userId: string;
  };
}

const isAuthenticationResponse = (
  payload: unknown,
): payload is AuthenticationResponse => {
  if (typeof payload !== "object") return false;
  if (payload === null) return false;

  if (!("idToken" in payload)) return false;
  if (typeof payload.idToken !== "string") return false;

  if (!("code" in payload)) return false;
  if (typeof payload.code !== "string") return false;

  if (!("principal" in payload)) return false;
  if (typeof payload.principal !== "object") return false;
  if (payload.principal === null) return false;

  if (!("userId" in payload.principal)) return false;
  if (typeof payload.principal.userId !== "string") return false;

  if (!("authenticatorId" in payload.principal)) return false;
  if (typeof payload.principal.authenticatorId !== "string") return false;

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
      operation: "verification",
      responsePredicate: isAuthenticationResponse,
    });

    yield* logger.logInfo(
      `Passkey with id ${authenticationResponse.principal.authenticatorId} successfully authenticated`
    );

    return authenticationResponse;
  });

const startAuthentication = (
  optionsJSON: PublicKeyCredentialRequestOptionsJSON,
) =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger);

    yield* logger.logInfo("Requesting passkey authentication on device")
    return yield* Micro.tryPromise({
      try: () => simpleAuthentication({ optionsJSON }),
      catch: (error) => { 
        if (error instanceof WebAuthnError) {
          return new AuthenticationError({ error: error.cause, message: error.message, code: error.code }) 
        } else {
          return new AuthenticationError({ error, message: "Unexpected error" }) 
        }
      },
    });
  });

export const authenticatePasskey = (
  authenticationOptions: AuthenticationOptions,
): Micro.Micro<AuthenticationResponse, AuthenticationError | NetworkError> => {
  const endpoint = buildEndpoint(authenticationOptions);

  const effect = Micro.gen(function* () {
    const { sessionToken, optionsJSON } = yield* fetchOptions(
      authenticationOptions,
    );

    const response = yield* startAuthentication(optionsJSON);
    
    return yield* verifyCredential(sessionToken, response);
  });

  return pipe(
    effect,
    Micro.provideService(TenancyId, authenticationOptions),
    Micro.provideService(Endpoint, endpoint),
    Micro.provideService(Logger, EventLogger)
  );
};
