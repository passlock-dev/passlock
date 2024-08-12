import * as S from '@effect/schema/Schema'
import { formatError } from '@effect/schema/TreeFormatter'
import { Effect as E, pipe } from 'effect'

export const optional = <A>(s: S.Schema<A>) => S.optionalWith(s, { exact: true })

export class ParsingError extends S.TaggedError<ParsingError>()('ParsingError', {
  message: S.String,
  detail: S.String,
}) {}

export const createParser =
  <A, E, R>(schema: S.Schema<A, E, R>) =>
  (input: unknown) => {
    return pipe(
      S.decodeUnknown(schema)(input),
      E.flip,
      E.flatMap(formatError),
      E.map(detail => new ParsingError({ message: 'Unable to parse input', detail })),
      E.flip,
    )
  }
