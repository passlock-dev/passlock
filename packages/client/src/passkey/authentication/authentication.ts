import * as Helper from "@simplewebauthn/browser"
import {
  type AuthenticationResponseJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  WebAuthnError,
} from "@simplewebauthn/browser"
import { Context, Micro, pipe } from "effect"
import { Endpoint, makeEndpoint, makeRequest, TenancyId } from "../../internal/index.js"
import type { NetworkError } from "../../internal/network.js"
import { Logger } from "../../logger.js"
import type { PasslockOptions } from "../../options.js"
import type { Principal } from "../../principal"
import { OrphanedPasskeyError, OtherPasskeyError, PasskeyUnsupportedError } from "../errors.js"
import type { Millis, UserVerification } from "../shared.js"

/**
 * Passkey authentication options.
 *
 * @see {@link authenticatePasskey}
 *
 * @category Passkeys (core)
 */
export interface AuthenticationOptions extends PasslockOptions {
  /**
   * Restrict the passkeys the device can present to the user to this set.
   *
   * @see {@link https://passlock.dev/passkeys/allow-credentials/ allowCredentials (main docs)}
   */
  allowCredentials?: Array<string> | undefined

  /**
   * Whether the device should re-authenticate the user locally before
   * authenticating with a passkey.
   *
   * @see {@link https://passlock.dev/passkeys/user-verification/ userVerification (main docs)}
   */
  userVerification?: UserVerification | undefined

  /**
   * Use browser autofill.
   *
   * @see {@link https://passlock.dev/passkeys/autofill/ autofill (main docs)}
   */
  autofill?: boolean | undefined

  /**
   * Receive notifications about key stages in the authentication process.
   * For example, you might use event notifications to toggle loading icons or
   * to disable certain form fields.
   */
  onEvent?: OnAuthenticationEvent | undefined

  /**
   * Abort the operation after N milliseconds
   */
  timeout?: Millis | undefined

  /**
   * Override the rpId. Use this when you want to accept passkeys from
   * a different domain/rpId.
   *
   * @see {@link https://passlock.dev/passkeys/related-origin-requests/ related origin requests (main docs)}
   */
  rpId?: string
}

/**
 * @internal
 * @hidden
 */
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

/**
 * Discriminator value used by {@link AuthenticationSuccess}.
 */
export const AuthenticationSuccessTag = "AuthenticationSuccess" as const
export type AuthenticationSuccessTag = typeof AuthenticationSuccessTag

/**
 * Represents the outcome of a successful passkey authentication.
 * Submit the `code` and/or `id_token` to your backend, then either
 * exchange the code with the Passlock REST API or decode and
 * verify the id_token (JWT). Note: the `@passlock/server` library
 * includes utilities for this.
 *
 * @see {@link isAuthenticationSuccess}
 *
 * @category Passkeys (core)
 */
export type AuthenticationSuccess = {
  /**
   * Discriminator for use in a discriminated union.
   */
  _tag: "AuthenticationSuccess"

  /**
   * Passlock identifiers for the authenticated passkey.
   */
  principal: Principal

  /**
   * A signed JWT representing the authenticated passkey.
   * Decode and verify this in your backend or use one of the @passlock/server
   * helper utilities.
   *
   * @see {@link https://passlock.dev/principal/idtoken-verification/|id_token}
   */
  id_token: string

  /**
   * Call the Passlock API to exchange this code for details about the
   * authenticated passkey.
   *
   * @see {@link https://passlock.dev/principal/code-exchange/|code exchange}
   */
  code: string
}

/**
 * Type guard to narrow something down to an {@link AuthenticationSuccess}
 *
 * @param payload Unknown value to test.
 * @returns `true` if the payload is an {@link AuthenticationSuccess}.
 *
 * @category Passkeys (other)
 */
export const isAuthenticationSuccess = (payload: unknown): payload is AuthenticationSuccess => {
  if (typeof payload !== "object") return false
  if (payload === null) return false

  if (!("_tag" in payload)) return false
  if (typeof payload._tag !== "string") return false
  return payload._tag === AuthenticationSuccessTag
}

