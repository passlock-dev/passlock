import { Micro } from "effect";

export const runToPromise = async <A, E>(
  micro: Micro.Micro<A, E>,
): Promise<A> => {
  const exit = await Micro.runPromiseExit(micro);

  if (Micro.exitIsSuccess(exit)) return exit.value;

  if (Micro.exitIsFail(exit))
    throw exit.cause.error instanceof Error
      ? exit.cause.error
      : new Error(String(exit.cause.error));

  if (Micro.exitIsDie(exit))
    throw exit.cause.defect instanceof Error
      ? exit.cause.defect
      : new Error(String(exit.cause.defect));

  if (Micro.exitIsInterrupt(exit)) throw new Error(exit.cause.message);

  if (Micro.exitIsFailure(exit)) throw new Error(exit.cause.message);
  
  else throw new Error("Unexpected error");
};
