import { Headers, type HeadersInit } from "@effect/platform-node/Undici"
import { Array, Option, pipe } from "effect"

export const getHeaderValue = (headers: HeadersInit, header: string): string | null => {
  if (headers instanceof Headers) {
    return headers.get(header)
  }

  if (Array.isArray(headers)) {
    return pipe(
      Array.findFirst(headers, ([k]) => k === header),
      Option.map(([_, v]) => v),
      Option.getOrNull
    )
  }

  return headers["authorization"] ?? null
}
