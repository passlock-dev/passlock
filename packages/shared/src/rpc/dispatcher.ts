import { Context, Effect as E, Layer } from 'effect'

import { NetworkError } from '../error/error.js'
import { RetrySchedule, RpcConfig } from './config.js'

/* Services */

export type DispatcherResponse = {
  status: number
  body: object
}

/** To send the JSON to the backend */
export class Dispatcher extends Context.Tag('@rpc/Dispatcher')<
  Dispatcher,
  {
    get: (path: string) => E.Effect<DispatcherResponse, NetworkError>
    post: (path: string, body: string) => E.Effect<DispatcherResponse, NetworkError>
  }
>() {}

/** Fires off client requests using fetch */
/** TODO: Write tests */
/** TODO: Evaluate platform/http client (if now stable) */
export const DispatcherLive = Layer.effect(
  Dispatcher,
  E.gen(function* (_) {
    const { schedule } = yield* _(RetrySchedule)
    const { tenancyId, clientId, endpoint: maybeEndpoint } = yield* _(RpcConfig)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parseJson = (res: Response, url: string) =>
      E.tryPromise({
        try: () => res.json() as Promise<unknown>,
        catch: e =>
          new NetworkError({
            message: 'Unable to extract json response from ' + url,
            detail: String(e),
          }),
      })

    // 400 errors are reflected in the RPC response error channel
    // so in network terms they're still "ok"
    const assertNo500s = (res: Response, url: string) => {
      if (res.status >= 500) {
        return E.fail(
          new NetworkError({
            message: 'Received 500 response code from ' + url,
          }),
        )
      } else return E.void
    }

    const parseJsonObject = (json: unknown) => {
      return typeof json === 'object' && json !== null
        ? E.succeed(json)
        : E.fail(
            new NetworkError({
              message: `Expected JSON object to be returned from RPC endpoint, actual ${typeof json}`,
            }),
          )
    }

    const buildUrl = (_path: string) => {
      const endpoint = maybeEndpoint || 'https://api.passlock.dev'
      // drop leading /
      const path = _path.replace(/^\//, '')
      return `${endpoint}/${tenancyId}/${path}`
    }

    return {
      get: (path: string) => {
        const effect = E.gen(function* (_) {
          const headers = {
            'Accept': 'application/json',
            'X-CLIENT-ID': clientId,
          }

          const url = buildUrl(path)

          const res = yield* _(
            E.tryPromise({
              try: () => fetch(url, { method: 'GET', headers }),
              catch: e =>
                new NetworkError({ message: 'Unable to fetch from ' + url, detail: String(e) }),
            }),
          )

          const json = yield* _(parseJson(res, url))
          yield* _(assertNo500s(res, url))
          const jsonObject = yield* _(parseJsonObject(json))

          return { status: res.status, body: jsonObject }
        })

        return E.retry(effect, { schedule })
      },

      post: (_path: string, body: string) => {
        const effect = E.gen(function* (_) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CLIENT-ID': clientId,
          }

          // drop leading /
          const url = buildUrl(_path)

          const res = yield* _(
            E.tryPromise({
              try: () => fetch(url, { method: 'POST', headers, body }),
              catch: e =>
                new NetworkError({ message: 'Unable to fetch from ' + url, detail: String(e) }),
            }),
          )

          const json = yield* _(parseJson(res, url))
          yield* _(assertNo500s(res, url))
          const jsonObject = yield* _(parseJsonObject(json))

          return { status: res.status, body: jsonObject }
        })

        return E.retry(effect, { schedule })
      },
    }
  })
)
