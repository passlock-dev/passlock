import { Context, Micro } from "effect"

/**
 * Make a request to the Passlock API endpoint.
 * Assumes the response is JSON and any errors
 * have a non-200 status code, are also JSON and
 * include message and _tag fields.
 */

/**
 * TODO Consider Effect RPC/HttpClient
 */

const DefaultEndpoint = "https://api.passlock.dev"

export const isUnexpectedError = (err: unknown): err is UnexpectedError =>
  err instanceof UnexpectedError

export class UnexpectedError extends Micro.TaggedError("@error/UnexpectedError")<{
  readonly message: string
  readonly url: string
}> {
  static isUnexpectedError = isUnexpectedError
}

/**
 * Passlock API endpoint
 */
export class Endpoint extends Context.Tag("Endpoint")<Endpoint, { readonly endpoint: string }>() {}

export const buildEndpoint = ({
  endpoint = DefaultEndpoint,
}: {
  endpoint?: string
}): Endpoint["Type"] => Endpoint.of({ endpoint })

interface ErrorResponse {
  message: string
  _tag: string
}

const isErrorResponse = (payload: unknown): payload is ErrorResponse => {
  if (typeof payload !== "object") return false
  if (payload === null) return false

  if (!("message" in payload)) return false
  if (typeof payload.message !== "string") return false

  if (!("_tag" in payload)) return false
  if (typeof payload._tag !== "string") return false

  return true
}

/**
 * Make a fetch request and parse the response using the provided
 * responsePredicate function.
 * @param param0
 * @returns
 */
export const makeRequest = <A extends object, E = never>({
  url,
  payload,
  responsePredicate,
  errorPredicate = (res): res is E => false,
  label,
}: {
  url: URL
  /** Request payload */
  payload: object
  /** Response type guard */
  responsePredicate: (res: unknown) => res is A
  /** Error response type guard */
  errorPredicate?: (res: unknown, status: number) => res is E
  /** For logging/error reporting */
  label: string
}): Micro.Micro<A, E | UnexpectedError> =>
  Micro.gen(function* () {
    const isUnderTest = typeof process !== "undefined" && process.env.VITEST === "true"

    // when running the test in nodejs there is no browser therefore no
    // origin header is set so we need to fake it
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(isUnderTest ? { Origin: "http://localhost:3000" } : {}),
    } as const

    const body = JSON.stringify(payload)

    const networkError = new UnexpectedError({
      message: "Fetch failed",
      url: String(url),
    })

    const parseError = new UnexpectedError({
      message: "Unable to parse JSON response",
      url: String(url),
    })

    const invalidResponsePayload = new UnexpectedError({
      message: `Invalid ${label} response`,
      url: String(url),
    })

    const fetchResponse = yield* Micro.tryPromise({
      try: () => fetch(url, { body, headers, method: "post" }),
      catch: () => networkError,
    })

    const contentType = fetchResponse.headers.get("Content-Type")
    const isJsonResponse = contentType === "application/json"

    if (!fetchResponse.ok && isJsonResponse) {
      const apiError = yield* Micro.tryPromise({
        catch: () => parseError,
        try: () => fetchResponse.json() as Promise<unknown>,
      })

      if (errorPredicate(apiError, fetchResponse.status)) {
        return yield* Micro.fail(apiError)
      } else if (isErrorResponse(apiError)) {
        return yield* new UnexpectedError({
          ...apiError,
          url: String(url),
        })
      } else {
        return yield* parseError
      }
    } else if (!fetchResponse.ok) {
      const message = yield* Micro.promise(() => fetchResponse.text())
      return yield* new UnexpectedError({
        message,
        url: String(url),
      })
    }

    const json = yield* Micro.tryPromise({
      catch: () => parseError,
      try: () => fetchResponse.json() as Promise<unknown>,
    })

    return responsePredicate(json) ? json : yield* invalidResponsePayload
  })
