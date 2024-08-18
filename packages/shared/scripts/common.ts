import { exec } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import util from 'node:util'

export const STATIC_VARS = {
  PASSLOCK_SITE: 'https://passlock.dev',
  GITHUB_REPO: 'https://github.com/passlock-dev/passlock',
  DEMO_SITE: 'https://d1rl0ue18b0151.cloudfront.net',
  SHADCN_DEMO_SITE: 'https://dbr4qrmypnl85.cloudfront.net',
  DOCS: 'https://docs.passlock.dev',
  TUTORIAL: 'https://docs.passlock.dev/docs/tutorial/introduction',
  PASSLOCK_LOGO:
    'https://github.com/passlock-dev/passkeys-frontend/assets/208345/53ee00d3-8e6c-49ea-b43c-3f901450c73b',
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
  const root = path.resolve(thisFile, '../../../..')
  return path.resolve(root, pathRelativeToRoot)
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
