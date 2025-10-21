import { Micro } from "effect";

export const runToPromise = async <A, E>(micro: Micro.Micro<A, E>): Promise<A> => {
  const exit = await Micro.runPromiseExit(micro)

  if (Micro.exitIsSuccess(exit)) return exit.value;
  if (Micro.exitIsFail(exit)) throw exit.cause.error;
  if (Micro.exitIsDie(exit)) throw exit.cause.defect;
  if (Micro.exitIsInterrupt(exit)) throw exit.cause.message;
  if (Micro.exitIsFailure(exit)) throw exit.cause.message;

  else throw new Error("Unexpected error");
}