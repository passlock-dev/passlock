import { fileURLToPath } from 'node:url'
import { buildReadme } from '@passlock/shared/scripts/replace-readme-tokens.js'
import { replaceVersionToken } from '@passlock/shared/scripts/replace-code-tokens.js'

// see https://stackoverflow.com/a/60309682
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	await buildReadme(import.meta.url)
	console.log()
	await replaceVersionToken(import.meta.url, { skipBuild: true })
}