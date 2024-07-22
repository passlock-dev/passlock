/**
 * Because { a: string, b: undefined } !== { a: string }
 * Usage: { a: "a", ...(copyIfDefined(source, 'b')) }
 *
 * @param input
 * @param field
 * @returns
 */
export const copyIfDefined = <T extends object>(input: T, field: keyof T) => {
  return {
    ...(input[field] && { [field]: input[field] }),
  }
}

/* eslint-disable */
type Undefined<T> = T extends null
  ? undefined
  : T extends (infer U)[]
    ? Undefined<U>[]
    : T extends Record<string, unknown>
      ? { [K in keyof T]: Undefined<T[K]> }
      : T

export const nullsToUndefined = <T>(obj: T): Undefined<T> => {
  if (obj === null || obj === undefined) {
    return undefined as any
  }

  if ((obj as any).constructor.name === 'Object' || Array.isArray(obj)) {
    for (const key in obj) {
      obj[key] = nullsToUndefined(obj[key]) as any
    }
  }

  return obj as any
}
/* eslint-enable */
