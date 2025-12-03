import { Either, identity, Micro, pipe } from "effect";
import { error } from "effect/Brand";

/**
 * Run a Micro and return a success or failure.
 * Note: function could still throw for an unexpected error.
 * @param micro
 * @returns
 */
export const runToPromise = async <A, E>(
  micro: Micro.Micro<A, E>,
): Promise<A | E> => {
  const either = await pipe(micro, Micro.either, Micro.runPromise);

  return Either.match(either, {
    onLeft: identity,
    onRight: identity,
  });
};

/**
 * Run a Micro and return a success or throw an error
 * @param micro
 * @returns
 */
export const runToPromiseUnsafe = async <A, E>(
  micro: Micro.Micro<A, E>,
): Promise<A> => {
  const exit = await Micro.runPromiseExit(micro);

  if (Micro.exitIsSuccess(exit)) return exit.value;

  if (Micro.exitIsFail(exit)) {
    if (error instanceof Error) {
      throw exit.cause;
    } else throw new Error(String(exit.cause.error));
  }

  if (Micro.exitIsDie(exit)) {
    if (exit.cause.defect instanceof Error) {
      throw exit.cause.defect;
    } else new Error(String(exit.cause.defect));
  }

  if (Micro.exitIsInterrupt(exit)) throw new Error(exit.cause.message);

  if (Micro.exitIsFailure(exit)) throw new Error(exit.cause.message);
  else throw new Error("Unexpected error");
};
