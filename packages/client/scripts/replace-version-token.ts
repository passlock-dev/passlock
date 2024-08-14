import * as rt from '@qetza/replacetokens'
import path from 'node:path'
import { deleteDir, disableConsole, execSync, packageDirPath, restoreConsole, STATIC_VARS } from './common.js'
import { fileURLToPath } from 'node:url'
import { buildReadme } from './build-readme.js'

export const replaceVersionToken = async() => {
	// Replace the tokens
	const LATEST = process.env['LATEST']
	if (!LATEST) {
		console.error('Please set LATEST env variable')
		process.exit(-1)
	}

	// Delete dist
	console.log('Deleting dist/')
	const distPath = path.resolve(packageDirPath, './dist')
	deleteDir(distPath)

	// Build the code, writing to dist/
	// NOTE: tsconfig.build.json ignores the scripts directory
	console.log('Building code using tsconfig.build.json')
	const { stdout, stderr } = await execSync('pnpm exec tsc --project tsconfig.build.json', { cwd: packageDirPath })
	if (stdout) console.log(stdout)
	if (stderr) console.error(stderr)

	const vars = {
		...STATIC_VARS,
		LATEST: LATEST,
	} as Record<string, string>

	// Replace tokens in dist/version.{d.ts,js}
	console.log("Replacing tokens in dist/")
	const version = path.resolve(distPath, "./version.*")

	const _console = disableConsole()
	const count = await rt.replaceTokens(
		version,
		(name: string) => {
			return vars[name] || ''
		},
		{
			recursive: true,
			transforms: { enabled: true },
		}
	);
	restoreConsole(_console)

	console.log(`Replaced ${count.replaced} tokens in dist/version.*`)
}

// see https://stackoverflow.com/a/60309682
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	await buildReadme()
	console.log()
	await replaceVersionToken()
}