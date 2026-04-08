const isProd = process.env.NODE_ENV === "production"

const warnedKey = Symbol.for("passlock.node.deprecation.warned")

type GlobalWithWarnFlag = typeof globalThis & {
  [warnedKey]?: boolean
}

const g = globalThis as GlobalWithWarnFlag

if (!isProd && !g[warnedKey]) {
  g[warnedKey] = true

  console.warn(
    "[DEPRECATED] @passlock/node has been renamed to @passlock/server. Please update your imports."
  )
}
