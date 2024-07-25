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
  expireAt: number
}

/* Service */

export type StorageService = {
  storeToken: (principal: Principal) => E.Effect<void>
  getToken: (authType: AuthType) => E.Effect<StoredToken, NoSuchElementException>
  clearToken: (authType: AuthType) => E.Effect<void>
  clearExpiredToken: (authType: AuthType) => E.Effect<void>
  clearExpiredTokens: E.Effect<void>
}

/* Utilities */

export const StorageService = Context.GenericTag<StorageService>('@services/StorageService')

// inject window.localStorage to make testing easier
export const Storage = Context.GenericTag<Storage>('@services/Storage')

export const buildKey = (authType: AuthType) => `passlock:${authType}:token`

// principal => token:expireAt
export const compressToken = (principal: Principal): string => {
  const expireAt = principal.expireAt.getTime()
  const token = principal.token
  return `${token}:${expireAt}`
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

    return O.map(expireAt, expireAt => ({ authType, token, expireAt }))
  }

/* Effects */

/**
 * Store compressed token in local storage
 * @param principal
 * @returns
 */
export const storeToken = (principal: Principal): E.Effect<void, never, Storage> => {
  return E.gen(function* (_) {
    const localStorage = yield* _(Storage)

    const storeEffect = E.try(() => {
      const compressed = compressToken(principal)
      const key = buildKey(principal.authenticator.type)
      localStorage.setItem(key, compressed)
    }).pipe(E.orElse(() => E.void)) // We dont care if it fails

    return yield* _(storeEffect)
  })
}

/**
 * Get stored token from local storage
 * @param authType
 * @returns
 */
export const getToken = (
  authType: AuthType,
): E.Effect<StoredToken, NoSuchElementException, Storage> => {
  return E.gen(function* (_) {
    const localStorage = yield* _(Storage)

    const getEffect = pipe(
      O.some(buildKey(authType)),
      O.flatMap(key => pipe(localStorage.getItem(key), O.fromNullable)),
      O.flatMap(expandToken(authType)),
      O.filter(({ expireAt: expireAt }) => expireAt > Date.now()),
    )

    return yield* _(getEffect)
  })
}

/**
 * Remove token from local storage
 * @param authType
 * @returns
 */
export const clearToken = (authType: AuthType): E.Effect<void, never, Storage> => {
  return E.gen(function* (_) {
    const localStorage = yield* _(Storage)
    localStorage.removeItem(buildKey(authType))
  })
}

/**
 * Only clear if now > token.expireAt
 * @param authType
 * @param defer
 * @returns
 */
export const clearExpiredToken = (authType: AuthType): E.Effect<void, never, Storage> => {
  const key = buildKey(authType)

  const effect = E.gen(function* (_) {
    const storage = yield* _(Storage)
    const item = yield* _(O.fromNullable(storage.getItem(key)))
    const token = yield* _(expandToken(authType)(item))

    if (token.expireAt < Date.now()) {
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

export const clearExpiredTokens: E.Effect<void, never, Storage> = E.all([
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
    const context = yield* _(E.context<Storage>())

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
