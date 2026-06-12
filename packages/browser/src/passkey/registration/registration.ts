import * as Helper from "@simplewebauthn/browser"
import {
  type PublicKeyCredentialCreationOptionsJSON,
  type RegistrationResponseJSON,
  WebAuthnError,
} from "@simplewebauthn/browser"
import { Context, Micro, pipe } from "effect"
import { Endpoint, makeEndpoint, makeRequest, TenancyId } from "../../internal/index.js"
import type { NetworkError } from "../../internal/network.js"
import { Logger } from "../../logger.js"
import type { PasslockOptions } from "../../options.js"
import type { Principal } from "../../principal"
import { DuplicatePasskeyError, OtherPasskeyError, PasskeyUnsupportedError } from "../errors.js"

/**
 * Options for registering a passkey from a server-authorized registration token.
 * The backend chooses the WebAuthn RP ID when it authorizes the token; the
 * browser redeems the token and uses the returned WebAuthn options as-is.
 *
 * If the current origin differs from the authorized RP ID, the browser's
 * WebAuthn related-origin policy must allow the ceremony. The browser library
 * does not accept or override the RP ID.
 *
 * @see {@link registerPasskey}
 *
 * @category Passkeys (core)
 */
export interface RegistrationOptions {
  /**
   * One-time token created by your backend using `@passlock/server`'s
   * `authorizePasskeyRegistration` function.
   */
  registrationToken: string

  /**
   * Receive notifications about key stages in the registration process.
   */
  onEvent?: OnRegistrationEvent
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
 * Submit the `code` and/or `id_token` to your backend, then either
 * exchange the code with the Passlock REST API or decode and
 * verify the id_token (JWT). Note: the `@passlock/server` library
 * includes utilities for this.
 *
 * @see {@link isRegistrationSuccess}
 *
 * @category Passkeys (core)
 */
export type RegistrationSuccess = {
  /**
   * Discriminator for use in a discriminated union.
   */
  _tag: "RegistrationSuccess"

  /**
   * Passlock identifiers for the newly registered passkey.
   */
  principal: Principal

  /**
   * A signed JWT representing the newly registered passkey.
   * Decode and verify this in your backend or use one of the @passlock/server
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
 * @param payload Unknown value to test.
 * @returns `true` if the payload is a {@link RegistrationSuccess}.
 *
 * @category Passkeys (other)
 */
export const isRegistrationSuccess = (payload: unknown): payload is RegistrationSuccess => {
  if (typeof payload !== "object") return false
  if (payload === null) return false

  if (!("_tag" in payload)) return false
  if (typeof payload._tag !== "string") return false
  return payload._tag === "RegistrationSuccess"
}

export type OptionsResponse = {
  sessionToken: string
  optionsJSON: PublicKeyCredentialCreationOptionsJSON
}

export const isOptionsResponse = (payload: unknown): payload is OptionsResponse => {
  if (typeof payload !== "object") return false
  if (payload === null) return false

  if (!("optionsJSON" in payload)) return false
  if (typeof payload.optionsJSON !== "object") return false
  if (payload.optionsJSON === null) return false

  if (!("sessionToken" in payload)) return false
  if (typeof payload.sessionToken !== "string") return false

  return true
}

export const fetchOptions = (options: RegistrationOptions) =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger)
    const { endpoint } = yield* Micro.service(Endpoint)
    const { tenancyId } = yield* Micro.service(TenancyId)

    const { registrationToken, onEvent } = options

    const url = new URL(`v2/${tenancyId}/passkey/registration/options`, endpoint)

    onEvent?.("optionsRequest")
    yield* logger.logInfo("Fetching passkey registration options from Passlock")

    return yield* makeRequest({
      label: "registration options",
      payload: { registrationToken },
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

    const url = new URL(`v2/${tenancyId}/passkey/registration/verification`, endpoint)

    onEvent?.("saveCredential")
    yield* logger.logInfo("Registering passkey in Passlock vault")

    const registrationResponse = yield* makeRequest({
      label: "registration verification",
      payload: {
        response,
        sessionToken,
      },
      responsePredicate: isRegistrationSuccess,
      url,
    })

    yield* logger.logInfo(
      `Passkey registered with id ${registrationResponse.principal.authenticatorId}`
    )

    return registrationResponse
  })

/**
 * Potential errors associated with passkey registration.
 *
 * @category Passkeys (errors)
 */
export type RegistrationError =
  | PasskeyUnsupportedError
  | DuplicatePasskeyError
  | OtherPasskeyError
  | NetworkError

/**
 * Trigger local passkey registration from a server-authorized registration token,
 * then save the passkey in your Passlock vault.
 *
 * Use this with `@passlock/server`'s `authorizePasskeyRegistration` function so
 * your backend authorizes the passkey creation, supplies the final user ID, and
 * chooses the RP ID before the browser starts the WebAuthn ceremony. The
 * browser uses the options returned by Passlock and does not send an RP ID of
 * its own.
 *
 * @param options Registration token and optional lifecycle callback.
 * @param config Passlock tenancy and API endpoint options.
 * @returns A Micro effect that resolves with {@link RegistrationSuccess} or
 * fails with {@link RegistrationError}.
 */
export const registerPasskey = (
  options: RegistrationOptions,
  config: PasslockOptions
): Micro.Micro<RegistrationSuccess, RegistrationError, Logger | RegistrationHelper> => {
  const endpoint = makeEndpoint(config)

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
    Micro.provideService(TenancyId, config),
    Micro.provideService(Endpoint, endpoint)
  )
}

/**
 * All registration lifecycle events emitted by {@link registerPasskey}.
 *
 * @category Passkeys (other)
 */
export const RegistrationEvents = ["optionsRequest", "createCredential", "saveCredential"] as const

/**
 * Registration lifecycle event name.
 *
 * @category Passkeys (other)
 */
export type RegistrationEvent = "optionsRequest" | "createCredential" | "saveCredential"

/**
 * Callback invoked when registration reaches a lifecycle event.
 *
 * @category Passkeys (other)
 */
export type OnRegistrationEvent = (event: RegistrationEvent) => void
