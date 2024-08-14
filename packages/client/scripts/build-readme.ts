import * as rt from '@qetza/replacetokens'
import path from 'node:path'
import { copy, disableConsole, packageDirPath, restoreConsole, STATIC_VARS } from './common.js'
import { fileURLToPath } from 'node:url'

export const buildReadme = async () => {
	console.log("Copying README.template.md to README.md")
	// Copy README.template.md to README.md and replace tokens
	const readmeTemplate = path.resolve(packageDirPath, './README.template.md')
	const readme = path.resolve(packageDirPath, './README.md')
	copy(readmeTemplate, readme)

	const vars = STATIC_VARS

	console.log('Replacing tokens in README.md')
	const _console = disableConsole()
	const count = await rt.replaceTokens(
		readme,
		(name: string) => {
			return vars[name] || ''
		},
		{
			recursive: true,
			transforms: { enabled: true },
		}
	);
	restoreConsole(_console)

	console.log(`Replaced ${count.replaced} tokens in README.md`)
}

// see https://stackoverflow.com/a/60309682
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	await buildReadme()
}