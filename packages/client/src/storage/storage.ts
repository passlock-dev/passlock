/**
 * Wrapper around local storage that allows us to store
 * authentication tokens in local storage for a short period.
 */
import type { Principal } from '@passlock/shared/dist/schema/principal.js'
import { Context, Effect as E, Layer, Option as O, flow, pipe } from 'effect'
import type { NoSuchElementException } from 'effect/Cause'

/* Requests */

export type AuthType = 'email' | 'passkey' | 'apple' | 'google'

export type StoredToken = {
  token: string
  auth_type: AuthType
  expiry: number
}

/* Service */

export class StorageService extends Context.Tag('@services/StorageService')<
  StorageService,
  {
    storeToken: (principal: Principal) => E.Effect<void>
    getToken: (auth_type: AuthType) => E.Effect<StoredToken, NoSuchElementException>
    clearToken: (auth_type: AuthType) => E.Effect<void>
    clearExpiredToken: (auth_type: AuthType) => E.Effect<void>
    clearExpiredTokens: E.Effect<void>
  }
>() {}

export class BrowserStorage extends Context.Tag('@services/Storage')<BrowserStorage, Storage>() {}

export const buildKey = (auth_type: AuthType) => `passlock:${auth_type}:token`

// principal => token:expiry
export const compressToken = (principal: Principal): string => {
  const expiry = principal.exp.getTime()
  const token = principal.jti
  return `${token}:${expiry.toFixed(0)}`
}

// token:expiry => { auth_type, token, expiry }
export const expandToken =
  (auth_type: AuthType) =>
  (s: string): O.Option<StoredToken> => {
    const tokens = s.split(':')
    if (tokens.length !== 2) return O.none()

    const [token, expiryString] = tokens
    const parse = O.liftThrowable(Number.parseInt)
    const expire_at = parse(expiryString)

    return O.map(expire_at, expiry => ({ auth_type, token, expiry }))
  }

/* Effects */

/**
 * Store compressed token in local storage
 * @param principal
 * @returns
 */
export const storeToken = (principal: Principal): E.Effect<void, never, BrowserStorage> => {
  return E.gen(function* (_) {
    const localStorage = yield* _(BrowserStorage)

    const storeEffect = E.try(() => {
      const compressed = compressToken(principal)
      const key = buildKey(principal.auth_type)
      localStorage.setItem(key, compressed)
    }).pipe(E.orElse(() => E.void)) // We dont care if it fails

    return yield* _(storeEffect)
  })
}

/**
 * Get stored token from local storage
 * @param authenticator
 * @returns
 */
export const getToken = (
  authenticator: AuthType,
): E.Effect<StoredToken, NoSuchElementException, BrowserStorage> => {
  return E.gen(function* (_) {
    const localStorage = yield* _(BrowserStorage)

    const getEffect = pipe(
      O.some(buildKey(authenticator)),
      O.flatMap(key => pipe(localStorage.getItem(key), O.fromNullable)),
      O.flatMap(expandToken(authenticator)),
      O.filter(({ expiry: expiry }) => expiry > Date.now()),
    )

    return yield* _(getEffect)
  })
}

/**
 * Remove token from local storage
 * @param auth_type
 * @returns
 */
export const clearToken = (auth_type: AuthType): E.Effect<void, never, BrowserStorage> => {
  return E.gen(function* (_) {
    const localStorage = yield* _(BrowserStorage)
    localStorage.removeItem(buildKey(auth_type))
  })
}

/**
 * Only clear if now > token.expiry
 * @param auth_type
 * @param defer
 * @returns
 */
export const clearExpiredToken = (auth_type: AuthType): E.Effect<void, never, BrowserStorage> => {
  const key = buildKey(auth_type)

  const effect = E.gen(function* (_) {
    const storage = yield* _(BrowserStorage)
    const item = yield* _(O.fromNullable(storage.getItem(key)))
    const token = yield* _(expandToken(auth_type)(item))

    if (token.expiry < Date.now()) {
      storage.removeItem(key)
    }
  })

  // we don't care if it fails
  return pipe(
    effect,
    E.match({
      onSuccess: () => E.void,
      onFailure: () => E.void,
    }),
  )
}

export const clearExpiredTokens: E.Effect<void, never, BrowserStorage> = E.all([
  clearExpiredToken('passkey'),
  clearExpiredToken('email'),
  clearExpiredToken('google'),
  clearExpiredToken('apple'),
])

/* Live */

/* v8 ignore start */
export const StorageServiceLive = Layer.effect(
  StorageService,
  E.gen(function* (_) {
    const context = yield* _(E.context<BrowserStorage>())

    return {
      storeToken: flow(storeToken, E.provide(context)),
      getToken: flow(getToken, E.provide(context)),
      clearToken: flow(clearToken, E.provide(context)),
      clearExpiredToken: flow(clearExpiredToken, E.provide(context)),
      clearExpiredTokens: pipe(clearExpiredTokens, E.provide(context)),
    }
  }),
)
/* v8 ignore stop */
