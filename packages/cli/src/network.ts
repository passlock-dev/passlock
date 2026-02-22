import { Context, Data, Effect, Layer } from "effect"

/**
 * Supported HTTP methods accepted by {@link fetchNetwork}.
 */
export type NetworkMethod = "get" | "post" | "delete" | "patch"

/**
 * Lightweight response model used by this package.
 *
 * Invariants:
 * - `json` is lazy: parsing only happens when the effect is run.
 * - `json` is memoized per response wrapper, so repeated evaluation does not
 *   parse the same payload multiple times.
 */
export interface NetworkResponse {
  readonly status: number
  readonly statusText: string
  readonly statusMessage: string
  readonly headers: Readonly<Record<string, string>>
  readonly json: Effect.Effect<unknown, NetworkResponseError>
}

/**
 * Accepted request header input formats.
 */
export type NetworkHeaders =
  | Headers
  | Readonly<Record<string, string>>
  | Array<[string, string]>

/**
 * Optional request options for {@link fetchNetwork}.
 */
export interface FetchNetworkOptions {
  readonly headers?: NetworkHeaders
}

/**
 * Effect service tag for the fetch implementation.
 *
 * Supply this service with `Effect.provide` / layers to swap fetch behavior
 * in tests or alternate runtimes.
 */
export class NetworkFetch extends Context.Tag("@passlock/node/network/Fetch")<
  NetworkFetch,
  typeof fetch
>() {}

/**
 * Default live fetch layer backed by `globalThis.fetch`.
 */
export const NetworkFetchLive: Layer.Layer<NetworkFetch> = Layer.succeed(
  NetworkFetch,
  globalThis.fetch
)

/**
 * HTTP status buckets used by {@link matchStatus}.
 */
export type NetworkResponseStatusCase = "2xx" | "3xx" | "4xx" | "5xx"

type MatchStatusHandler<
  Resp extends NetworkResponse = NetworkResponse,
  A = unknown,
  E = unknown,
> = (response: Resp) => Effect.Effect<A, E, never>

type HandlerEffect<
  Cases extends MatchStatusCases<Resp>,
  Resp extends NetworkResponse,
  Case extends NetworkResponseStatusCase | "orElse",
> = Case extends keyof Cases
  ? NonNullable<Cases[Case]> extends MatchStatusHandler<Resp>
    ? ReturnType<NonNullable<Cases[Case]>>
    : never
  : never

type MatchStatusEffectUnion<
  Cases extends MatchStatusCases<Resp>,
  Resp extends NetworkResponse,
> =
  | HandlerEffect<Cases, Resp, "2xx">
  | HandlerEffect<Cases, Resp, "3xx">
  | HandlerEffect<Cases, Resp, "4xx">
  | HandlerEffect<Cases, Resp, "5xx">
  | HandlerEffect<Cases, Resp, "orElse">

type MatchStatusResolvedHandler<
  Cases extends MatchStatusCases<Resp>,
  Resp extends NetworkResponse,
> = NonNullable<
  Cases["2xx"] | Cases["3xx"] | Cases["4xx"] | Cases["5xx"] | Cases["orElse"]
>

type EffectSuccess<T> =
  T extends Effect.Effect<infer A, unknown, unknown> ? A : never

type EffectError<T> =
  T extends Effect.Effect<unknown, infer E, unknown> ? E : never

type EffectContext<T> =
  T extends Effect.Effect<unknown, unknown, infer R> ? R : never

/**
 * Handlers used by {@link matchStatus}.
 *
 * Invariants:
 * - `orElse` is always required.
 * - Specific status family handlers are optional and fall back to `orElse`
 *   when missing.
 */
export interface MatchStatusCases<
  Resp extends NetworkResponse = NetworkResponse,
> {
  readonly "2xx"?: MatchStatusHandler<Resp>
  readonly "3xx"?: MatchStatusHandler<Resp>
  readonly "4xx"?: MatchStatusHandler<Resp>
  readonly "5xx"?: MatchStatusHandler<Resp>
  readonly orElse: MatchStatusHandler<Resp>
}

type RequestContext = {
  readonly method: NetworkMethod
  readonly url: string
}

/**
 * Raised when the underlying fetch call fails before a response is received.
 */
export class NetworkRequestError extends Data.TaggedError(
  "@error/NetworkRequest"
)<{
  readonly method: NetworkMethod
  readonly url: string
  readonly message: string
}> {}

/**
 * Raised when request payload serialization fails.
 */
export class NetworkPayloadError extends Data.TaggedError(
  "@error/NetworkPayload"
)<{
  readonly method: NetworkMethod
  readonly message: string
}> {}

/**
 * Raised when response body parsing fails.
 */
export class NetworkResponseError extends Data.TaggedError(
  "@error/NetworkResponse"
)<{
  readonly method: NetworkMethod
  readonly url: string
  readonly message: string
}> {}

const formatMessage = (cause: unknown, fallback: string): string =>
  cause instanceof Error ? cause.message : fallback

/**
 * Convert an HTTP status code into its status family bucket.
 *
 * Returns `undefined` for codes outside the 2xx-5xx families.
 */
export const statusToCase = (
  status: number
): NetworkResponseStatusCase | undefined => {
  if (status >= 200 && status <= 299) return "2xx"
  if (status >= 300 && status <= 399) return "3xx"
  if (status >= 400 && status <= 499) return "4xx"
  if (status >= 500 && status <= 599) return "5xx"

  return undefined
}

const resolveStatusHandler = <
  Resp extends NetworkResponse,
  Cases extends MatchStatusCases<Resp>,
