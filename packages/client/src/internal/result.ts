/**
 * Result envelope applied to successful values returned from
 * `@passlock/client/safe`.
 *
 * The top-level object still exposes its original `_tag`, so
 * existing `_tag` checks and type guards continue to work, while
 * `success` and `failure` provide boolean branch narrowing.
 */
export type Ok<T extends object> = T & {
  readonly success: true
  readonly failure: false
  readonly value: T
}

/**
 * Result envelope applied to expected error values returned from
 * `@passlock/client/safe`.
 *
 * The top-level object still exposes its original `_tag`, so
 * existing `_tag` checks and type guards continue to work, while
 * `success` and `failure` provide boolean branch narrowing.
 */
export type Err<E extends object> = E & {
  readonly success: false
  readonly failure: true
  readonly error: E
}

/**
 * Result envelope used by the `@passlock/client/safe` entrypoint.
 */
export type Result<T extends object, E extends object> =
  | Ok<T>
  | (E extends unknown ? Err<E> : never)

const hasOwnProperty = (payload: object, property: PropertyKey): boolean =>
  Object.prototype.hasOwnProperty.call(payload, property)

const toSelfAccessor = <T extends object>(payload: T) => ({
  configurable: false,
  enumerable: false,
  get: (): T => payload,
})

const decorate = <
  T extends object,
  Success extends boolean,
  Key extends "value" | "error",
>(
  payload: T,
  success: Success,
  key: Key
): T => {
  const descriptors: PropertyDescriptorMap = {}

  if (!hasOwnProperty(payload, "success")) {
    descriptors.success = {
      configurable: false,
      enumerable: false,
      value: success,
      writable: false,
    }
  }

  if (!hasOwnProperty(payload, "failure")) {
    descriptors.failure = {
      configurable: false,
      enumerable: false,
      value: !success,
      writable: false,
    }
  }

  if (!hasOwnProperty(payload, key)) {
    descriptors[key] = toSelfAccessor(payload)
  }

  if (Object.keys(descriptors).length > 0) {
    Object.defineProperties(payload, descriptors)
  }

  return payload
}

export const toOkResult = <T extends object>(payload: T): Ok<T> =>
  decorate(payload, true, "value") as Ok<T>

export const toErrResult = <E extends object>(payload: E): Err<E> =>
  decorate(payload, false, "error") as Err<E>