export const fetchOptions = (options: Omit<AuthenticationOptions, keyof PasslockOptions>) =>
  Micro.gen(function* () {
    const logger = yield* Micro.service(Logger)
    const { endpoint } = yield* Micro.service(Endpoint)
    const { tenancyId } = yield* Micro.service(TenancyId)

    const { userVerification, allowCredentials, timeout, rpId, onEvent } = options
    const url = new URL(`${tenancyId}/passkey/authentication/options`, endpoint)

    onEvent?.("optionsRequest")
    yield* logger.logInfo("Fetching passkey authentication options from Passlock")

    const payload = {
      allowCredentials,
      userVerification,
      rpId,
      timeout,
    }

    return yield* makeRequest({
      label: "authentication options",
      payload,
      responsePredicate: isOptionsResponse,
      url,
    })
  })

export type OptionsResponse = {
  sessionToken: string
  optionsJSON: PublicKeyCredentialRequestOptionsJSON
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

export const startAuthentication = (
  optionsJSON: PublicKeyCredentialRequestOptionsJSON,
  {
    useBrowserAutofill,
    onEvent,
  }: {
    useBrowserAutofill: boolean
    onEvent?: OnAuthenticationEvent | undefined
  }
) =>
  Micro.gen(function* () {
    onEvent?.("getCredential")
    const logger = yield* Micro.service(Logger)
    yield* logger.logInfo("Requesting passkey authentication on device")

    const helper = yield* Micro.service(AuthenticationHelper)

    const isSupport = helper.browserSupportsWebAuthn()
    if (!isSupport)
      yield* Micro.fail(
        new PasskeyUnsupportedError({
          message: "Device does not support passkeys",
        })
      )

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

type IPasskeyNotFound = {
  _tag: "@error/PasskeyNotFound"
  message: string
  credentialId: string
  rpId: string
}

const isPasskeyNotFound = (payload: unknown): payload is IPasskeyNotFound => {
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

export const verifyCredential = (
  sessionToken: string,
  response: AuthenticationResponseJSON,
  { onEvent }: { onEvent?: OnAuthenticationEvent | undefined }
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

    const authenticationResponse = yield* pipe(
      makeRequest({
        errorPredicate: isPasskeyNotFound,
        label: "authentication verification",
        payload,
        responsePredicate: isAuthenticationSuccess,
        url,
      }),
      Micro.catchTag("@error/PasskeyNotFound", (err) => Micro.fail(new OrphanedPasskeyError(err)))
    )

    yield* logger.logInfo(
      `Passkey with id ${authenticationResponse.principal.authenticatorId} successfully authenticated`
    )

    return authenticationResponse
  })

/**
 * Potential errors associated with passkey authentication.
 *
 * @category Passkeys (errors)
 */
export type AuthenticationError =
  | PasskeyUnsupportedError
  | OtherPasskeyError
  | OrphanedPasskeyError
  | NetworkError

/**
 * Trigger local passkey authentication then verify the passkey in your Passlock vault.
 * Returns a code and id_token that can be exchanged/decoded in your backend.
 *
 * @param options Authentication ceremony options and Passlock tenancy details.
 * @returns A Micro effect that resolves with {@link AuthenticationSuccess} or
 * fails with {@link AuthenticationError}.
 */
export const authenticatePasskey = (
  options: AuthenticationOptions
): Micro.Micro<AuthenticationSuccess, AuthenticationError, Logger | AuthenticationHelper> => {
  const endpoint = makeEndpoint(options)

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

/**
 * All authentication lifecycle events emitted by {@link authenticatePasskey}.
 *
 * @category Passkeys (other)
 */
export const AuthenticationEvents = ["optionsRequest", "getCredential", "verifyCredential"] as const

/**
 * Authentication lifecycle event name.
 *
 * @category Passkeys (other)
 */
export type AuthenticationEvent = "optionsRequest" | "getCredential" | "verifyCredential"

/**
 * Allows you to hook into key lifecycle events.
 *
 * Most commonly used when {@link authenticatePasskey}
 * is called with {@link AuthenticationOptions#autofill}.
 * When autofill is applied the browser will wait for user interaction. By listening
 * for the `verifyCredential` {@link AuthenticationEvent} you know the browser has
 * already returned a credential and Passlock verification is starting, so you can
 * disable forms or toggle loading indicators.
 *
 * @category Passkeys (other)
 */
export type OnAuthenticationEvent = (event: AuthenticationEvent) => void
