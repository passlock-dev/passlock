import { Micro, pipe } from "effect"
import { encodeUriComponent } from "effect/Encoding"
import { makeEndpoint } from "../../internal/index.js"
import { Logger } from "../../logger.js"
import type { PasslockOptions } from "../../options.js"
import {
  DeleteError,
  type OrphanedPasskeyError,
  PruningError,
  UpdateError,
} from "../errors.js"

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
 * Delete a local passkey by Passlock passkey ID.
 *
 * The library uses the tenancy information to look up the credential metadata
 * before signalling the browser.
 *
 * @see {@link deletePasskey}
 * @category Passkeys (core)
 */
export interface DeletePasskeyOptions extends PasslockOptions {
  /**
   * Passlock passkey ID (authenticator ID).
   */
  passkeyId: string
}

/**
 * Delete a local passkey using credential metadata you already have.
 *
 * This shape is typically produced by `@passlock/server`'s
 * `deleteUserPasskeys` helper, so the browser can be signalled without an
 * extra Passlock lookup.
 *
 * @see {@link deletePasskey}
 * @see {@link deleteUserPasskeys}
 * @category Passkeys (core)
 */
export interface DeleteCredentialOptions extends PasslockOptions {
  /**
   * WebAuthn credential ID.
   */
  credentialId: string

  /**
   * Credential user ID.
   */
  userId: string

  /**
   * Relying party ID.
   */
  rpId: string
}

/**
 * Instruct the browser to remove a local passkey, for example from a password
 * manager.
 *
 * If you pass a Passlock `passkeyId`, the library first fetches the associated
 * credential metadata from Passlock. If you pass a credential payload or
 * {@link OrphanedPasskeyError}, it can signal the browser directly.
 *
 * @param options Passkey identifier/credential details and Passlock tenancy options.
 * @returns A Micro effect that resolves with a {@link DeleteSuccess} once the
 * removal signal has been queued, or fails with {@link DeleteError}.
 */
export const deletePasskey = (
  options: DeletePasskeyOptions | DeleteCredentialOptions | OrphanedPasskeyError
) =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger)

    yield* logger.logInfo("Testing for local passkey removal support")
    const canDelete = yield* isPasskeyDeleteSupport
    if (!canDelete)
      return yield* Micro.fail(
        new DeleteError({
          code: "PASSKEY_DELETION_UNSUPPORTED",
          message: "Passkey deletion not supported on this device",
        })
      )

    const credential =
      "rpId" in options ? options : yield* getCredential(options)

    return yield* signalCredentialRemoval(credential)
  })

const getCredential = (options: DeletePasskeyOptions) =>
  Micro.gen(function* () {
    const { tenancyId } = options
    const logger = yield* Micro.service(Logger)
    const { endpoint } = makeEndpoint(options)

    yield* logger.logInfo("Fetching passkey credential and rp id")
    const url = new URL(
      `${tenancyId}/credential/${options.passkeyId}`,
      endpoint
    )
    const response = yield* Micro.promise(() => fetch(url))
    if (response.status === 404)
      return yield* Micro.fail(
        new DeleteError({
          code: "OTHER_ERROR",
          message: "Unable to find the metadata associated with this passkey",
        })
      )

    const credential = yield* Micro.promise(() => response.json())
    if (!isCredential(credential))
      return yield* Micro.fail(
        new DeleteError({
          code: "OTHER_ERROR",
          message: "Invalid metadata associated with this passkey",
        })
      )

    return credential
  })

/**
 * Keep only the listed Passlock passkeys for a user on the current device.
 *
 * The library resolves those passkey IDs to the accepted WebAuthn credential
 * list before signalling the browser.
 *
 * @see {@link prunePasskeys}
 * @category Passkeys (core)
 */
export interface PrunePasskeyOptions extends PasslockOptions {
  /**
   * Passlock passkey IDs that should remain available on this device.
   */
  allowablePasskeyIds: Array<string>
}

/**
 * Indicates the library finished the accepted-credentials signalling flow.
 *
 * @category Passkeys (core)
 */
export type PruningSuccess = {
  _tag: "PruningSuccess"
}

/**
 * Type guard for {@link PruningSuccess}.
 *
 * @category Passkeys (other)
 */
export const isPruningSuccess = (
  payload: unknown
): payload is PruningSuccess => {
  if (typeof payload !== "object") return false
  if (payload === null) return false
  if (!("_tag" in payload)) return false
  if (typeof payload._tag !== "string") return false
  return payload._tag === "PruningSuccess"
}

