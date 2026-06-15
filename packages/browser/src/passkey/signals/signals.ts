import { Micro, pipe } from "effect"
import { makeEndpoint, makeRequest } from "../../internal/index.js"
import { NetworkError } from "../../internal/network.js"
import { Logger } from "../../logger.js"
import type { PasslockOptions } from "../../options.js"
import { DeleteError, PruningError, UpdateError } from "../errors.js"

/**
 * Detect support for browser-driven local passkey removal via
 * `PublicKeyCredential.signalUnknownCredential`.
 */
export const isPasskeyDeleteSupport = Micro.sync(() => {
  return (
    PublicKeyCredential?.signalUnknownCredential &&
    typeof PublicKeyCredential.signalUnknownCredential === "function"
  )
})

/**
 * Detect support for browser-driven passkey pruning via
 * `PublicKeyCredential.signalAllAcceptedCredentials`.
 */
export const isPasskeyPruningSupport = Micro.sync(() => {
  return (
    PublicKeyCredential?.signalAllAcceptedCredentials &&
    typeof PublicKeyCredential.signalAllAcceptedCredentials === "function"
  )
})

/**
 * Detect support for browser-driven passkey user-detail updates via
 * `PublicKeyCredential.signalCurrentUserDetails`.
 */
export const isPasskeyUpdateSupport = Micro.sync(() => {
  return (
    PublicKeyCredential?.signalCurrentUserDetails &&
    typeof PublicKeyCredential.signalCurrentUserDetails === "function"
  )
})

/**
 * Non-fatal warning codes returned by passkey management helpers.
 *
 * Server-side warnings from the prepared token exchange and browser-side
 * signalling warnings are both returned on the success payload.
 *
 * @category Passkeys (core)
 */
export type PasskeyManagementWarningCode =
  | "PASSKEY_NOT_FOUND"
  | "NO_PASSKEYS_FOUND"
  | "BROWSER_SIGNAL_UNSUPPORTED"
  | "BROWSER_SIGNAL_FAILED"
  | "EMPTY_SIGNAL_PAYLOAD"

/**
 * Non-fatal warning returned by passkey management helpers.
 *
 * Warnings describe partial, no-op, unsupported, or best-effort signalling
 * outcomes that did not prevent the helper from completing.
 *
 * @category Passkeys (core)
 */
export type PasskeyManagementWarning = {
  readonly code: PasskeyManagementWarningCode
  readonly message: string
  readonly passkeyId?: string | undefined
}

const isPasskeyManagementWarningCode = (
  payload: unknown
): payload is PasskeyManagementWarningCode => {
  return (
    payload === "PASSKEY_NOT_FOUND" ||
    payload === "NO_PASSKEYS_FOUND" ||
    payload === "BROWSER_SIGNAL_UNSUPPORTED" ||
    payload === "BROWSER_SIGNAL_FAILED" ||
    payload === "EMPTY_SIGNAL_PAYLOAD"
  )
}

const isPasskeyManagementWarning = (payload: unknown): payload is PasskeyManagementWarning => {
  if (typeof payload !== "object") return false
  if (payload === null) return false

  if (!("code" in payload)) return false
  if (!isPasskeyManagementWarningCode(payload.code)) return false

  if (!("message" in payload)) return false
  if (typeof payload.message !== "string") return false

  if ("passkeyId" in payload && payload.passkeyId !== undefined) {
    if (typeof payload.passkeyId !== "string") return false
  }

  return true
}

const isWarnings = (payload: unknown): payload is ReadonlyArray<PasskeyManagementWarning> => {
  return Array.isArray(payload) && payload.every(isPasskeyManagementWarning)
}

const unsupportedWarning = (message: string): PasskeyManagementWarning => ({
  code: "BROWSER_SIGNAL_UNSUPPORTED",
  message,
})

const emptyWarning = (message: string): PasskeyManagementWarning => ({
  code: "EMPTY_SIGNAL_PAYLOAD",
  message,
})

const failedWarning = (message: string): PasskeyManagementWarning => ({
  code: "BROWSER_SIGNAL_FAILED",
  message,
})

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback

const requestErrorMessage = (error: unknown, fallback: string) =>
  error instanceof NetworkError ? error.message : errorMessage(error, fallback)

const toUpdateError = (error: unknown) =>
  new UpdateError({
    code: "OTHER_ERROR",
    message: requestErrorMessage(error, "Unable to exchange passkey update token"),
  })

