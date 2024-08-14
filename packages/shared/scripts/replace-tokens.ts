import { fileURLToPath } from "node:url"
import { buildReadme } from "./replace-readme-tokens.js"
import { replaceVersionToken } from "./replace-code-tokens.js"

// see https://stackoverflow.com/a/60309682
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	await buildReadme(import.meta.url)
	console.log()
	await replaceVersionToken(import.meta.url)
}