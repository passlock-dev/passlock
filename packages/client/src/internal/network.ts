import { Context, Micro } from "effect"

export const isNetworkError = (payload: unknown): payload is NetworkError => {
  if (typeof payload !== "object") return false
  if (payload === null) return false
  return payload instanceof NetworkError
}

export class NetworkError extends Error {
  readonly _tag = "@error/Network" as const
  readonly message: string
  readonly url: string

  constructor({ message, url }: { message: string; url: string }) {
    super()
    this.message = message
    this.url = url
  }

  static isNetworkError = isNetworkError
}

/**
 * Make a request to the Passlock API endpoint.
 * Successful responses are expected to be JSON.
 * For non-2xx responses this function first attempts to parse JSON so typed
 * API errors can be returned, and falls back to a generic network error when
 * parsing fails.
 *
 * TODO Consider Effect RPC/HttpClient
 */

const DEFAULT_ENDPOINT = "https://api.passlock.dev"

/**
 * Passlock API endpoint
 */
export class Endpoint extends Context.Tag("Endpoint")<
  Endpoint,
  { readonly endpoint: string }
>() {}

export const makeEndpoint = ({
  endpoint = DEFAULT_ENDPOINT,
}: {
  endpoint?: string
}): Endpoint["Type"] => Endpoint.of({ endpoint })

/**
 * Indicates the type we received from the API can be considered
 * as an error.
 */
type ErrorResponse = {
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

export type RequestOptions<A extends object, E = never> = {
  url: URL

  /** Request payload */
  payload: object

  /** Response type guard */
  responsePredicate: (res: unknown) => res is A

  /** Error response type guard */
  errorPredicate?: (res: unknown, status: number) => res is E

  /** For logging/error reporting */
  label: string
}

/**
 * Make a fetch request and parse the response using the provided
 * responsePredicate function.
 *
 * @param options Request options.
 * @returns A Micro effect that resolves with the typed response payload.
 */
export const makeRequest = <A extends object, E = never>({
  url,
  payload,
  responsePredicate,
  errorPredicate = (res): res is E => false,
  label,
}: RequestOptions<A, E>): Micro.Micro<A, E | NetworkError> =>
  Micro.gen(function* () {
    const isUnderTest =
      typeof process !== "undefined" && process.env.VITEST === "true"

    // when running the test in nodejs there is no browser therefore no
    // origin header is set so we need to fake it
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(isUnderTest ? { Origin: "http://localhost:3000" } : {}),
    } as const

    const body = JSON.stringify(payload)

    const networkError = new NetworkError({
      message: "Fetch failed",
      url: String(url),
    })

    const parseError = new NetworkError({
      message: "Unable to parse JSON response",
      url: String(url),
    })

    const invalidResponsePayload = new NetworkError({
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
        try: () => fetchResponse.json() as Promise<unknown>,
        catch: () => parseError,
      })

      if (errorPredicate(apiError, fetchResponse.status)) {
        return yield* Micro.fail(apiError)
      } else if (isErrorResponse(apiError)) {
        return yield* Micro.fail(
          new NetworkError({
            ...apiError,
            url: String(url),
          })
        )
      } else {
        return yield* Micro.fail(parseError)
      }
    } else if (!fetchResponse.ok) {
      const message = yield* Micro.promise(() => fetchResponse.text())
      return yield* Micro.fail(
        new NetworkError({
          message,
          url: String(url),
        })
      )
    }

    const json = yield* Micro.tryPromise({
      try: () => fetchResponse.json() as Promise<unknown>,
      catch: () => parseError,
    })

    return responsePredicate(json)
      ? json
      : yield* Micro.fail(invalidResponsePayload)
  })
