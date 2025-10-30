import {
  type PublicKeyCredentialCreationOptionsJSON,
  type RegistrationResponseJSON,
  startRegistration as simpleRegistration,
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

export class RegistrationError extends Micro.TaggedError(
  "@error/RegistrationError",
)<{
  readonly error: unknown;
}> {}

interface OptionsResponse {
  sessionToken: string;
  optionsJSON: PublicKeyCredentialCreationOptionsJSON;
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

export interface RegistrationOptions extends PasslockOptions {
  username?: string | undefined;
}

const fetchOptions = ({ username }: RegistrationOptions) =>
  Micro.gen(function* () {
    const { endpoint } = yield* Micro.service(Endpoint);
    const { tenancyId } = yield* Micro.service(TenancyId);

    const url = new URL(`${tenancyId}/passkey/registration/options`, endpoint);

    return yield* makeRequest({
      url,
      payload: { username },
      responsePredicate: isOptionsResponse,
      operation: "options",
    });
  });

export interface RegistrationResponse {
  idToken: string;
  code: string;
  principal: {
    authenticatorId: string;
    userId: string
  }
}

const isRegistrationResponse = (
  payload: unknown,
): payload is RegistrationResponse => {
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
  response: RegistrationResponseJSON,
) =>
  Micro.gen(function* () {
    const { endpoint } = yield* Micro.service(Endpoint);
    const { tenancyId } = yield* Micro.service(TenancyId);

    const url = new URL(
      `${tenancyId}/passkey/registration/verification`,
      endpoint,
    );

    return yield* makeRequest({
      url,
      payload: { sessionToken, response },
      responsePredicate: isRegistrationResponse,
      operation: "verification",
    });
  });

const startRegistration = (
  optionsJSON: PublicKeyCredentialCreationOptionsJSON,
) =>
  Micro.gen(function* () {
    return yield* Micro.tryPromise({
      try: () => simpleRegistration({ optionsJSON }),
      catch: (error) => new RegistrationError({ error }),
    });
  });

export const registerPasskey = (
  options: RegistrationOptions,
): Micro.Micro<RegistrationResponse, RegistrationError | NetworkError> => {
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
  );
};