const toDeleteError = (error: unknown) =>
  new DeleteError({
    code: "OTHER_ERROR",
    message: requestErrorMessage(error, "Unable to exchange passkey deletion token"),
  })

const toPruningError = (error: unknown) =>
  new PruningError({
    code: "OTHER_ERROR",
    message: requestErrorMessage(error, "Unable to exchange passkey pruning token"),
  })

/**
 * Browser options for passkey user-detail update signalling.
 *
 * @category Passkeys (core)
 */
export interface UpdatePasskeysOptions {
  /**
   * Prepared update token returned by `@passlock/server`'s `updatePasskeys`.
   *
   * The browser helper accepts only this token; update policy and signal
   * payloads are prepared by your backend.
   */
  updatePasskeysToken: string
}

/**
 * Browser options for passkey deletion signalling.
 *
 * @category Passkeys (core)
 */
export interface DeletePasskeysOptions {
  /**
   * Prepared deletion token returned by `@passlock/server`'s `deletePasskeys`.
   *
   * The browser helper accepts only this token; passkey selection and deletion
   * metadata are prepared by your backend.
   */
  deletePasskeysToken: string
}

/**
 * Browser options for accepted-credentials pruning signalling.
 *
 * @category Passkeys (core)
 */
export interface PrunePasskeysOptions {
  /**
   * Prepared pruning token returned by `@passlock/server`'s `prunePasskeys`.
   *
   * The browser helper accepts only this token; accepted credential IDs are
   * prepared by your backend.
   */
  prunePasskeysToken: string
}

/**
 * Indicates the library finished the local passkey update signalling flow.
 *
 * This does not guarantee the browser or password manager updated local
 * passkey user details.
 *
 * @category Passkeys (core)
 */
export type UpdateSuccess = {
  readonly _tag: "UpdateSuccess"
  readonly warnings: ReadonlyArray<PasskeyManagementWarning>
}

/**
 * Type guard for {@link UpdateSuccess}.
 *
 * @category Passkeys (other)
 */
export const isUpdateSuccess = (payload: unknown): payload is UpdateSuccess => {
  if (typeof payload !== "object") return false
  if (payload === null) return false
  if (!("_tag" in payload)) return false
  if (typeof payload._tag !== "string") return false
  return payload._tag === "UpdateSuccess"
}

/**
 * Indicates the library finished the local passkey removal signalling flow.
 *
 * This does not guarantee the browser or password manager removed local
 * passkeys.
 *
 * @category Passkeys (core)
 */
export type DeleteSuccess = {
  readonly _tag: "DeleteSuccess"
  readonly warnings: ReadonlyArray<PasskeyManagementWarning>
}

/**
 * Type guard for {@link DeleteSuccess}.
 *
 * @category Passkeys (other)
 */
export const isDeleteSuccess = (payload: unknown): payload is DeleteSuccess => {
  if (typeof payload !== "object") return false
  if (payload === null) return false
  if (!("_tag" in payload)) return false
  if (typeof payload._tag !== "string") return false
  return payload._tag === "DeleteSuccess"
}

/**
 * Indicates the library finished the accepted-credentials signalling flow.
 *
 * This does not guarantee the browser or password manager removed local
 * passkeys.
 *
 * @category Passkeys (core)
 */
export type PruningSuccess = {
  readonly _tag: "PruningSuccess"
  readonly warnings: ReadonlyArray<PasskeyManagementWarning>
}

/**
 * Type guard for {@link PruningSuccess}.
 *
 * @category Passkeys (other)
 */
export const isPruningSuccess = (payload: unknown): payload is PruningSuccess => {
  if (typeof payload !== "object") return false
  if (payload === null) return false
  if (!("_tag" in payload)) return false
  if (typeof payload._tag !== "string") return false
  return payload._tag === "PruningSuccess"
}

/**
 * Instruction returned by passkey update token exchange.
 *
 * Applications normally receive this only indirectly: pass the prepared token
 * to {@link updatePasskeys} and let the helper exchange it.
 */
export type PasskeyUpdateInstruction = {
  readonly rpId: string
  readonly userId: string
  readonly username: string
  readonly displayName: string
}

