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

/**
 * Passkey authentication options.
 *
 * Your backend should first prepare a one-time authentication token with
 * `@passlock/server`, then pass that token to the browser. Relying party ID,
 * allowed credentials, user verification, timeout, and autofill/mediation
 * policy are all decided by the backend during preparation.
 *
 * @see {@link authenticatePasskey}
 *
 * @category Passkeys (core)
 */
export type AuthenticationOptions = PreparedAuthenticationOptions

/**
 * Server-prepared passkey authentication options.
 *
 * Your backend should first call `preparePasskeyAuthentication` from
 * `@passlock/server`, return the resulting `authenticationToken` to the
 * browser, then pass that token to {@link authenticatePasskey}.
 *
 * For discoverable login and autofill, prepare the token with
 * `discoverable: true` and, for autofill, `mediation: "conditional"`.
 *
 * @see {@link authenticatePasskey}
 *
 * @category Passkeys (core)
 */
export interface PreparedAuthenticationOptions {
  /**
   * One-time authentication token returned by `@passlock/server`'s
   * `preparePasskeyAuthentication` function.
   */
  authenticationToken: string

  /**
   * Receive notifications about key stages in the authentication process.
   * For example, you might use event notifications to toggle loading icons or
   * to disable certain form fields.
   */
  onEvent?: OnAuthenticationEvent | undefined
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

const removedAuthenticationOptionKeys = [
  "rpId",
  "allowCredentials",
  "userId",
  "userVerification",
  "timeout",
  "autofill",
] as const

const isAuthenticationOptions = (options: unknown): options is AuthenticationOptions => {
  if (typeof options !== "object") return false
  if (options === null) return false

  if (!("authenticationToken" in options)) return false
  if (typeof options.authenticationToken !== "string") return false

  return true
}

const findRemovedAuthenticationOptionKey = (options: unknown): string | undefined => {
  if (typeof options !== "object") return undefined
  if (options === null) return undefined

  return removedAuthenticationOptionKeys.find((key) => key in options)
}

const validateAuthenticationOptions = (options: unknown) => {
  const removedKey = findRemovedAuthenticationOptionKey(options)
  if (removedKey) {
    return Micro.fail(
      new OtherPasskeyError({
        error: options,
        message: `authenticatePasskey no longer accepts browser-started option "${removedKey}". Prepare authentication on your backend and pass only { authenticationToken, onEvent } to the browser.`,
      })
    )
  }

  if (!isAuthenticationOptions(options)) {
    return Micro.fail(
      new OtherPasskeyError({
        error: options,
        message: "authenticatePasskey requires an authenticationToken prepared by your backend.",
      })
    )
  }

  return Micro.succeed(options)
}

export const fetchOptions = (options: AuthenticationOptions) =>
  Micro.gen(function* () {
    const authenticationOptions = yield* validateAuthenticationOptions(options)
    const logger = yield* Micro.service(Logger)
    const { endpoint } = yield* Micro.service(Endpoint)
    const { tenancyId } = yield* Micro.service(TenancyId)

    const { onEvent } = authenticationOptions
    const url = new URL(`v2/${tenancyId}/passkey/authentication/options`, endpoint)

    onEvent?.("optionsRequest")
    yield* logger.logInfo("Fetching passkey authentication options from Passlock")

    const payload = { authenticationToken: authenticationOptions.authenticationToken }

    return yield* makeRequest({
      label: "authentication options",
      payload,
      responsePredicate: isOptionsResponse,
      url,
    })
  })

/**
 * Authentication ceremony options returned by Passlock after redeeming a
 * prepared authentication token.
 *
 * The `mediation` field is server-prepared ceremony metadata. `"required"`
 * starts a normal WebAuthn credential request; `"conditional"` starts
 * WebAuthn using browser autofill/conditional mediation.
 *
 * @category Passkeys (core)
 */
export type OptionsResponse = {
  /**
   * One-time token tying the browser WebAuthn response to the prepared
   * authentication challenge.
   */
  sessionToken: string
  /**
   * WebAuthn credential request options passed to the browser.
   */
  optionsJSON: PublicKeyCredentialRequestOptionsJSON
  /**
   * Whether the browser should start a normal or conditional/autofill
   * authentication ceremony.
   */
  mediation: "required" | "conditional"
}

export const isOptionsResponse = (payload: unknown): payload is OptionsResponse => {
  if (typeof payload !== "object") return false
  if (payload === null) return false

  if (!("optionsJSON" in payload)) return false
  if (typeof payload.optionsJSON !== "object") return false
  if (payload.optionsJSON === null) return false

  if (!("sessionToken" in payload)) return false
  if (typeof payload.sessionToken !== "string") return false

  if (!("mediation" in payload)) return false
  if (payload.mediation !== "required" && payload.mediation !== "conditional") return false

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

    const url = new URL(`v2/${tenancyId}/passkey/authentication/verification`, endpoint)

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
 * Trigger local passkey authentication, then verify the passkey in your
 * Passlock vault.
 *
 * Pass an `authenticationToken` created by `@passlock/server`'s
 * `preparePasskeyAuthentication` function. On success, the returned code and
 * id_token can be exchanged or verified in your backend.
 *
 * @param options Authentication ceremony options.
 * @param config Passlock tenancy and API endpoint options.
 * @returns A Micro effect that resolves with {@link AuthenticationSuccess} or
 * fails with {@link AuthenticationError}.
 */
export const authenticatePasskey = (
  options: AuthenticationOptions,
  config: PasslockOptions
): Micro.Micro<AuthenticationSuccess, AuthenticationError, Logger | AuthenticationHelper> => {
  const endpoint = makeEndpoint(config)

  const micro = Micro.gen(function* () {
    const authenticationOptions = yield* validateAuthenticationOptions(options)
    const { sessionToken, optionsJSON, mediation } = yield* fetchOptions(authenticationOptions)

    const go = (useBrowserAutofill: boolean) =>
      Micro.gen(function* () {
        if (useBrowserAutofill) yield* Micro.sleep(100)

        const response = yield* startAuthentication(optionsJSON, {
          onEvent: authenticationOptions.onEvent,
          useBrowserAutofill,
        })

        authenticationOptions.onEvent?.("verifyCredential")
        return yield* verifyCredential(sessionToken, response, {
          onEvent: authenticationOptions.onEvent,
        })
      })

    return yield* go(mediation === "conditional")
  })

  return pipe(
    micro,
    Micro.provideService(TenancyId, config),
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
 * When your prepared authentication uses conditional mediation for autofill,
 * the browser will wait for user interaction. By listening for the
 * `verifyCredential` {@link AuthenticationEvent} you know the browser has
 * already returned a credential and Passlock verification is starting, so you
 * can disable forms or toggle loading indicators.
 *
 * @category Passkeys (other)
 */
export type OnAuthenticationEvent = (event: AuthenticationEvent) => void
