import {
    Forbidden,
    InternalServerError,
    NotFound,
    Unauthorized,
} from '@passlock/shared/dist/error/error.js'
import { Principal, createParser } from '@passlock/shared/dist/schema/schema.js'
import type { StreamEmit } from 'effect'
import { Chunk, Console, Context, Effect as E, Layer, Option, Stream, flow, pipe } from 'effect'
import * as https from 'https'
import { Config } from '../config/config.js'

/* Dependencies */

export type StreamResponse = (
  options: https.RequestOptions,
) => Stream.Stream<Buffer, PrincipalErrors>
export const StreamResponse = Context.GenericTag<StreamResponse>('@services/ResponseStream')

/* Service */

const parsePrincipal = createParser(Principal)

export type PrincipalErrors = NotFound | Unauthorized | Forbidden | InternalServerError
export type PrincipalRequest = { token: string }

export type PrincipalService = {
  fetchPrincipal: (request: PrincipalRequest) => E.Effect<Principal, PrincipalErrors>
}

export const PrincipalService = Context.GenericTag<PrincipalService>('@services/Principal')

/* Effects */

const buildHostname = (endpoint: string | undefined) => { 
  return new URL(endpoint || 'https://api.passlock.dev').hostname 
}

const buildOptions = (token: string) =>
  pipe(
    Config,
    E.map(({ endpoint, tenancyId, apiKey }) => ({
      hostname: buildHostname(endpoint),
      port: 443,
      path: `/${tenancyId}/token/${token}`,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    })),
  )

export const buildError = (res: {
  statusCode?: number | undefined
  statusMessage?: string | undefined
}) => {
  if (res.statusCode === 404) return new NotFound({ message: 'Invalid token' })
  if (res.statusCode === 401) return new Unauthorized({ message: 'Unauthorized' })
  if (res.statusCode === 403) return new Forbidden({ message: 'Forbidden' })

  if (res.statusCode && res.statusMessage)
    return new InternalServerError({ message: `${String(res.statusCode)} - ${res.statusMessage}` })
  
    if (res.statusCode) return new InternalServerError({ message: String(res.statusCode) })
  
    if (res.statusMessage) return new InternalServerError({ message: res.statusMessage })

  return new InternalServerError({ message: 'Received non 200 response' })
}

const fail = (error: PrincipalErrors) => E.fail(Option.some(error))
const succeed = (data: Buffer) => E.succeed(Chunk.of(data))
const close = E.fail(Option.none())

const buildStream = (token: string) =>
  pipe(
    Stream.fromEffect(buildOptions(token)),
    Stream.zip(StreamResponse),
    Stream.flatMap(([options, streamResponse]) => streamResponse(options)),
  )

export const fetchPrincipal = (
  request: PrincipalRequest,
): E.Effect<Principal, PrincipalErrors, StreamResponse | Config> => {
  const stream = buildStream(request.token)

  const json = pipe(
    Stream.runCollect(stream),
    E.map(Chunk.toReadonlyArray),
    E.map(buffers => Buffer.concat(buffers)),
    E.flatMap(buffer =>
      E.try({
        try: () => buffer.toString(),
        catch: e =>
          new InternalServerError({
            message: 'Unable to convert response to string',
            detail: String(e),
          }),
      }),
    ),
    E.flatMap(buffer =>
      E.try({
        try: () => JSON.parse(buffer) as unknown,
        catch: e =>
          new InternalServerError({
            message: 'Unable to parse response to json',
            detail: String(e),
          }),
      }),
    ),
    E.flatMap(json =>
      pipe(
        parsePrincipal(json),
        E.tapError(error => Console.error(error.detail)),
        E.mapError(
          () => new InternalServerError({ message: 'Unable to parse response as Principal' }),
        ),
      ),
    ),
  )

  return json
}

/* Live */

/* v8 ignore start */
export const StreamResponseLive = Layer.succeed(StreamResponse, options => {
  return Stream.async((emit: StreamEmit.Emit<never, PrincipalErrors, Buffer, void>) => {
    https
      .request(options, res => {
        if (200 !== res.statusCode) void emit(fail(buildError(res)))
        res.on('data', (data: Buffer) => void emit(succeed(data)))
        res.on('close', () => void emit(close))
        res.on('error', e => void emit(fail(new InternalServerError({ message: e.message }))))
      })
      .end()
  })
})

export const PrincipalServiceLive = Layer.effect(
  PrincipalService,
  E.gen(function* (_) {
    const context = yield* _(E.context<Config | StreamResponse>())
    return PrincipalService.of({
      fetchPrincipal: flow(fetchPrincipal, E.provide(context)),
    })
  }),
)
/* v8 ignore stop */