const isPasskeyUpdateInstruction = (payload: unknown): payload is PasskeyUpdateInstruction => {
  if (typeof payload !== "object") return false
  if (payload === null) return false

  if (!("rpId" in payload)) return false
  if (typeof payload.rpId !== "string") return false

  if (!("userId" in payload)) return false
  if (typeof payload.userId !== "string") return false

  if (!("username" in payload)) return false
  if (typeof payload.username !== "string") return false

  if (!("displayName" in payload)) return false
  if (typeof payload.displayName !== "string") return false

  return true
}

/**
 * Instruction returned by passkey deletion token exchange.
 *
 * Applications normally receive this only indirectly: pass the prepared token
 * to {@link deletePasskeys} and let the helper exchange it.
 */
export type PasskeyDeletionInstruction = {
  readonly rpId: string
  readonly userId: string
  readonly credentialId: string
}

const isPasskeyDeletionInstruction = (payload: unknown): payload is PasskeyDeletionInstruction => {
  if (typeof payload !== "object") return false
  if (payload === null) return false

  if (!("rpId" in payload)) return false
  if (typeof payload.rpId !== "string") return false

  if (!("userId" in payload)) return false
  if (typeof payload.userId !== "string") return false

  if (!("credentialId" in payload)) return false
  if (typeof payload.credentialId !== "string") return false

  return true
}

/**
 * Instruction returned by passkey pruning token exchange.
 *
 * Applications normally receive this only indirectly: pass the prepared token
 * to {@link prunePasskeys} and let the helper exchange it.
 */
export type PasskeyPruningInstruction = {
  readonly rpId: string
  readonly userId: string
  readonly allAcceptedCredentialIds: ReadonlyArray<string>
}

const isPasskeyPruningInstruction = (payload: unknown): payload is PasskeyPruningInstruction => {
  if (typeof payload !== "object") return false
  if (payload === null) return false

  if (!("rpId" in payload)) return false
  if (typeof payload.rpId !== "string") return false

  if (!("userId" in payload)) return false
  if (typeof payload.userId !== "string") return false

  if (!("allAcceptedCredentialIds" in payload)) return false
  if (!Array.isArray(payload.allAcceptedCredentialIds)) return false
  if (!payload.allAcceptedCredentialIds.every((item) => typeof item === "string")) return false

  return true
}

type PasskeyUpdateInstructions = {
  readonly _tag: "PasskeyUpdateInstructions"
  readonly instructions: ReadonlyArray<PasskeyUpdateInstruction>
  readonly warnings: ReadonlyArray<PasskeyManagementWarning>
}

const isPasskeyUpdateInstructions = (payload: unknown): payload is PasskeyUpdateInstructions => {
  if (typeof payload !== "object") return false
  if (payload === null) return false

  if (!("_tag" in payload)) return false
  if (payload._tag !== "PasskeyUpdateInstructions") return false

  if (!("instructions" in payload)) return false
  if (!Array.isArray(payload.instructions)) return false
  if (!payload.instructions.every(isPasskeyUpdateInstruction)) return false

  if (!("warnings" in payload)) return false
  if (!isWarnings(payload.warnings)) return false

  return true
}

type PasskeyDeletionInstructions = {
  readonly _tag: "PasskeyDeletionInstructions"
  readonly instructions: ReadonlyArray<PasskeyDeletionInstruction>
  readonly warnings: ReadonlyArray<PasskeyManagementWarning>
}

const isPasskeyDeletionInstructions = (
  payload: unknown
): payload is PasskeyDeletionInstructions => {
  if (typeof payload !== "object") return false
  if (payload === null) return false

  if (!("_tag" in payload)) return false
  if (payload._tag !== "PasskeyDeletionInstructions") return false

  if (!("instructions" in payload)) return false
  if (!Array.isArray(payload.instructions)) return false
  if (!payload.instructions.every(isPasskeyDeletionInstruction)) return false

  if (!("warnings" in payload)) return false
  if (!isWarnings(payload.warnings)) return false

  return true
}

type PasskeyPruningInstructions = {
  readonly _tag: "PasskeyPruningInstructions"
  readonly instructions: ReadonlyArray<PasskeyPruningInstruction>
  readonly warnings: ReadonlyArray<PasskeyManagementWarning>
}

const isPasskeyPruningInstructions = (payload: unknown): payload is PasskeyPruningInstructions => {
  if (typeof payload !== "object") return false
  if (payload === null) return false

  if (!("_tag" in payload)) return false
  if (payload._tag !== "PasskeyPruningInstructions") return false

  if (!("instructions" in payload)) return false
  if (!Array.isArray(payload.instructions)) return false
  if (!payload.instructions.every(isPasskeyPruningInstruction)) return false

  if (!("warnings" in payload)) return false
  if (!isWarnings(payload.warnings)) return false

  return true
}

