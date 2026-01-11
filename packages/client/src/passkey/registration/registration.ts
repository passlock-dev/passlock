import type { PasslockOptions } from "../../shared/options"
import type { UserVerification } from "../types"
import * as Helper from "@simplewebauthn/browser"
import {
  type PublicKeyCredentialCreationOptionsJSON,
  type RegistrationResponseJSON,
  WebAuthnError,
} from "@simplewebauthn/browser"
import { Context, Micro, pipe } from "effect"
import { Logger } from "../../logger"
import { buildEndpoint, Endpoint, makeRequest, type UnexpectedError } from "../../shared/network"
import { TenancyId } from "../../shared/tenancy"
import { OtherPasskeyError, PasskeysUnsupportedError } from "../errors"

interface OptionsResponse {
  sessionToken: string
  optionsJSON: PublicKeyCredentialCreationOptionsJSON
}

export class RegistrationHelper extends Context.Tag("RegistrationHelper")<
  RegistrationHelper,
  {
    browserSupportsWebAuthn: typeof Helper.browserSupportsWebAuthn
    startRegistration: typeof Helper.startRegistration
  }
>() {
  static Default = {
    browserSupportsWebAuthn: Helper.browserSupportsWebAuthn,
    startRegistration: Helper.startRegistration,
  } satisfies typeof RegistrationHelper.Service
}

export const isDuplicatePasskey = (err: unknown): err is DuplicatePasskeyError =>
  err instanceof DuplicatePasskeyError

/**
 * Raised if excludeCredentials or userId was provided and the
 * device recognises one of the passkey ids i.e. the user currently
 * has a passkey registered on the current device for a given userId.
 */
export class DuplicatePasskeyError extends Micro.TaggedError("@error/DuplicatePasskey")<{
  readonly message: string
}> {
  static isDuplicatePasskey = isDuplicatePasskey
}

const isOptionsResponse = (payload: unknown): payload is OptionsResponse => {
  if (typeof payload !== "object") return false
  if (payload === null) return false

  if (!("optionsJSON" in payload)) return false
  if (typeof payload.optionsJSON !== "object") return false
  if (payload.optionsJSON === null) return false

  if (!("sessionToken" in payload)) return false
  if (typeof payload.sessionToken !== "string") return false

  return true
}

export const registrationEvent = ["optionsRequest", "createCredential", "saveCredential"] as const

export type RegistrationEvent = (typeof registrationEvent)[number]

export type OnEventFn = (event: RegistrationEvent) => void

/**
 * Passkey registration options
 */
export interface RegistrationOptions extends PasslockOptions {
  /**
   * The username associated with the newly reguistered passkey..
   *
   * @see {@link https://passlock.dev/getting-started/passkey-registration/#passkey-username|username}
   */
  username: string
  /**
   * Human palateable username
   */
  userDisplayName?: string | undefined
  /**
   * Passlock userId. Essentially a shortcut to look up any
   * currently registered passkeys (excludeCredentials) for a given user.
   */
  userId?: string | undefined
  /**
   * Prevents the user registering a passkey if they already have one
   * (for the same user account) registered on the current device.
   *
   * @see {@link https://passlock.dev/passkeys/registration/#excludecredentials|excludeCredentials}
   */
  excludeCredentials?: Array<string> | undefined
  /**
   * Whether the device should re-authenticate the user locally before registering the passkey.
   *
   * @see {@link https://passlock.dev/passkeys/user-verification/|userVerification}
   */
  userVerification?: UserVerification | undefined
  /**
   * Receive notifications about key stages in the registration process.
   * For example, you might use event notifications to toggle loading icons or
   * to disable certain form fields.
   * @param event
   * @returns
   */
  onEvent?: OnEventFn
  timeout?: number | undefined
}

export const fetchOptions = (options: Omit<RegistrationOptions, keyof PasslockOptions>) =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger)
    const { endpoint } = yield* Micro.service(Endpoint)
    const { tenancyId } = yield* Micro.service(TenancyId)

    const {
      username,
      userDisplayName,
      userId,
      excludeCredentials,
      userVerification,
      timeout,
      onEvent,
    } = options

    const url = new URL(`${tenancyId}/passkey/registration/options`, endpoint)

    onEvent?.("optionsRequest")
    yield* logger.logInfo("Fetching passkey registration options from Passlock")

    const payload = {
      excludeCredentials,
      timeout,
      userDisplayName,
      userId,
      username,
      userVerification,
    }

    return yield* makeRequest({
      label: "registration options",
      payload,
      responsePredicate: isOptionsResponse,
      url,
    })
  })

