import { fileURLToPath } from 'node:url'

import { replaceCodeTokens } from '@passlock/shared/scripts/replace-code-tokens.js'
import { replaceReadmeTokens } from '@passlock/shared/scripts/replace-readme-tokens.js'

// see https://stackoverflow.com/a/60309682
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('Replacing packages/client tokens')
  await replaceReadmeTokens(import.meta.url)
  await replaceCodeTokens(import.meta.url)
}