const exchangeUpdateToken = (options: UpdatePasskeysOptions, config: PasslockOptions) =>
  Micro.gen(function* () {
    const { tenancyId } = config
    const { endpoint } = makeEndpoint(config)
    const url = new URL(`v2/${tenancyId}/passkeys/update/exchange`, endpoint)

    return yield* makeRequest({
      label: "passkey update instructions",
      payload: { updatePasskeysToken: options.updatePasskeysToken },
      responsePredicate: isPasskeyUpdateInstructions,
      url,
    })
  })

const exchangeDeleteToken = (options: DeletePasskeysOptions, config: PasslockOptions) =>
  Micro.gen(function* () {
    const { tenancyId } = config
    const { endpoint } = makeEndpoint(config)
    const url = new URL(`v2/${tenancyId}/passkeys/delete/exchange`, endpoint)

    return yield* makeRequest({
      label: "passkey deletion instructions",
      payload: { deletePasskeysToken: options.deletePasskeysToken },
      responsePredicate: isPasskeyDeletionInstructions,
      url,
    })
  })

const exchangePruneToken = (options: PrunePasskeysOptions, config: PasslockOptions) =>
  Micro.gen(function* () {
    const { tenancyId } = config
    const { endpoint } = makeEndpoint(config)
    const url = new URL(`v2/${tenancyId}/passkeys/prune/exchange`, endpoint)

    return yield* makeRequest({
      label: "passkey pruning instructions",
      payload: { prunePasskeysToken: options.prunePasskeysToken },
      responsePredicate: isPasskeyPruningInstructions,
      url,
    })
  })

const signalUpdateInstruction = (instruction: PasskeyUpdateInstruction) =>
  Micro.gen(function* () {
    const details = {
      displayName: instruction.displayName,
      name: instruction.username,
      rpId: instruction.rpId,
      userId: instruction.userId,
    }

    return yield* Micro.tryPromise({
      try: () => PublicKeyCredential.signalCurrentUserDetails(details),
      catch: (err) =>
        err instanceof Error ? err : new Error("Unable to signal credential update"),
    })
  })

const signalDeleteInstruction = (instruction: PasskeyDeletionInstruction) =>
  Micro.gen(function* () {
    return yield* Micro.tryPromise({
      try: () => PublicKeyCredential.signalUnknownCredential(instruction),
      catch: (err) =>
        err instanceof Error ? err : new Error("Unable to signal credential removal"),
    })
  })

const signalPruningInstruction = (instruction: PasskeyPruningInstruction) =>
  Micro.gen(function* () {
    const details = {
      ...instruction,
      allAcceptedCredentialIds: [...instruction.allAcceptedCredentialIds],
    }

    return yield* Micro.tryPromise({
      try: () => PublicKeyCredential.signalAllAcceptedCredentials(details),
      catch: (err) =>
        err instanceof Error ? err : new Error("Unable to signal accepted credentials"),
    })
  })

const collectSignalWarnings = <A>(
  instructions: ReadonlyArray<A>,
  signal: (instruction: A) => Micro.Micro<void, Error>,
  fallback: string
) =>
  Micro.gen(function* () {
    const warnings: PasskeyManagementWarning[] = []
    const logger = yield* Micro.service(Logger)

    for (const instruction of instructions) {
      const result = yield* pipe(
        signal(instruction),
        Micro.as(undefined),
        Micro.catchAll((error) => {
          const message = errorMessage(error, fallback)
          warnings.push(failedWarning(message))
          return logger.logWarn(message)
        }),
        Micro.catchAllDefect((error) => {
          const message = errorMessage(error, fallback)
          warnings.push(failedWarning(message))
          return logger.logWarn(message)
        })
      )

      void result
    }

    return warnings
  })

/**
 * Exchange a prepared update token and signal passkey user-detail updates.
 *
 * The helper checks for `PublicKeyCredential.signalCurrentUserDetails` support
 * before exchanging the token when it can. Unsupported signalling is returned
 * as a warning on the success payload.
 *
 * @param options Prepared update token returned by your backend.
 * @param config Passlock tenancy and API endpoint options.
 * @returns A Micro effect that resolves with an {@link UpdateSuccess}.
 *
 * @category Passkeys (core)
 */