/**
 * Given a list of passkey IDs to keep, instruct the device to remove any
 * redundant passkeys for the same account on the same relying party.
 *
 * Note: this will only remove redundant passkeys (based on the userId).
 *
 * For example:
 *
 * The user has two passkeys registered against the jdoe@gmail.com account: passkey1
 * and passkey2. The user has another passkey (passkey3) registered against the
 * jdoe@work.com account.
 *
 * If you pass in the id for passkey1, the device will recognise it's assigned to the
 * jdoe@gmail.com account and remove passkey2. However as passkey3 is registered to a
 * different account, the device will retain it.
 *
 * @param options Passlock tenancy/endpoint options and the passkey IDs to keep.
 * @returns A Micro effect that resolves with a {@link PruningSuccess} once the
 * accepted-credentials signal has been sent, or fails with
 * {@link PruningError}.
 */
export const prunePasskeys = (options: PrunePasskeyOptions) =>
  Micro.gen(function* () {
    const { tenancyId } = options
    const logger = yield* Micro.service(Logger)
    const { endpoint } = makeEndpoint(options)

    yield* logger.logInfo("Testing for local passkey pruning support")
    const canSync = yield* isPasskeyPruningSupport
    if (!canSync)
      return yield* Micro.fail(
        new PruningError({
          code: "PASSKEY_PRUNING_UNSUPPORTED",
          message: "Passkey deletion not supported on this device",
        })
      )

    yield* logger.logInfo("Fetching passkey credentials and rp id")
    const encodedPasskeyIds = encodeUriComponent(
      options.allowablePasskeyIds.join(",")
    )
    const url = new URL(
      `${tenancyId}/credentials/${encodedPasskeyIds}`,
      endpoint
    )
    const response = yield* Micro.promise(() => fetch(url))
    if (response.status === 404)
      return yield* Micro.fail(
        new PruningError({
          code: "OTHER_ERROR",
          message: "Unable to find the metadata associated with these passkeys",
        })
      )

    const credentials = yield* Micro.promise(() => response.json())
    if (!isUserCredentials(credentials))
      return yield* Micro.fail(
        new PruningError({
          code: "OTHER_ERROR",
          message: "Invalid metadata associated with one or more passkeys",
        })
      )

    return yield* signalAcceptedCredentials(credentials)
  })

/**
 * Used when you want to update a local device passkey by Passkey ID aka authenticatorId.
 *
 * @see {@link updatePasskey}
 *
 * @category Passkeys (core)
 */
export interface UpdatePasskeyOptions extends PasslockOptions {
  /**
   * The Passlock passkey ID (authenticator ID).
   */
  passkeyId: string

  /**
   * New username shown alongside the passkey.
   */
  username: string

  /**
   * New display name shown alongside the passkey.
   */
  displayName?: string | undefined
}

/**
 * Used when you want to update one or more passkeys by the credential user ID,
 * that is the immutable Base64Url-encoded binary ID.
 *
 * This shape is usually returned by `@passlock/server`'s
 * `updatePasskeyUsernames` helper and does not include tenancy or endpoint
 * configuration.
 *
 * @see {@link updatePasskey}
 * @see {@link https://passlock.dev/rest-api/credential/ The Credential property (main docs site)}
 *
 * @category Passkeys (core)
 */
export interface UpdateCredentialOptions {
  /**
   * Credential user ID.
   */
  userId: string

  /**
   * Relying party identifier for the passkey.
   */
  rpId: string

  /**
   * New username shown alongside the passkey.
   */
  username: string

  /**
   * New display name shown alongside the passkey.
   */
  displayName?: string | undefined
}

/**
 * Indicates the library finished the local passkey update signalling flow.
 *
 * @category Passkeys (core)
 */
export type UpdateSuccess = {
  _tag: "UpdateSuccess"
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
 * Update the username and/or display name for multiple local passkeys.
 *
 * Note: this is purely informational. It does not change any passkey
 * identifiers.
 *
 * The typical use case is when a user changes their account email. You would
 * update the username in your backend system, then pass the returned
 * credential list into this function so the same account label is shown in the
 * user's password manager.
 *
 * @param options Credential identifiers plus the updated username/display name,
 * typically taken from `@passlock/server`'s `updatePasskeyUsernames`
 * response.
 * @returns A Micro effect that resolves with a {@link UpdateSuccess} once the
 * browser has been asked to refresh those details, or fails with
 * {@link UpdateError}.
 */
export const updatePasskeyUsernames = (
  options: ReadonlyArray<UpdateCredentialOptions>
) =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger)

    yield* logger.logInfo("Testing for local passkey update support")
    const canUpdate = yield* isPasskeyUpdateSupport
    if (!canUpdate)
      return yield* Micro.fail(
        new UpdateError({
          code: "PASSKEY_UPDATE_UNSUPPORTED",
          message: "Passkey update not supported on this device",
        })
      )

    yield* Micro.forEach(options, (credential) =>
      signalCurrentUserDetails(credential, credential)
    )

    return {
      _tag: "UpdateSuccess",
    } as const
  })

