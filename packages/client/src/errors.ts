export const isTagged =
  <A extends { _tag: string }>(tag: A["_tag"]) =>
  (payload: unknown): payload is A => {
    if (typeof payload !== "object") return false
    if (payload === null) return false

    if (!("_tag" in payload)) return false
    if (typeof payload._tag !== "string") return false
    if (payload._tag !== tag) return false

    return true
  }
