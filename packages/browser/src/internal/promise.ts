import { Either, Micro, pipe } from "effect"
import { type Result, toErrResult, toOkResult } from "./result.js"

/**
 * Run a Micro and return a result envelope containing either
 * the successful value or the expected error value.
 *
 * Note: this function can still throw for an unexpected runtime error.
 *
 * @param micro Micro effect to execute.
 * @returns Promise resolving to a result envelope.
 */
export const runToPromise = async <A extends object, E extends object>(
  micro: Micro.Micro<A, E>
): Promise<Result<A, E>> => {
  const either = await pipe(micro, Micro.either, Micro.runPromise)

  return Either.match(either, {
    onLeft: (failure): Result<A, E> => toErrResult(failure) as Result<A, E>,
    onRight: (success): Result<A, E> => toOkResult(success) as Result<A, E>,
  })
}
