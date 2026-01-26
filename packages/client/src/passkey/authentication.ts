import type { PasslockOptions } from "../shared/options"
import type { UserVerification } from "./shared"
import * as Helper from "@simplewebauthn/browser"
import {
  type AuthenticationResponseJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  WebAuthnError,
} from "@simplewebauthn/browser"
import { Context, Micro, pipe } from "effect"
import { Logger } from "../logger"
import { buildEndpoint, Endpoint, makeRequest, type UnexpectedError } from "../shared/network"
import { TenancyId } from "../shared/tenancy"
import { OtherPasskeyError, PasskeyUnsupportedError } from "./errors"

interface OptionsResponse {
  sessionToken: string
  optionsJSON: PublicKeyCredentialRequestOptionsJSON
}

export class AuthenticationHelper extends Context.Tag("AuthenticationHelper")<
  AuthenticationHelper,
  {
    browserSupportsWebAuthn: typeof Helper.browserSupportsWebAuthn
    startAuthentication: typeof Helper.startAuthentication
  }
>() {
  static Default = {
    browserSupportsWebAuthn: Helper.browserSupportsWebAuthn,
    startAuthentication: Helper.startAuthentication,
  } satisfies typeof AuthenticationHelper.Service
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

export const authenticationEvent = ["optionsRequest", "getCredential", "verifyCredential"] as const

export type AuthenticationEvent = (typeof authenticationEvent)[number]

export type OnEventFn = (event: AuthenticationEvent) => void

export interface AuthenticationOptions extends PasslockOptions {
  /**
   * Passlock userId. Essentially a shortcut to look up any
   * registered passkeys (allowCredentials) for a given user.
   */
  userId?: string | undefined
  /**
   * Restrict the passkey(s) the device presents to the user to a given set
   *
   * @see {@link https://passlock.dev/passkeys/authentication/#allowcredentials|allowCredentials}
   */
  allowCredentials?: Array<string> | undefined
  /**
   * Whether the device should re-authenticate the user locally before registering the passkey.
   *
   * @see {@link https://passlock.dev/passkeys/user-verification/|userVerification}
   */
  userVerification?: UserVerification | undefined
  /**
   * Use browser autofill.
   */
  autofill?: boolean
  /**
   * Receive notifications about key stages in the authentication process.
   * For example, you might use event notifications to toggle loading icons or
   * to disable certain form fields.
   * @param event
   * @returns
   */
  onEvent?: OnEventFn
  timeout?: number | undefined
}

export const fetchOptions = (options: Omit<AuthenticationOptions, keyof PasslockOptions>) =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger)
    const { endpoint } = yield* Micro.service(Endpoint)
    const { tenancyId } = yield* Micro.service(TenancyId)

    const { userId, userVerification, allowCredentials, timeout, onEvent } = options
    const url = new URL(`${tenancyId}/passkey/authentication/options`, endpoint)

    onEvent?.("optionsRequest")
    yield* logger.logInfo("Fetching passkey authentication options from Passlock")

    const payload = {
      allowCredentials,
      userId,
      userVerification,
      timeout,
    }

    return yield* makeRequest({
      label: "authentication options",
      payload,
      responsePredicate: isOptionsResponse,
      url,
    })
  })

const AuthenticationSuccessTag = "AuthenticationSuccess" as const
type AuthenticationSuccessTag = typeof AuthenticationSuccessTag

/**
 * Represents the outcome of a successfull passkey authentication.
 * Submit the code and/or id_token to your backend, then either
 * exchange the code with the passlock REST API or decode and
 * verify the id_token (JWT).
 *
 * Note: The @passlock/node library includes utilities to do this
 * for you.
 */
