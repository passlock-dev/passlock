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
  authType: AuthType
  expiry: number
}

/* Service */

export class StorageService extends Context.Tag('@services/StorageService')<
  StorageService,
  {
    storeToken: (principal: Principal) => E.Effect<void>
    getToken: (authType: AuthType) => E.Effect<StoredToken, NoSuchElementException>
    clearToken: (authType: AuthType) => E.Effect<void>
    clearExpiredToken: (authType: AuthType) => E.Effect<void>
    clearExpiredTokens: E.Effect<void>
  }
>() {}

export class BrowserStorage extends Context.Tag('@services/Storage')<BrowserStorage, Storage>() {}

export const buildKey = (authType: AuthType) => `passlock:${authType}:token`

// principal => token:expireAt
export const compressToken = (principal: Principal): string => {
  const expireAt = principal.exp.getTime()
  const token = principal.jti
  return `${token}:${expireAt.toFixed(0)}`
}

// token:expireAt => { authType, token, expireAt }
export const expandToken =
  (authType: AuthType) =>
  (s: string): O.Option<StoredToken> => {
    const tokens = s.split(':')
    if (tokens.length !== 2) return O.none()

    const [token, expireAtString] = tokens
    const parse = O.liftThrowable(Number.parseInt)
    const expireAt = parse(expireAtString)

    return O.map(expireAt, expiry => ({ authType, token, expiry }))
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
      O.filter(({ expiry }) => expiry > Date.now()),
    )

    return yield* _(getEffect)
  })
}

/**
 * Remove token from local storage
 * @param authType
 * @returns
 */
export const clearToken = (authType: AuthType): E.Effect<void, never, BrowserStorage> => {
  return E.gen(function* (_) {
    const localStorage = yield* _(BrowserStorage)
    localStorage.removeItem(buildKey(authType))
  })
}

/**
 * Only clear if now > token.expireAt
 * @param authType
 * @param defer
 * @returns
 */
export const clearExpiredToken = (authType: AuthType): E.Effect<void, never, BrowserStorage> => {
  const key = buildKey(authType)

  const effect = E.gen(function* (_) {
    const storage = yield* _(BrowserStorage)
    const item = yield* _(O.fromNullable(storage.getItem(key)))
    const token = yield* _(expandToken(authType)(item))

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
