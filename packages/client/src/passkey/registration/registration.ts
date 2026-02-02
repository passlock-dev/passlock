import * as Helper from "@simplewebauthn/browser"
import {
  type PublicKeyCredentialCreationOptionsJSON,
  type RegistrationResponseJSON,
  WebAuthnError,
} from "@simplewebauthn/browser"
import { Context, Micro, pipe } from "effect"
import type { Principal } from "src/principal"
import { Endpoint, makeEndpoint, makeRequest, TenancyId } from "../../internal"
import type { NetworkError } from "../../internal/network"
import { Logger } from "../../logger"
import type { PasslockOptions } from "../../options"
import {
  DuplicatePasskeyError,
  OtherPasskeyError,
  PasskeyUnsupportedError,
} from "../errors"
import type { Millis, UserVerification } from "../shared"

/**
 * Passkey registration options
 *
 * @category Passkeys (core)
 */
export interface RegistrationOptions extends PasslockOptions {
  /**
   * Username associated with passkey. Will be shown by the device during
   * registration and subsequent authentication. The value used should be
   * meaningful to the user e.g. jdoe or jdoe@gmail.com vs 5487546.
   *
   * You won't directly associate the username with an account in your
   * backend. Instead, you'll associate the passkey ID with an account.
   *
   * @see {@link https://passlock.dev/passkeys/registration}
   */
  username: string

  /**
   * May be shown by devices in place of the username e.g. given a username
   * of jdoe or jdoe@gmail.com a suitable display name might be "John Doe"
   * or "John Doe (personal)". Note: no guarantee browsers/devices will
   * choose to display this property.
   */
  userDisplayName?: string | undefined

  /**
   * Prevents the user registering a passkey if they already have one
   * (associated with the same user account) registered on the current device.
   *
   * @see {@link https://passlock.dev/passkeys/exclude-credentials}
   */
  excludeCredentials?: Array<string> | undefined

  /**
   * Whether the device should re-authenticate the user locally before registering the passkey.
   *
   * @see {@link https://passlock.dev/passkeys/user-verification}
   */
  userVerification?: UserVerification | undefined

  /**
   * Receive notifications about key stages in the registration process.
   * For example, you might use event notifications to toggle loading icons or
   * to disable certain form fields.
   *
   * @param event
   * @returns Nothing.
   */
  onEvent?: OnRegistrationEvent

  /**
   * Abort the operation after N milliseconds
   */
  timeout?: Millis | undefined
}

/**
 * @internal
 * @hidden
 */
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

/**
 * Represents the outcome of a successful passkey registration.
 * Submit the code and/or id_token to your backend, then either
 * exchange the code with the passlock REST API or decode and
 * verify the id_token (JWT).
 *
 * Note: The @passlock/node library includes utilities to do this
 * for you.
 *
 * @category Passkeys (core)
 */
export type RegistrationSuccess = {
  /**
   * Discriminator for use in a discriminated union.
   */
  _tag: "RegistrationSuccess"

  principal: Principal

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
   * @see {@link https://passlock.dev/principal/code-exchange/|code exchange}
   */
  code: string
}

/**
 * Type guard to test for a {@link RegistrationSuccess}. Typically used to test the
 * object returned from {@link registerPasskey}
 *
 * @param payload
 * @returns `true` if the payload is a {@link RegistrationSuccess}.
 *
 * @category Passkeys (other)
 */
export const isRegistrationSuccess = (
  payload: unknown
): payload is RegistrationSuccess => {
  if (typeof payload !== "object") return false
  if (payload === null) return false

  if (!("_tag" in payload)) return false
  if (typeof payload._tag !== "string") return false
  if (payload._tag !== "RegistrationSuccess") return false

  return true
}

export type OptionsResponse = {
  sessionToken: string
  optionsJSON: PublicKeyCredentialCreationOptionsJSON
}

export const isOptionsResponse = (
  payload: unknown
): payload is OptionsResponse => {
  if (typeof payload !== "object") return false
  if (payload === null) return false

  if (!("optionsJSON" in payload)) return false
  if (typeof payload.optionsJSON !== "object") return false
  if (payload.optionsJSON === null) return false

  if (!("sessionToken" in payload)) return false
  if (typeof payload.sessionToken !== "string") return false

  return true
}

export const fetchOptions = (
  options: Omit<RegistrationOptions, keyof PasslockOptions>
) =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger)
    const { endpoint } = yield* Micro.service(Endpoint)
    const { tenancyId } = yield* Micro.service(TenancyId)

    const {
      username,
      userDisplayName,
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

export const startRegistration = (
  optionsJSON: PublicKeyCredentialCreationOptionsJSON,
  { onEvent }: { onEvent?: OnRegistrationEvent | undefined }
) =>
  Micro.gen(function* () {
    onEvent?.("createCredential")
    const logger = yield* Micro.service(Logger)
    yield* logger.logInfo("Registering passkey on device")

    const helper = yield* Micro.service(RegistrationHelper)

    const isSupport = helper.browserSupportsWebAuthn()
    if (!isSupport)
      yield* Micro.fail(
        new PasskeyUnsupportedError({
          message: "Device does not support passkeys",
        })
      )

    return yield* Micro.tryPromise({
      try: () => helper.startRegistration({ optionsJSON }),
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
    })
  })

export const verifyCredential = (
  sessionToken: string,
  response: RegistrationResponseJSON,
  { onEvent }: { onEvent?: OnRegistrationEvent | undefined }
) =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger)
    const { endpoint } = yield* Micro.service(Endpoint)
    const { tenancyId } = yield* Micro.service(TenancyId)

    const url = new URL(
      `${tenancyId}/passkey/registration/verification`,
      endpoint
    )

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
 *
 * @category Passkeys (errors)
 */
export type RegistrationError =
  | PasskeyUnsupportedError
  | DuplicatePasskeyError
  | OtherPasskeyError
  | NetworkError

/**
 * Trigger local passkey registration then save the passkey in your Passlock vault.
 * Returns a code and id_token that can be exchanged/decoded in your backend.
 *
 * @param options
 * @returns A Micro effect that resolves with {@link RegistrationSuccess} or
 * fails with {@link RegistrationError}.
 */
export const registerPasskey = (
  options: RegistrationOptions
): Micro.Micro<
  RegistrationSuccess,
  RegistrationError,
  Logger | RegistrationHelper
> => {
  const endpoint = makeEndpoint(options)

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

export const RegistrationEvent = [
  "optionsRequest",
  "createCredential",
  "saveCredential",
] as const

/**
 * Type of the registration event
 *
 * @category Passkeys (other)
 */
export type RegistrationEvent = (typeof RegistrationEvent)[number]

/**
 * Callback to receive registration lifecycle events.
 *
 * @category Passkeys (other)
 */
export type OnRegistrationEvent = (event: RegistrationEvent) => void
