import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import util from 'node:util'
import { exec } from 'node:child_process'

export const STATIC_VARS = {
	PASSLOCK_SITE: 'https://passlock.dev',
	GITHUB_REPO: 'https://github.com/passlock-dev/passlock',
	DEMO_SITE: 'https://d1rl0ue18b0151.cloudfront.net',
	DOCS: 'https://docs.passlock.dev',
	TUTORIAL: 'https://docs.passlock.dev/docs/tutorial/introduction',
	PASSLOCK_LOGO: 'https://github.com/passlock-dev/passkeys-frontend/assets/208345/53ee00d3-8e6c-49ea-b43c-3f901450c73b'
} as Record<string, string>

// no-op the console methods
// but return references to the originals
export const disableConsole = () => {
	const _console = {
		log: console.log,
		debug: console.debug,
		info: console.info,
		warn: console.warn,
		error: console.error
	}

	console.log = () => { }
	console.debug = () => { }
	console.info = () => { }
	console.error = () => { }
	console.warn = () => { }

	return _console
}

export const restoreConsole = (_console: ReturnType<typeof disableConsole>) => {
	console.log = _console.log
	console.debug = _console.debug
	console.info = _console.info
	console.error = _console.error
	console.warn = _console.warn
}

const thisFilePath = fileURLToPath(import.meta.url)
export const packageDirPath = path.resolve(path.dirname(thisFilePath), '../')

export const deleteDir = (dir: string) => {
	const resolvedDir = path.resolve(packageDirPath, dir)
	if (!fs.existsSync(resolvedDir)) return
	fs.rmSync(resolvedDir, { recursive: true })
}

export const copy = (from: string, to: string) => {
	const resolvedDir = path.resolve(packageDirPath, from)
	const destinationDir = path.resolve(process.cwd(), to)
	fs.cpSync(resolvedDir, destinationDir, { recursive: true })
}

export const execSync = util.promisify(exec)