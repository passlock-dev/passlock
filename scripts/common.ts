import fs from 'node:fs'
import util from 'node:util'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { exec } from 'node:child_process'

export const STATIC_VARS = {
  PASSLOCK_SITE: 'https://passlock.dev',
  DEMO: 'https://passlock.dev/#demo',
  GITHUB_REPO: 'https://github.com/passlock-dev/passlock',
  DOCS: 'https://passlock.dev',
  TUTORIAL: 'https://passlock.dev/getting-started/',
  PASSLOCK_LOGO: 'https://passlock-assets.b-cdn.net/images/passlock-logo.svg',
  ASSETS: 'https://passlock-assets.b-cdn.net',
} as Record<string, string>

// no-op the console methods
// but return references to the originals
export const disableConsole = () => {
  const _console = {
    log: console.log,
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  }

  console.log = () => {}
  console.debug = () => {}
  console.info = () => {}
  console.error = () => {}
  console.warn = () => {}

  return _console
}

// callers should pass something like packages/shared
export const getPackageDir = (pathRelativeToRoot: string) => {
  const thisFile = fileURLToPath(import.meta.url)
  const projectRoot = path.resolve(thisFile, '../..')
  return path.resolve(projectRoot, pathRelativeToRoot)
}

export const restoreConsole = (_console: ReturnType<typeof disableConsole>) => {
  console.log = _console.log
  console.debug = _console.debug
  console.info = _console.info
  console.error = _console.error
  console.warn = _console.warn
}

export const exists = (path: string) => fs.existsSync(path)

export const deleteDir = (dir: string) => {
  if (!fs.existsSync(dir)) return
  fs.rmSync(dir, { recursive: true })
}

export const copy = (from: string, to: string) => {
  fs.cpSync(from, to, { recursive: true })
}

export const execSync = util.promisify(exec)