export const updatePasskeys = (
  options: UpdatePasskeysOptions,
  config: PasslockOptions
): Micro.Micro<UpdateSuccess, UpdateError, Logger> =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger)

    yield* logger.logInfo("Testing for local passkey update support")
    const canUpdate = yield* isPasskeyUpdateSupport
    if (!canUpdate) {
      return {
        _tag: "UpdateSuccess",
        warnings: [unsupportedWarning("Passkey update not supported on this device")],
      } as const
    }

    yield* logger.logInfo("Exchanging passkey update token")
    const exchange = yield* pipe(
      exchangeUpdateToken(options, config),
      Micro.mapError((error) => toUpdateError(error))
    )

    const warnings = [...exchange.warnings]
    if (exchange.instructions.length === 0) {
      warnings.push(emptyWarning("No passkey update instructions were returned"))
    }

    const signalWarnings = yield* collectSignalWarnings(
      exchange.instructions,
      signalUpdateInstruction,
      "Unable to signal credential update"
    )

    return {
      _tag: "UpdateSuccess",
      warnings: [...warnings, ...signalWarnings],
    } as const
  })

/**
 * Exchange a prepared deletion token and signal passkey removals.
 *
 * The helper checks for `PublicKeyCredential.signalUnknownCredential` support
 * before exchanging the token when it can. Unsupported signalling is returned
 * as a warning on the success payload.
 *
 * @param options Prepared deletion token returned by your backend.
 * @param config Passlock tenancy and API endpoint options.
 * @returns A Micro effect that resolves with a {@link DeleteSuccess}.
 *
 * @category Passkeys (core)
 */
export const deletePasskeys = (
  options: DeletePasskeysOptions,
  config: PasslockOptions
): Micro.Micro<DeleteSuccess, DeleteError, Logger> =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger)

    yield* logger.logInfo("Testing for local passkey removal support")
    const canDelete = yield* isPasskeyDeleteSupport
    if (!canDelete) {
      return {
        _tag: "DeleteSuccess",
        warnings: [unsupportedWarning("Passkey deletion not supported on this device")],
      } as const
    }

    yield* logger.logInfo("Exchanging passkey deletion token")
    const exchange = yield* pipe(
      exchangeDeleteToken(options, config),
      Micro.mapError((error) => toDeleteError(error))
    )

    const warnings = [...exchange.warnings]
    if (exchange.instructions.length === 0) {
      warnings.push(emptyWarning("No passkey deletion instructions were returned"))
    }

    const signalWarnings = yield* collectSignalWarnings(
      exchange.instructions,
      signalDeleteInstruction,
      "Unable to signal credential removal"
    )

    return {
      _tag: "DeleteSuccess",
      warnings: [...warnings, ...signalWarnings],
    } as const
  })

/**
 * Exchange a prepared pruning token and signal currently accepted credentials.
 *
 * The helper checks for `PublicKeyCredential.signalAllAcceptedCredentials`
 * support before exchanging the token when it can. Unsupported signalling is
 * returned as a warning on the success payload.
 *
 * @param options Prepared pruning token returned by your backend.
 * @param config Passlock tenancy and API endpoint options.
 * @returns A Micro effect that resolves with a {@link PruningSuccess}.
 *
 * @category Passkeys (core)
 */
export const prunePasskeys = (
  options: PrunePasskeysOptions,
  config: PasslockOptions
): Micro.Micro<PruningSuccess, PruningError, Logger> =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger)

    yield* logger.logInfo("Testing for local passkey pruning support")
    const canPrune = yield* isPasskeyPruningSupport
    if (!canPrune) {
      return {
        _tag: "PruningSuccess",
        warnings: [unsupportedWarning("Passkey pruning not supported on this device")],
      } as const
    }

    yield* logger.logInfo("Exchanging passkey pruning token")
    const exchange = yield* pipe(
      exchangePruneToken(options, config),
      Micro.mapError((error) => toPruningError(error))
    )

    const warnings = [...exchange.warnings]
    if (exchange.instructions.length === 0) {
      warnings.push(emptyWarning("No passkey pruning instructions were returned"))
    }

    const signalWarnings = yield* collectSignalWarnings(
      exchange.instructions,
      signalPruningInstruction,
      "Unable to signal accepted credentials"
    )

    return {
      _tag: "PruningSuccess",
      warnings: [...warnings, ...signalWarnings],
    } as const
  })
