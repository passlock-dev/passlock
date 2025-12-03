import { Context, Micro } from "effect";

/**
 * Make a request to the Passlock API endpoint.
 * Assumes the response is JSON and any errors
 * have a non-200 status code, are also JSON and
 * include message and _tag fields.
 */

/**
 * TODO Consider Effect RPC/HttpClient
 */

const DefaultEndpoint = "https://api.passlock.dev";

export const isUnexpectedError = (err: unknown): err is UnexpectedError =>
  err instanceof UnexpectedError;

export class UnexpectedError extends Micro.TaggedError(
  "@error/UnexpectedError",
)<{
  readonly message: string;
  readonly url: string;
}> {
  static isUnexpectedError = isUnexpectedError;
}

/**
 * Passlock API endpoint
 */
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

/**
 * Make a fetch request and parse the response using the provided
 * responsePredicate function.
 * @param param0
 * @returns
 */
export const makeRequest = <Res extends object>({
  url,
  payload,
  responsePredicate,
  label,
}: {
  url: URL;
  /** Request payload */
  payload: object;
  /** Response type guard */
  responsePredicate: (res: unknown) => res is Res;
  /** For logging/error reporting */
  label: string;
}): Micro.Micro<Res, UnexpectedError> =>
  Micro.gen(function* () {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    } as const;

    const body = JSON.stringify(payload);

    const networkError = new UnexpectedError({
      message: "Fetch failed",
      url: String(url),
    });

    const parseError = new UnexpectedError({
      message: "Unable to parse JSON response",
      url: String(url),
    });

    const invalidResponsePayload = new UnexpectedError({
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
        ? yield* new UnexpectedError({
            ...apiError,
            url: String(url),
          })
        : yield* parseError;
    }

    const json = yield* Micro.tryPromise({
      try: () => fetchResponse.json() as Promise<unknown>,
      catch: () => parseError,
    });

    return responsePredicate(json) ? json : yield* invalidResponsePayload;
  });
