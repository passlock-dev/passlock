import * as rt from '@qetza/replacetokens'
import kleur from 'kleur'
import path from 'node:path'

import { STATIC_VARS, disableConsole, getPackageDir, restoreConsole } from './common.js'

export const replaceCodeTokens = async (thisFilePath: string) => {
  // Replace the tokens
  const LATEST = process.env['LATEST']
  if (!LATEST) {
    console.error(kleur.red('Please set LATEST env variable'))
    process.exit(-1)
  }

  const packageDirPath = getPackageDir(thisFilePath)
  const distPath = path.resolve(packageDirPath, './dist')

  const vars = {
    ...STATIC_VARS,
    LATEST: LATEST,
  } as Record<string, string>

  // Replace tokens in dist/version.{js.ts}
  console.log('Replacing tokens in dist directory')

  const _console = disableConsole()
  const count = await rt.replaceTokens(
    path.resolve(distPath, './*.{js,ts}'),
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
    console.log(kleur.yellow(`Replaced ${count.replaced} tokens in dist directory`))
  } else {
    console.log(kleur.green(`Replaced ${count.replaced} tokens in dist directory`))
  }
}
