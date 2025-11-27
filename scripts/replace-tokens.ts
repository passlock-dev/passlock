import { fileURLToPath } from 'node:url'

import { replaceCodeTokens } from './replace-code-tokens.js'
import { replaceReadmeTokens } from './replace-readme-tokens.js'

if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv[2]) {
  console.log(`Replacing ${process.argv[2]} tokens`)
  await replaceReadmeTokens(process.argv[2])
  await replaceCodeTokens(process.argv[2])
}
