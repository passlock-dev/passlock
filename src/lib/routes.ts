/**
 * Please see https://github.com/sveltejs/kit/issues/647#issuecomment-2136031840
 * Credit to https://github.com/david-plugge
 */

import { resolveRoute } from '$app/paths'
import type RouteMetadata from '../../.svelte-kit/types/route_meta_data.json'
type RouteMetadata = typeof RouteMetadata

type Prettify<T> = { [K in keyof T]: T[K] } & {}
type ParseParam<T extends string> = T extends `...${infer Name}` ? Name : T

type ParseParams<T extends string> = T extends `${infer A}[[${infer Param}]]${infer B}`
  ? ParseParams<A> & { [K in ParseParam<Param>]?: string } & ParseParams<B>
  : T extends `${infer A}[${infer Param}]${infer B}`
    ? ParseParams<A> & { [K in ParseParam<Param>]: string } & ParseParams<B>
    : {}

type RequiredKeys<T extends object> = keyof {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [P in keyof T as {} extends Pick<T, P> ? never : P]: 1
}

export type RouteId = keyof RouteMetadata

export type Routes = {
  [K in RouteId]: Prettify<ParseParams<K>>
}

/**
 * @param options routeId, optional params, query and hash
 * @example route({ routeId: '/user/:id', params: { id: '1' } })
 * @returns
 */
export const route = <T extends keyof Routes>(
  options: {
    routeId: T
    query?: string | Record<string, string> | URLSearchParams | string[][]
    hash?: string
  } & (RequiredKeys<Routes[T]> extends never ? { params?: Routes[T] } : { params: Routes[T] })
) => {
  const path = resolveRoute(options.routeId, options.params ?? {})
  const search = options.query && new URLSearchParams(options.query).toString()
  return path + (search ? `?${search}` : '') + (options.hash ? `#${options.hash}` : '')
}

export const app = route({ routeId: '/(app)/app' })
export const login = route({ routeId: '/(other)/login' })
export const logout = route({ routeId: '/(other)/logout' })

export const verifyEmailLink = route({ routeId: '/(other)/verify-email/link' })
export const verifyEmailCode = route({ routeId: '/(other)/verify-email/code' })
export const verifyEmailAwaitLink = route({ routeId: '/(other)/verify-email/awaiting-link' })