const RegistrationSuccessTag = "RegistrationSuccess" as const
type RegistrationSuccessTag = typeof RegistrationSuccessTag

/**
 * Represents the outcome of a successfull passkey registration.
 * Submit the code and/or id_token to your backend, then either
 * exchange the code with the passlock REST API or decode and
 * verify the id_token (JWT).
 *
 * Note: The @passlock/node library includes utilities to do this
 * for you.
 */
export interface RegistrationSuccess {
  _tag: RegistrationSuccessTag
  principal: {
    authenticatorId: string
    userId: string
  }
  /**
   * A signed JWT representing the newly registered passkey.
   * Decode and verify this in your backend or use one of the @passlock/node
   * helper utilities.
   *
   * @see {@link https://passlock.dev/principal/idtoken-verification/|id_token}
   */
  id_token: string
  /**
   * Call the Passlock API to exchange this code for details about the newly
   * registered passkey.
   *
   * @see {@link https://passlock.dev/principal/code-exchange//|code exchange}
   */
  code: string
}

export const isRegistrationSuccess = (payload: unknown): payload is RegistrationSuccess => {
  if (typeof payload !== "object") return false
  if (payload === null) return false

  if (!("_tag" in payload)) return false
  if (typeof payload._tag !== "string") return false
  if (payload._tag !== RegistrationSuccessTag) return false

  return true
}

export const startRegistration = (
  optionsJSON: PublicKeyCredentialCreationOptionsJSON,
  { onEvent }: { onEvent?: OnEventFn | undefined }
) =>
  Micro.gen(function* () {
    onEvent?.("createCredential")
    const logger = yield* Micro.service(Logger)
    yield* logger.logInfo("Registering passkey on device")

    const helper = yield* Micro.service(RegistrationHelper)

    const isSupport = helper.browserSupportsWebAuthn()
    if (!isSupport)
      yield* new PasskeysUnsupportedError({
        message: "Device does not support passkeys",
      })

    return yield* Micro.tryPromise({
      catch: (error) => {
        if (
          error instanceof WebAuthnError &&
          error.code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED"
        ) {
          return new DuplicatePasskeyError({ message: error.message })
        } else if (error instanceof WebAuthnError) {
          return new OtherPasskeyError({
            code: error.code,
            error: error.cause,
            message: error.message,
          })
        } else {
          return new OtherPasskeyError({ error, message: "Unexpected error" })
        }
      },
      try: () => helper.startRegistration({ optionsJSON }),
    })
  })

export const verifyCredential = (
  sessionToken: string,
  response: RegistrationResponseJSON,
  { onEvent }: { onEvent?: OnEventFn | undefined }
) =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger)
    const { endpoint } = yield* Micro.service(Endpoint)
    const { tenancyId } = yield* Micro.service(TenancyId)

    const url = new URL(`${tenancyId}/passkey/registration/verification`, endpoint)

    onEvent?.("saveCredential")
    yield* logger.logInfo("Registering passkey in Passlock vault")

    const payload = {
      response,
      sessionToken,
    }

    const registrationResponse = yield* makeRequest({
      label: "registration verification",
      payload,
      responsePredicate: isRegistrationSuccess,
      url,
    })

    yield* logger.logInfo(
      `Passkey registered with id ${registrationResponse.principal.authenticatorId}`
    )

    return registrationResponse
  })

/**
 * Potential errors associated with Passkey registration
 */
export type RegistrationError =
  | PasskeysUnsupportedError
  | DuplicatePasskeyError
  | OtherPasskeyError
  | UnexpectedError

/**
 * Register a passkey on the local device and store the
 * associated public key in the Passlock vault.
 * @param options
 * @returns
 */
export const registerPasskey = (
  options: RegistrationOptions
): Micro.Micro<RegistrationSuccess, RegistrationError, Logger | RegistrationHelper> => {
  const endpoint = buildEndpoint(options)

  const effect = Micro.gen(function* () {
    const { sessionToken, optionsJSON } = yield* fetchOptions(options)
    const response = yield* startRegistration(optionsJSON, {
      onEvent: options.onEvent,
    })
    return yield* verifyCredential(sessionToken, response, {
      onEvent: options.onEvent,
    })
  })

  return pipe(
    effect,
    Micro.provideService(TenancyId, options),
    Micro.provideService(Endpoint, endpoint)
  )
}
