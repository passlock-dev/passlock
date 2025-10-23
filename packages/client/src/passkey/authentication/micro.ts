import {
  type PublicKeyCredentialRequestOptionsJSON,
  type AuthenticationResponseJSON,
  startAuthentication as simpleAuthentication,
} from "@simplewebauthn/browser";
import { Micro, pipe } from "effect";
import { TenancyId } from "../../tenancy";
import {
  buildEndpoint,
  Endpoint,
  makeRequest,
  type NetworkError,
} from "../../network";
import type { PasslockOptions } from "../../shared";

export class AuthenticationError extends Micro.TaggedError(
  "@error/AuthenticationError",
)<{
  readonly error: unknown;
}> {}

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

const fetchOptions = (username?: string) =>
  Micro.gen(function* () {
    const { endpoint } = yield* Micro.service(Endpoint);
    const { tenancyId } = yield* Micro.service(TenancyId);

    const url = new URL(
      `${tenancyId}/passkey/authentication/options`,
      endpoint,
    );

    return yield* makeRequest({
      url,
      payload: { username },
      operation: "options",
      responsePredicate: isOptionsResponse,
    });
  });

export interface AuthenticationResponse {
  idToken: string;
  code: string;
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

  return true;
};

const verifyCredential = (
  sessionToken: string,
  response: AuthenticationResponseJSON,
) =>
  Micro.gen(function* () {
    const { endpoint } = yield* Micro.service(Endpoint);
    const { tenancyId } = yield* Micro.service(TenancyId);

    const url = new URL(
      `${tenancyId}/passkey/authentication/verification`,
      endpoint,
    );

    return yield* makeRequest({
      url,
      payload: { sessionToken, response },
      operation: "verification",
      responsePredicate: isAuthenticationResponse,
    });
  });

const startAuthentication = (
  optionsJSON: PublicKeyCredentialRequestOptionsJSON,
) =>
  Micro.gen(function* () {
    return yield* Micro.tryPromise({
      try: () => simpleAuthentication({ optionsJSON }),
      catch: (error) => new AuthenticationError({ error }),
    });
  });

export const authenticatePasskey = (
  username: string,
  options: PasslockOptions,
): Micro.Micro<AuthenticationResponse, NetworkError | AuthenticationError> => {
  const endpoint = buildEndpoint(options);

  const effect = Micro.gen(function* () {
    const { sessionToken, optionsJSON } = yield* fetchOptions(username);
    const response = yield* startAuthentication(optionsJSON);
    return yield* verifyCredential(sessionToken, response);
  });

  return pipe(
    effect,
    Micro.provideService(TenancyId, options),
    Micro.provideService(Endpoint, endpoint),
  );
};
