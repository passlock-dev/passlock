import * as rt from '@qetza/replacetokens'
import path from 'node:path'
import { copy, disableConsole, getPackageDir, restoreConsole, STATIC_VARS } from './common.js'
import { fileURLToPath } from 'node:url'
import kleur from 'kleur'

export const replaceReadmeTokens = async (thisFileUrl: string) => {
	console.log(kleur.yellow("Copying README.template.md to README.md"))
	const packageDirPath = getPackageDir(thisFileUrl)

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

	if (count.replaced === 0) {
		console.log(kleur.yellow(`Replaced ${count.replaced} tokens in README.md`))
	} else {
		console.log(kleur.green(`Replaced ${count.replaced} tokens in README.md`))
	}
	
}

// see https://stackoverflow.com/a/60309682
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	console.log('Replacing packages/shared tokens')
	await replaceReadmeTokens(import.meta.url)
}