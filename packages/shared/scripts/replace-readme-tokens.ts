import * as rt from '@qetza/replacetokens'
import kleur from 'kleur'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  STATIC_VARS,
  copy,
  disableConsole,
  exists,
  getPackageDir,
  restoreConsole,
} from './common.js'

export const replaceReadmeTokens = async (pathRelativeToRoot: string) => {
  console.log(kleur.yellow('Copying README.template.md to README.md'))
  const packageDirPath = getPackageDir(pathRelativeToRoot)

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
    },
  )
  restoreConsole(_console)

  if (count.replaced === 0) {
    console.log(kleur.yellow(`Replaced ${count.replaced} tokens in README.md`))
  } else {
    console.log(kleur.green(`Replaced ${count.replaced} tokens in README.md`))
  }
}

export const replaceDocsReadmeTokens = async (pathRelativeToRoot: string) => {
  const packageDirPath = getPackageDir(pathRelativeToRoot)

  // Copy README.template.md to README.md and replace tokens
  const readmeTemplate = path.resolve(packageDirPath, './docs/README.template.md')
  const readme = path.resolve(packageDirPath, './docs/README.md')

  if (!exists(readmeTemplate)) return

  console.log(kleur.yellow('Copying docs/README.template.md to docs/README.md'))
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
    },
  )
  restoreConsole(_console)

  if (count.replaced === 0) {
    console.log(kleur.yellow(`Replaced ${count.replaced} tokens in README.md`))
  } else {
    console.log(kleur.green(`Replaced ${count.replaced} tokens in README.md`))
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv[2]) {
  console.log(`Replacing ${process.argv[2]} tokens`)
  await replaceReadmeTokens(process.argv[2])
  await replaceDocsReadmeTokens(process.argv[2])
}
