import * as rt from '@qetza/replacetokens'
import path from 'node:path'
import { deleteDir, disableConsole, execSync, getPackageDir, restoreConsole, STATIC_VARS } from './common.js'

export type Options = { skipBuild: boolean }
export const replaceCodeTokens = async(thisFilePath: string, options: Options = { skipBuild: false }) => {
	// Replace the tokens
	const LATEST = process.env['LATEST']
	if (!LATEST) {
		console.error('Please set LATEST env variable')
		process.exit(-1)
	}

	const packageDirPath = getPackageDir(thisFilePath)
	const distPath = path.resolve(packageDirPath, './dist')

	// Delete dist
	if (options.skipBuild) {
		console.log("Skipping build (assume it was handled elsewhere)")
	} else {
		console.log('Deleting dist directory')
		deleteDir(distPath)

		// Build the code, writing to dist/
		// NOTE: tsconfig.build.json ignores the scripts directory
		console.log('Building code using tsconfig.build.json')
		const { stdout, stderr } = await execSync('pnpm exec tsc --project tsconfig.build.json', { cwd: packageDirPath })
		if (stdout) console.log(stdout)
		if (stderr) console.error(stderr)
	}

	const vars = {
		...STATIC_VARS,
		LATEST: LATEST,
	} as Record<string, string>

	// Replace tokens in dist/version.{js.ts}
	console.log("Replacing tokens in dist directory")

	const _console = disableConsole()
	const count = await rt.replaceTokens(
		path.resolve(distPath, './*.{js,ts}'),
		(name: string) => {
			return vars[name] || ''
		},
		{
			recursive: true,
			transforms: { enabled: true },
		}
	);
	restoreConsole(_console)

	console.log(`Replaced ${count.replaced} tokens in dist directory`)
}