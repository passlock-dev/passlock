import { Context, Micro } from "effect";

const DefaultEndpoint = "https://api.passlock.dev";

export const isNetworkError = (err: unknown): err is NetworkError =>
  err instanceof NetworkError;

export class NetworkError extends Micro.TaggedError("NetworkError")<{
  readonly message: string;
  readonly url: string;
}> {
  static isNetworkError = isNetworkError;
}

export class Endpoint extends Context.Tag("Endpoint")<
  Endpoint,
  { readonly endpoint: string }
>() {}

export const buildEndpoint = ({
  endpoint = DefaultEndpoint,
}: {
  endpoint?: string;
}): Endpoint["Type"] => Endpoint.of({ endpoint });

interface ErrorResponse {
  message: string;
  _tag: string;
}

const isErrorResponse = (payload: unknown): payload is ErrorResponse => {
  if (typeof payload !== "object") return false;
  if (payload === null) return false;

  if (!("message" in payload)) return false;
  if (typeof payload.message !== "string") return false;

  if (!("_tag" in payload)) return false;
  if (typeof payload._tag !== "string") return false;

  return true;
};

export const makeRequest = <Res extends object>({
  url,
  payload,
  responsePredicate,
  label,
}: {
  url: URL;
  payload: object;
  responsePredicate: (res: unknown) => res is Res;
  label: string;
}): Micro.Micro<Res, NetworkError> =>
  Micro.gen(function* () {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    } as const;

    const body = JSON.stringify(payload);

    const networkError = new NetworkError({
      message: "Fetch failed",
      url: String(url),
    });

    const parseError = new NetworkError({
      message: "Unable to parse JSON response",
      url: String(url),
    });

    const invalidResponsePayload = new NetworkError({
      message: `Invalid ${label} response`,
      url: String(url),
    });

    const fetchResponse = yield* Micro.tryPromise({
      try: () => fetch(url, { method: "post", headers, body }),
      catch: () => networkError,
    });

    if (!fetchResponse.ok) {
      const apiError = yield* Micro.tryPromise({
        try: () => fetchResponse.json() as Promise<unknown>,
        catch: () => parseError,
      });

      return isErrorResponse(apiError)
        ? yield* new NetworkError({
            ...apiError,
            url: String(url),
          })
        : yield* networkError;
    }

    const json = yield* Micro.tryPromise({
      try: () => fetchResponse.json() as Promise<unknown>,
      catch: () => parseError,
    });

    return responsePredicate(json) ? json : yield* invalidResponsePayload;
  });
