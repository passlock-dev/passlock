import type { PasslockOptions } from "../../shared/options"
import { Micro, pipe } from "effect"
import { EventLogger, Logger } from "../../logger"
import { runToPromise, runToPromiseUnsafe } from "../../shared/promise"
import {
  type CredentialMapping,
  type DeletionError,
  deletePasskey as deletePasskeyM,
  isDeletionError,
  isPasskeyDeletionSupport as isPasskeyDeletionSupportM,
  signalCredentialRemoval,
} from "./signals"

export const isPasskeyDeletionSupport = () => pipe(isPasskeyDeletionSupportM, Micro.runSync)

export const deletePasskey = (
  identifiers: string | CredentialMapping,
  options: PasslockOptions,
  logger: typeof Logger.Service = EventLogger
): Promise<boolean | DeletionError> => {
  const micro =
    typeof identifiers === "string"
      ? deletePasskeyM(identifiers, options)
      : signalCredentialRemoval(identifiers)

  return pipe(micro, Micro.provideService(Logger, logger), runToPromise)
}

export const deletePasskeyUnsafe = (
  passkeyId: string,
  options: PasslockOptions,
  logger: typeof Logger.Service = EventLogger
): Promise<boolean> => {
  const micro =
    typeof passkeyId === "string"
      ? deletePasskeyM(passkeyId, options)
      : signalCredentialRemoval(passkeyId)

  return pipe(micro, Micro.provideService(Logger, logger), runToPromiseUnsafe)
}

export { isDeletionError }
export type { DeletionError, CredentialMapping }
