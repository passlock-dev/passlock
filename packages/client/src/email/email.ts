/**
 * Email verification effects
 */
import { BadRequest } from '@passlock/shared/dist/error/error.js'
import type { VerifyEmailErrors as RpcErrors } from '@passlock/shared/dist/rpc/user.js'
import { UserClient, VerifyEmailReq } from '@passlock/shared/dist/rpc/user.js'
import type { Principal } from '@passlock/shared/dist/schema/schema.js'
import { Context, Effect as E, Layer, Option as O, flow, identity, pipe } from 'effect'
import { AuthenticationService, type AuthenticationErrors } from '../authentication/authenticate.js'
import { StorageService } from '../storage/storage.js'

/* Requests */

export type VerifyRequest = {
  code: string
}

/* Errors */

export type VerifyEmailErrors = RpcErrors | AuthenticationErrors

/* Dependencies */

export class URLQueryString extends Context.Tag('URLQueryString')<
  URLQueryString,
  E.Effect<string>
>() {}

/* Service */

export type EmailService = {
  verifyEmailCode: (request: VerifyRequest) => E.Effect<Principal, VerifyEmailErrors>
  verifyEmailLink: () => E.Effect<Principal, VerifyEmailErrors>
}

export const EmailService = Context.GenericTag<EmailService>('@services/EmailService')

/* Utils */

export type Dependencies = StorageService | AuthenticationService | UserClient

/**
 * Check for existing token in sessionStorage,
 * otherwise force passkey re-authentication
 * @returns
 */
const getToken = () => {
  return E.gen(function* (_) {
    // Check for existing token
    const storageService = yield* _(StorageService)
    const existingTokenE = storageService.getToken('passkey')
    const authenticationService = yield* _(AuthenticationService)

    const tokenE = E.matchEffect(existingTokenE, {
      onSuccess: token => E.succeed(token),
      onFailure: () =>
        // No token, need to authenticate the user
        pipe(
          authenticationService.authenticatePasskey({ userVerification: 'preferred' }),
          E.map(principal => ({
            token: principal.token,
            authType: principal.authStatement.authType,
            expiresAt: principal.expireAt.getTime(),
          })),
        ),
    })

    const token = yield* _(tokenE)
    yield* _(storageService.clearToken('passkey'))

    return token
  })
}

/**
 * Look for ?code=<code> in the url
 * @returns
 */
export const extractCodeFromHref = () => {
  return pipe(
    URLQueryString,
    E.flatMap(identity),
    E.map(search => new URLSearchParams(search)),
    E.flatMap(params => O.fromNullable(params.get('code'))),
  )
}

/* Effects */

/**
 * Verify the mailbox using the given code
 * @param request
 * @returns
 */
export const verifyEmail = (
  request: VerifyRequest,
): E.Effect<Principal, VerifyEmailErrors, Dependencies> => {
  return E.gen(function* (_) {
    // Re-authenticate the user if required
    const { token } = yield* _(getToken())

    yield* _(E.logDebug('Making request'))
    const client = yield* _(UserClient)
    const { principal } = yield* _(
      client.verifyEmail(new VerifyEmailReq({ token, code: request.code })),
    )

    return principal
  })
}

/**
 * Look for a code in the current url and verify it
 * @returns
 */
export const verifyEmailLink = () =>
  pipe(
    extractCodeFromHref(),
    E.mapError(() => new BadRequest({ message: 'Expected ?code=xxx in window.location' })),
    E.flatMap(code => verifyEmail({ code })),
  )

/* Live */

/* v8 ignore start */
export const EmailServiceLive = Layer.effect(
  EmailService,
  E.gen(function* (_) {
    const context = yield* _(
      E.context<UserClient | AuthenticationService | StorageService | URLQueryString>(),
    )
    return EmailService.of({
      verifyEmailCode: flow(verifyEmail, E.provide(context)),
      verifyEmailLink: flow(verifyEmailLink, E.provide(context)),
    })
  }),
)
/* v8 ignore stop */