export interface AuthenticationSuccess {
  _tag: AuthenticationSuccessTag
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

export const isAuthenticationSuccess = (payload: unknown): payload is AuthenticationSuccess => {
  if (typeof payload !== "object") return false
  if (payload === null) return false

  if (!("_tag" in payload)) return false
  if (typeof payload._tag !== "string") return false
  if (payload._tag !== AuthenticationSuccessTag) return false

  return true
}

/*
 * Client tried to authenticate with a passkey that was deleted in the vault
 */
export interface PasskeyNotFound {
  _tag: "@error/PasskeyNotFound"
  message: string
  credentialId: string
  rpId: string
}

export const isPasskeyNotFound = (payload: unknown): payload is PasskeyNotFound => {
  if (typeof payload !== "object") return false
  if (payload === null) return false

  if (!("_tag" in payload)) return false
  if (typeof payload._tag !== "string") return false
  if (payload._tag !== "@error/PasskeyNotFound") return false

  if (!("message" in payload)) return false
  if (typeof payload.message !== "string") return false

  if (!("credentialId" in payload)) return false
  if (typeof payload.credentialId !== "string") return false

  if (!("rpId" in payload)) return false
  if (typeof payload.rpId !== "string") return false

  return true
}

export const startAuthentication = (
  optionsJSON: PublicKeyCredentialRequestOptionsJSON,
  {
    useBrowserAutofill,
    onEvent,
  }: {
    useBrowserAutofill: boolean
    onEvent?: OnEventFn | undefined
  }
) =>
  Micro.gen(function* () {
    onEvent?.("getCredential")
    const logger = yield* Micro.service(Logger)
    yield* logger.logInfo("Requesting passkey authentication on device")

    const helper = yield* Micro.service(AuthenticationHelper)

    const isSupport = helper.browserSupportsWebAuthn()
    if (!isSupport)
      yield* new PasskeyUnsupportedError({
        message: "Device does not support passkeys",
      })

    return yield* Micro.tryPromise({
      catch: (error) => {
        if (error instanceof WebAuthnError) {
          return new OtherPasskeyError({
            code: error.code,
            error: error.cause,
            message: error.message,
            cause: error.cause,
          })
        } else {
          return new OtherPasskeyError({ error, message: "Unexpected error" })
        }
      },
      try: () => helper.startAuthentication({ optionsJSON, useBrowserAutofill }),
    })
  })

export const verifyCredential = (
  sessionToken: string,
  response: AuthenticationResponseJSON,
  { onEvent }: { onEvent?: OnEventFn | undefined }
) =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger)
    const { endpoint } = yield* Micro.service(Endpoint)
    const { tenancyId } = yield* Micro.service(TenancyId)

    const url = new URL(`${tenancyId}/passkey/authentication/verification`, endpoint)

    onEvent?.("verifyCredential")
    yield* logger.logInfo("Verifying passkey in Passlock vault")

    const payload = {
      response,
      sessionToken,
    }

    const authenticationResponse = yield* makeRequest({
      errorPredicate: isPasskeyNotFound,
      label: "authentication verification",
      payload,
      responsePredicate: isAuthenticationSuccess,
      url,
    })

    yield* logger.logInfo(
      `Passkey with id ${authenticationResponse.principal.authenticatorId} successfully authenticated`
    )

    return authenticationResponse
  })

export type AuthenticationError =
  | PasskeyUnsupportedError
  | OtherPasskeyError
  | PasskeyNotFound
  | UnexpectedError

/**
 * Trigger local passkey authentication then verify the passkey in the Passlock vault.
 * Returns a code and id_token that can be exchanged/decoded in your backend.
 *
 * @param options
 * @returns
 */
export const authenticatePasskey = (
  options: AuthenticationOptions
): Micro.Micro<AuthenticationSuccess, AuthenticationError, Logger | AuthenticationHelper> => {
  const endpoint = buildEndpoint(options)

  const micro = Micro.gen(function* () {
    const { sessionToken, optionsJSON } = yield* fetchOptions(options)

    const go = (useBrowserAutofill: boolean) =>
      Micro.gen(function* () {
        if (useBrowserAutofill) yield* Micro.sleep(100)

        const response = yield* startAuthentication(optionsJSON, {
          onEvent: options.onEvent,
          useBrowserAutofill,
        })

        options.onEvent?.("verifyCredential")
        return yield* verifyCredential(sessionToken, response, {
          onEvent: options.onEvent,
        })
      })

    if (options.autofill === true) {
      return yield* go(options.autofill)
    } else {
      return yield* go(false)
    }
  })

  return pipe(
    micro,
    Micro.provideService(TenancyId, options),
    Micro.provideService(Endpoint, endpoint)
  )
}