>(
  response: Resp,
  cases: Cases
): MatchStatusResolvedHandler<Cases, Resp> => {
  const statusCase = statusToCase(response.status)
  if (!statusCase)
    return cases.orElse as MatchStatusResolvedHandler<Cases, Resp>

  const handler = cases[statusCase]
  return (handler ?? cases.orElse) as MatchStatusResolvedHandler<Cases, Resp>
}

/**
 * Route a {@link NetworkResponse} to the first matching status-family handler.
 *
 * Invariants:
 * - `2xx`/`3xx`/`4xx`/`5xx` handlers are matched by status family.
 * - `orElse` is always used as a fallback when no specific family handler exists.
 * - The returned effect type is inferred as the union of all handler effects.
 */
export const matchStatus = <
  Resp extends NetworkResponse,
  Cases extends MatchStatusCases<Resp>,
>(
  response: Resp,
  cases: Cases
): Effect.Effect<
  EffectSuccess<MatchStatusEffectUnion<Cases, Resp>>,
  EffectError<MatchStatusEffectUnion<Cases, Resp>>,
  EffectContext<MatchStatusEffectUnion<Cases, Resp>>
> =>
  Effect.suspend(() => {
    const handler = resolveStatusHandler(response, cases)
    return handler(response)
  }) as Effect.Effect<
    EffectSuccess<MatchStatusEffectUnion<Cases, Resp>>,
    EffectError<MatchStatusEffectUnion<Cases, Resp>>,
    EffectContext<MatchStatusEffectUnion<Cases, Resp>>
  >

/**
 * Serialize an optional payload into a JSON request body.
 *
 * Invariants:
 * - `GET` requests cannot carry a payload and fail with `NetworkPayloadError`.
 * - when a payload exists, `content-type: application/json` is emitted.
 */
const serializePayload = (
  method: NetworkMethod,
  payload?: unknown
): Effect.Effect<
  | {
      readonly body: string
      readonly headers: Readonly<Record<string, string>>
    }
  | undefined,
  NetworkPayloadError
> => {
  if (payload === undefined) {
    return Effect.succeed(undefined)
  }

  if (method === "get") {
    return Effect.fail(
      new NetworkPayloadError({
        method,
        message: "GET requests do not support a request body",
      })
    )
  }

  return Effect.try({
    try: () => ({
      body: JSON.stringify(payload),
      headers: { "content-type": "application/json" },
    }),
    catch: (cause) =>
      new NetworkPayloadError({
        method,
        message: formatMessage(cause, "Unable to serialize payload to JSON"),
      }),
  })
}

/**
 * Convert `Headers` into a readonly plain record.
 */
export const headersToRecord = (
  headers: Headers
): Readonly<Record<string, string>> => Object.fromEntries(headers.entries())

const normalizeHeaders = (headers: NetworkHeaders): Headers => {
  if (headers instanceof Headers) {
    return new Headers(headers)
  }

  if (Array.isArray(headers)) {
    return new Headers(headers)
  }

  return new Headers(headers)
}

const mergeHeaders = (
  ...headers: ReadonlyArray<Readonly<Record<string, string>>>
): Readonly<Record<string, string>> => Object.assign({}, ...headers)

/**
 * Build a lazy, memoized JSON parser effect from a response.
 *
 * Invariants:
 * - parsing happens on effect execution, not during response construction.
 * - parsing uses `response.clone()` so the original response body remains untouched.
 */
const makeJsonEffect = (
  response: Response,
  context: RequestContext
): Effect.Effect<unknown, NetworkResponseError> => {
  let cached: Promise<unknown> | undefined

  return Effect.tryPromise({
    try: () => {
      cached = cached ?? response.clone().json()
      return cached
    },
    catch: (cause) =>
      new NetworkResponseError({
        method: context.method,
        url: context.url,
        message: formatMessage(cause, "Unable to parse response JSON"),
      }),
  })
}

const toNetworkResponse = (
  response: Response,
  context: RequestContext
): NetworkResponse => ({
  status: response.status,
  statusText: response.statusText,
  statusMessage: response.statusText,
  headers: headersToRecord(response.headers),
  json: makeJsonEffect(response, context),
})

/**
 * Execute a fetch request using the injected {@link NetworkFetch} service.
 *
 * Invariants:
 * - method is always normalized to upper-case before dispatch.
 * - JSON payload (if present) is serialized before request execution.
 * - caller headers override payload-derived headers when keys overlap.
 * - the returned `NetworkResponse.json` remains lazy.
 */
export const fetchNetwork = (
  url: string | URL,
  method: NetworkMethod,
  payload?: unknown,
  options?: FetchNetworkOptions
): Effect.Effect<
  NetworkResponse,
  NetworkRequestError | NetworkPayloadError,
  NetworkFetch
> =>
  Effect.gen(function* () {
    const requestUrl = String(url)
    const context: RequestContext = { method, url: requestUrl }
    const fetchImpl = yield* NetworkFetch
    const serialized = yield* serializePayload(method, payload)

    const providedHeaders = options?.headers
      ? headersToRecord(normalizeHeaders(options.headers))
      : {}

    const requestHeaders = mergeHeaders(
      serialized?.headers ?? {},
      providedHeaders
    )
    const hasHeaders = Object.keys(requestHeaders).length > 0

    const response = yield* Effect.tryPromise({
      try: () =>
        fetchImpl(requestUrl, {
          method: method.toUpperCase(),
          ...(hasHeaders ? { headers: requestHeaders } : {}),
          ...(serialized
            ? {
                body: serialized.body,
              }
            : {}),
        }),
      catch: (cause) =>
        new NetworkRequestError({
          method,
          url: requestUrl,
          message: formatMessage(cause, "Network request failed"),
        }),
    })

    return toNetworkResponse(response, context)
  })
