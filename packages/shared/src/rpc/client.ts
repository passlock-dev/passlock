import * as S from '@effect/schema/Schema'
import { Effect as E, pipe } from "effect"
import { Dispatcher } from "./dispatcher.js"

export const makeGetRequest = <AI, AO, EI, EO>(
  responseSchema: S.Schema<AI, AO, never>, 
  errorSchema: S.Schema<EI, EO, never>,
  dispatcher: Dispatcher['Type']
) => (path: string) => pipe(
  dispatcher.get(path),
  E.flatMap(res => {
    if (res.status === 200) return S.decodeUnknown(responseSchema)(res.body)
    return pipe(
      S.decodeUnknown(errorSchema)(res.body),
      E.flatMap(err => E.fail(err))
    )
  }),
  E.catchTag('ParseError', e => E.die(e)),
  E.catchTag('NetworkError', e => E.die(e))
)

export const makePostRequest = <RI, RO, AI, AO, EI, EO>(
  requestSchema: S.Schema<RI, RO, never>, 
  responseSchema: S.Schema<AI, AO, never>, 
  errorSchema: S.Schema<EI, EO, never>,
  dispatcher: Dispatcher['Type']
) => (path: string, request: RI) => {
    return pipe(
   S.encode(requestSchema)(request),
    E.flatMap(request =>
      dispatcher.post(path, JSON.stringify(request))
    ),
    E.flatMap(res => {
      if (res.status === 200) return S.decodeUnknown(responseSchema)(res.body)
      return pipe(
        S.decodeUnknown(errorSchema)(res.body),
        E.flatMap(err => E.fail(err))
      )
    }),
    E.catchTag('ParseError', e => E.die(e)),
    E.catchTag('NetworkError', e => E.die(e))
  )
}