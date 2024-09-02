#!/usr/bin/env node
import {
  cancel,
  confirm,
  intro,
  isCancel,
  note,
  outro,
  select,
  spinner,
  text,
} from '@clack/prompts'
import { exec } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import util from 'node:util'

const execSync = util.promisify(exec)

const copy = async (from: string, to: string) => {
  const modulePath = fileURLToPath(import.meta.url)
  const templateDir = path.join(path.dirname(modulePath), from)
  const destinationDir = path.join(process.cwd(), to)
  fs.cpSync(templateDir, destinationDir, { recursive: true })
}

const outroNote =
  `Don't forget to update your .env file with real settings!` +
  `\n\nStart the dev server:\n` +
  `pnpm run dev` +
  `\n\nIssues:\n` +
  `https://github.com/passlock-dev/ts-clients/issues`

async function main() {
  console.log()

  intro(`Welcome to the Passlock SvelteKit wizard 🚀`)

  // create the project
  const dir = await text({
    message: 'Where should I create your project?',
    placeholder: '(press Enter to use the current directory)',
  })

  if (isCancel(dir)) {
    cancel('Operation cancelled.')
    return process.exit(0)
  }

  const cwd = dir || '.'

  // check if directory is empty
  if (fs.existsSync(cwd)) {
    if (fs.readdirSync(cwd).length > 0) {
      const shouldContinue = await confirm({
        message: 'Directory not empty. Continue?',
        initialValue: false,
      })

      if (isCancel(shouldContinue)) {
        cancel('Operation cancelled.')
        return process.exit(0)
      }

      if (!shouldContinue) {
        return process.exit(1)
      }
    }
  }

  const uiFramework = await select({
    message: 'Choose a template.',
    options: [
      {
        value: 'preline',
        label: 'Preline CSS',
        hint: 'Prisma, Lucia, Preline & Superforms',
      },
      {
        value: 'daisy',
        label: 'Daisy UI',
        hint: 'Prisma, Lucia, Daisy UI & Superforms',
      },
      {
        value: 'shadcn',
        label: 'Shadcn/ui',
        hint: 'Prisma, Lucia, Shadcn/ui (Svelte fork) & Superforms',
      },
    ],
    initialValue: 'preline',
  })

  if (isCancel(uiFramework)) {
    cancel('Operation cancelled.')
    return process.exit(0)
  }

  // copy the template
  await copy('../templates/common', cwd)
  await copy(`../templates/${uiFramework}`, cwd)

  // npm ignores `.gitignore` so rename it
  fs.renameSync(path.join(cwd, 'ignore'), path.join(cwd, '.gitignore'))

  // ask to install dependencies
  const dependencies = await confirm({
    message: 'Install dependencies? (requires pnpm)',
  })

  if (isCancel(dependencies)) {
    cancel('Operation cancelled.')
    return process.exit(0)
  }

  if (dependencies) {
    const s = spinner()
    s.start('Installing dependencies...')

    try {
      await execSync('pnpm i', { cwd })
    } catch {
      console.log()
      console.log('📦️ pnpm is required:')
      console.log('npm i -g pnpm')
      return process.exit(0)
    }

    s.stop('Installed dependencies.')
  }

  // ask to setup prisma
  const prisma = await confirm({
    message: 'Setup Sqlite dev database? (requires pnpm)',
  })

  if (isCancel(prisma)) {
    cancel('Operation cancelled.')
    return process.exit(0)
  }

  if (prisma) {
    const s = spinner()
    s.start('Creating Sqlite database...')

    try {
      await execSync('pnpm run prisma:migrate', { cwd })
    } catch {
      console.log()
      console.log('📦️ pnpm is required:')
      console.log('npm i -g pnpm')
      return process.exit(0)
    }

    s.stop('Database created.')
  }

  note(outroNote, 'Important')

  outro('Done. 👌')
}

main().catch(console.error)