/**
 * Delete multiple local passkeys using credentials previously returned from
 * your backend.
 *
 * The typical flow is to delete the server-side passkeys first, then pass the
 * returned `deleted` array into this function so the user’s password manager is
 * updated too.
 *
 * @param options Credentials derived from deleted server-side passkeys.
 * @returns A Micro effect that resolves with a {@link DeleteSuccess} once the
 * removal signals have been queued, or fails with {@link DeleteError}.
 */
export const deleteUserPasskeys = (
  options: ReadonlyArray<Credential>
) =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger)

    yield* logger.logInfo("Testing for local passkey removal support")
    const canDelete = yield* isPasskeyDeleteSupport
    if (!canDelete)
      return yield* Micro.fail(
        new DeleteError({
          code: "PASSKEY_DELETION_UNSUPPORTED",
          message: "Passkey deletion not supported on this device",
        })
      )

    yield* Micro.forEach(options, signalCredentialRemoval)

    return {
      _tag: "DeleteSuccess",
    } as const
  })

/**
 * Update a passkey e.g. change the username and/or display name.
 * Note: this is purely informational, it does not change any identifiers.
 * The typical use case is when a user changes their account email, you would
 * want to change the username in your backend system and also the user's
 * device local passkey. Otherwise the passkey associated with your new-name@gmail.com
 * account would still show up in their password manager as old-name@gmail.com.
 *
 * @param options Passkey update options.
 * @returns A Micro effect that resolves with a {@link UpdateSuccess} once the
 * browser has been asked to refresh the local details, or fails with
 * {@link UpdateError}.
 */
export const updatePasskey = (
  options: UpdatePasskeyOptions | UpdateCredentialOptions
) =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger)

    yield* logger.logInfo("Testing for local passkey update support")
    const canUpdate = yield* isPasskeyUpdateSupport
    if (!canUpdate)
      return yield* Micro.fail(
        new UpdateError({
          code: "PASSKEY_UPDATE_UNSUPPORTED",
          message: "Passkey update not supported on this device",
        })
      )

    const credential =
      "rpId" in options ? options : yield* getUserCredential(options)

    return yield* signalCurrentUserDetails(credential, options)
  })

const getUserCredential = (options: UpdatePasskeyOptions) =>
  Micro.gen(function* () {
    const { tenancyId } = options
    const logger = yield* Micro.service(Logger)
    const { endpoint } = makeEndpoint(options)

    yield* logger.logInfo("Fetching passkey credential and rp id")
    const url = new URL(
      `${tenancyId}/credential/${options.passkeyId}`,
      endpoint
    )
    const response = yield* Micro.promise(() => fetch(url))
    if (response.status === 404)
      return yield* Micro.fail(
        new UpdateError({
          code: "OTHER_ERROR",
          message: "Unable to find the metadata associated with this passkey",
        })
      )

    const credential = yield* Micro.promise(() => response.json())
    if (!isCredential(credential))
      return yield* Micro.fail(
        new UpdateError({
          code: "OTHER_ERROR",
          message: "Invalid metadata associated with this passkey",
        })
      )

    return credential
  })

/**
 * Credential metadata required to target a local passkey on the device.
 *
 * @category Passkeys (core)
 */
export type Credential = {
  /**
   * WebAuthn credential ID.
   */
  credentialId: string

  /**
   * Credential user ID.
   */
  userId: string

  /**
   * Relying party ID.
   */
  rpId: string
}

const isCredential = (
  payload: unknown
): payload is Credential => {
  if (typeof payload !== "object") return false
  if (payload === null) return false

  if (!("credentialId" in payload)) return false
  if (typeof payload.credentialId !== "string") return false

  if (!("userId" in payload)) return false
  if (typeof payload.userId !== "string") return false

  if (!("rpId" in payload)) return false
  if (typeof payload.rpId !== "string") return false

  return true
}

/**
 * Accepted credential list for a single user on a relying party.
 */
export type UserCredentials = {
  rpId: string
  userId: string
  allAcceptedCredentialIds: string[]
}

