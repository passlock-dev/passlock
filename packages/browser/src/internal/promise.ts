import { Effect, Result as EffectResult, pipe } from "effect"
import { type Result, toErrResult, toOkResult } from "./result.js"

/**
 * Run an Effect and return a result envelope containing either
 * the successful value or the expected error value.
 *
 * Note: this function can still throw for an unexpected runtime error.
 *
 * @param effect Effect to execute.
 * @returns Promise resolving to a result envelope.
 */
export const runToPromise = async <A extends object, E extends object>(
  effect: Effect.Effect<A, E>
): Promise<Result<A, E>> => {
  const result = await pipe(effect, Effect.result, Effect.runPromise)

  return EffectResult.match(result, {
    onFailure: (failure): Result<A, E> => toErrResult(failure) as Result<A, E>,
    onSuccess: (success): Result<A, E> => toOkResult(success) as Result<A, E>,
  })
}
