import type { PasslockOptions } from "../../shared/options"
import { Micro, pipe } from "effect"
import { encodeUriComponent } from "effect/Encoding"
import { Logger } from "../../logger"
import { buildEndpoint } from "../../shared/network"

export const isPasskeyDeletionSupport = Micro.sync(() => {
  return (
    PublicKeyCredential?.signalUnknownCredential &&
    typeof PublicKeyCredential.signalUnknownCredential === "function"
  )
})

export const isAcceptedCredentialsSupport = Micro.sync(() => {
  return (
    PublicKeyCredential?.signalAllAcceptedCredentials &&
    typeof PublicKeyCredential.signalAllAcceptedCredentials === "function"
  )
})

/* Deletion error */

export const isDeletionError = (err: unknown) => err instanceof DeletionError

export class DeletionError extends Micro.TaggedError("@error/DeletionError")<{
  readonly message: string
  readonly code: "PASSKEY_DELETION_UNSUPPORTED" | "PASSKEY_NOT_FOUND" | "OTHER_ERROR"
}> {
  static isDeletionError = isDeletionError
}

/* Sync error */

export const isSyncError = (err: unknown) => err instanceof SyncError

export class SyncError extends Micro.TaggedError("@error/SyncError")<{
  readonly message: string
  readonly code: "PASSKEY_SYNC_UNSUPPORTED" | "OTHER_ERROR"
}> {
  static isSyncError = isSyncError
}

export interface CredentialMapping {
  credentialId: string
  rpId: string
}

const isCredentialMapping = (payload: unknown): payload is CredentialMapping => {
  if (typeof payload !== "object") return false
  if (payload === null) return false

  if (!("credentialId" in payload)) return false
  if (typeof payload.credentialId !== "string") return false

  if (!("rpId" in payload)) return false
  if (typeof payload.rpId !== "string") return false

  return true
}

export const deletePasskey = (passkeyId: string, options: PasslockOptions) =>
  Micro.gen(function* () {
    const { tenancyId } = options
    const logger = yield* Micro.service(Logger)
    const { endpoint } = buildEndpoint(options)

    yield* logger.logInfo("Testing for local passkey removal support")
    const canDelete = yield* isPasskeyDeletionSupport
    if (!canDelete)
      return yield* new DeletionError({
        code: "PASSKEY_DELETION_UNSUPPORTED",
        message: "Passkey deletion not supported on this device",
      })

    yield* logger.logInfo("Fetching passkey credential and rp id")
    const url = new URL(`${tenancyId}/credential/${passkeyId}`, endpoint)
    const response = yield* Micro.promise(() => fetch(url))
    if (response.status === 404)
      return yield* new DeletionError({
        code: "OTHER_ERROR",
        message: "Unable to find the metadata associated with this passkey",
      })

    const credential = yield* Micro.promise(() => response.json())
    if (!isCredentialMapping(credential))
      return yield* new DeletionError({
        code: "OTHER_ERROR",
        message: "Invalid metadata associated with this passkey",
      })

    return yield* signalCredentialRemoval(credential)
  })

/**
 * Tell the client device to remove a given credential
 * @param error
 * @returns
 */
export const signalCredentialRemoval = (
  signal: CredentialMapping
): Micro.Micro<boolean, DeletionError, Logger> =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger)

    yield* logger.logInfo("Testing for local passkey removal support")
    const canDelete = yield* isPasskeyDeletionSupport
    if (!canDelete)
      return yield* new DeletionError({
        code: "PASSKEY_DELETION_UNSUPPORTED",
        message: "Passkey deletion not supported on this device",
      })

    // might not be defined in older browsers
    yield* logger.logInfo("Signalling browser to remove passkey")

    yield* pipe(
      Micro.tryPromise({
        try: () => PublicKeyCredential.signalUnknownCredential(signal),
        catch: (err) =>
          err instanceof Error ? err : new Error("Unable to signal credential removal"),
      }),
      Micro.catchAllDefect((err) =>
        err instanceof Error
          ? logger.logWarn(err.message)
          : logger.logWarn("Unable to signal credential removal")
      ),
      Micro.catchAll((err) => logger.logWarn(err.message)),
      Micro.forkDaemon
    )

    yield* logger.logInfo("Passkey removed")

    return true
  })

export interface CredentialMappings {
  rpId: string
  userId: string
  allAcceptedCredentialIds: string[]
}

const isCredentialMappings = (payload: unknown): payload is CredentialMappings => {
  if (typeof payload !== "object") return false
  if (payload === null) return false

  if (!("rpId" in payload)) return false
  if (typeof payload.rpId !== "string") return false

  if (!("userId" in payload)) return false
  if (typeof payload.userId !== "string") return false

  if (!("allAcceptedCredentialIds" in payload)) return false
  if (Array.isArray(payload.allAcceptedCredentialIds)) return false

  return true
}

export const syncPasskeys = (passkeyIds: Array<string>, options: PasslockOptions) =>
  Micro.gen(function* () {
    const { tenancyId } = options
    const logger = yield* Micro.service(Logger)
    const { endpoint } = buildEndpoint(options)

    yield* logger.logInfo("Testing for local passkey sync support")
    const canSync = yield* isAcceptedCredentialsSupport
    if (!canSync)
      return yield* new SyncError({
        code: "PASSKEY_SYNC_UNSUPPORTED",
        message: "Passkey deletion not supported on this device",
      })

    yield* logger.logInfo("Fetching passkey credentials and rp id")
    const encodedPasskeyIds = encodeUriComponent(passkeyIds.join(","))
    const url = new URL(`${tenancyId}/credentials/${encodedPasskeyIds}`, endpoint)
    const response = yield* Micro.promise(() => fetch(url))
    if (response.status === 404)
      return yield* new SyncError({
        code: "OTHER_ERROR",
        message: "Unable to find the metadata associated with these passkeys",
      })

    const credentials = yield* Micro.promise(() => response.json())
    if (!isCredentialMappings(credentials))
      return yield* new SyncError({
        code: "OTHER_ERROR",
        message: "Invalid metadata associated with one or more passkeys",
      })

    return yield* signalAcceptedCredentials(credentials)
  })

export const signalAcceptedCredentials = (
  signal: CredentialMappings
): Micro.Micro<boolean, SyncError, Logger> =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger)

    yield* logger.logInfo("Testing for accepted credential signalling support")
    const canSync = yield* isAcceptedCredentialsSupport
    if (!canSync)
      return yield* new SyncError({
        code: "PASSKEY_SYNC_UNSUPPORTED",
        message: "Passkey sync not supported on this device",
      })

    yield* logger.logInfo("Signalling browser of accepted credentials")

    yield* pipe(
      Micro.tryPromise({
        try: () => PublicKeyCredential.signalAllAcceptedCredentials(signal),
        catch: (err) =>
          err instanceof Error ? err : new Error("Unable to signal accepted credentials"),
      }),
      Micro.timeout(1000),
      Micro.catchAllDefect((err) =>
        err instanceof Error
          ? logger.logWarn(err.message)
          : logger.logWarn("Unable to signal accepted credentials")
      ),
      Micro.catchAll((err) => logger.logWarn(err.message))
    )

    yield* logger.logInfo("Accepted credentials signalled")

    return true
  })