const isUserCredentials = (
  payload: unknown
): payload is UserCredentials => {
  if (typeof payload !== "object") return false
  if (payload === null) return false

  if (!("rpId" in payload)) return false
  if (typeof payload.rpId !== "string") return false

  if (!("userId" in payload)) return false
  if (typeof payload.userId !== "string") return false

  if (!("allAcceptedCredentialIds" in payload)) return false
  if (!Array.isArray(payload.allAcceptedCredentialIds)) return false

  return true
}

type IPasskeyNotFound = {
  message: string
  credentialId: string
  rpId: string
}

export type DeleteSuccess = {
  _tag: "DeleteSuccess"
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
 * Queue a browser removal signal for a credential.
 *
 * @param credential Credential or missing-passkey payload.
 * @returns A Micro effect that resolves with a {@link DeleteSuccess} once the
 * removal signal has been queued, or fails with {@link DeleteError}.
 */
export const signalCredentialRemoval = (
  credential: Credential | IPasskeyNotFound
): Micro.Micro<DeleteSuccess, DeleteError, Logger> =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger)

    yield* logger.logInfo("Testing for local passkey removal support")
    const canDelete = yield* isPasskeyDeleteSupport
    if (!canDelete)
      return yield* Micro.fail(
        new DeleteError({
          code: "PASSKEY_DELETION_UNSUPPORTED",
          message: "Passkey deletion not supported on this device",
        })
      )

    // might not be defined in older browsers
    yield* logger.logInfo("Signalling browser to remove passkey")

    yield* pipe(
      Micro.tryPromise({
        try: () => PublicKeyCredential.signalUnknownCredential(credential),
        catch: (err) =>
          err instanceof Error
            ? err
            : new Error("Unable to signal credential removal"),
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

    return { _tag: "DeleteSuccess" } as const
  })

/**
 * Tell the browser which credentials are still accepted for a user.
 *
 * @param credentials Accepted credentials for the user.
 * @returns A Micro effect that resolves with a {@link PruningSuccess} once the
 * accepted-credentials signal has been sent, or fails with
 * {@link PruningError}.
 */
export const signalAcceptedCredentials = (
  credentials: UserCredentials
): Micro.Micro<PruningSuccess, PruningError, Logger> =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger)

    yield* logger.logInfo("Testing for accepted credential signalling support")
    const canSync = yield* isPasskeyPruningSupport
    if (!canSync)
      return yield* Micro.fail(
        new PruningError({
          code: "PASSKEY_PRUNING_UNSUPPORTED",
          message: "Passkey pruning not supported on this device",
        })
      )

    yield* logger.logInfo("Signalling browser of accepted credentials")

    yield* pipe(
      Micro.tryPromise({
        try: () =>
          PublicKeyCredential.signalAllAcceptedCredentials(credentials),
        catch: (err) =>
          err instanceof Error
            ? err
            : new Error("Unable to signal accepted credentials"),
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

    return { _tag: "PruningSuccess" } as const
  })

/**
 * Credential identity needed to update the user-visible details for a local
 * passkey.
 */
export type CredentialUserId = {
  userId: string
  rpId: string
}

/**
 * Tell the browser to refresh the username and display name shown for a local
 * passkey.
 *
 * @param credential Credential identity used to find the passkey.
 * @param updates Updated username/display-name values.
 * @returns A Micro effect that resolves with an {@link UpdateSuccess} once the
 * signal has been sent, or fails with {@link UpdateError}.
 */
export const signalCurrentUserDetails = (
  credential: CredentialUserId,
  updates: Pick<UpdatePasskeyOptions, "username" | "displayName">
) =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger)

    yield* logger.logInfo("Testing for local passkey update support")
    const canUpdate = yield* isPasskeyUpdateSupport
    if (!canUpdate)
      return yield* Micro.fail(
        new UpdateError({
          code: "PASSKEY_UPDATE_UNSUPPORTED",
          message: "Passkey update not supported on this device",
        })
      )

    yield* logger.logInfo("Signalling browser to update passkey")

    const { username: name, displayName = updates.username } = updates
    const credentialUpdates = { ...credential, name, displayName }

    yield* pipe(
      Micro.tryPromise({
        try: () =>
          PublicKeyCredential.signalCurrentUserDetails(credentialUpdates),
        catch: (err) =>
          err instanceof Error
            ? err
            : new Error("Unable to signal credential update"),
      }),
      Micro.catchAllDefect((err) =>
        err instanceof Error
          ? logger.logWarn(err.message)
          : logger.logWarn("Unable to signal credential update")
      ),
      Micro.catchAll((err) => logger.logWarn(err.message)),
      Micro.forkDaemon
    )

    yield* logger.logInfo("Passkey updated")

    return { _tag: "UpdateSuccess" } as const
  })
