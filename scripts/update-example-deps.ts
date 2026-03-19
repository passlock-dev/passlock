// scripts/update-example-deps.ts
// CODEX generated 

import { readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

type PackageJson = {
  name?: string
  version?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, "..")

const packagesToSync = [
  {
    packageName: "@passlock/client",
    sourcePackageJsonPath: path.join(repoRoot, "packages/client/package.json"),
  },
  {
    packageName: "@passlock/server",
    sourcePackageJsonPath: path.join(repoRoot, "packages/server/package.json"),
  },
] as const

const examplesRoot = path.join(repoRoot, "examples")

async function readJson<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath, "utf8")
  return JSON.parse(content) as T
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await readFile(filePath, "utf8")
    return true
  } catch {
    return false
  }
}

function updateRange(
  deps: Record<string, string> | undefined,
  packageName: string,
  version: string,
): boolean {
  if (!deps || !(packageName in deps)) {
    return false
  }

  const next = `^${version}`
  if (deps[packageName] === next) {
    return false
  }

  deps[packageName] = next
  return true
}

async function getPublishedVersions(): Promise<Record<string, string>> {
  const result: Record<string, string> = {}

  for (const pkg of packagesToSync) {
    const packageJson = await readJson<PackageJson>(pkg.sourcePackageJsonPath)

    if (!packageJson.version) {
      throw new Error(`No version found in ${pkg.sourcePackageJsonPath}`)
    }

    result[pkg.packageName] = packageJson.version
  }

  return result
}

async function getExamplePackageJsonPaths(): Promise<string[]> {
  const entries = await readdir(examplesRoot, { withFileTypes: true })
  const results: string[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const packageJsonPath = path.join(examplesRoot, entry.name, "package.json")
    if (await fileExists(packageJsonPath)) {
      results.push(packageJsonPath)
    }
  }

  return results
}

async function updateExamplePackage(
  packageJsonPath: string,
  versions: Record<string, string>,
): Promise<{ changed: boolean; updates: string[] }> {
  const packageJson = await readJson<PackageJson>(packageJsonPath)
  const updates: string[] = []

  for (const [packageName, version] of Object.entries(versions)) {
    const changed =
      updateRange(packageJson.dependencies, packageName, version) ||
      updateRange(packageJson.devDependencies, packageName, version) ||
      updateRange(packageJson.peerDependencies, packageName, version)

    if (changed) {
      updates.push(`${packageName} -> ^${version}`)
    }
  }

  if (!updates.length) {
    return { changed: false, updates: [] }
  }

  await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8")
  return { changed: true, updates }
}

async function main(): Promise<void> {
  const versions = await getPublishedVersions()
  const examplePackageJsonPaths = await getExamplePackageJsonPaths()

  if (!examplePackageJsonPaths.length) {
    console.warn(`No example package.json files found under ${examplesRoot}`)
    return
  }

  let changedCount = 0

  for (const packageJsonPath of examplePackageJsonPaths) {
    const result = await updateExamplePackage(packageJsonPath, versions)

    if (!result.changed) {
      console.log(`No changes: ${path.relative(repoRoot, packageJsonPath)}`)
      continue
    }

    changedCount += 1
    console.log(`Updated ${path.relative(repoRoot, packageJsonPath)}`)
    for (const update of result.updates) {
      console.log(`  ${update}`)
    }
  }

  console.log("")
  console.log(`Done. Updated ${changedCount} example package(s).`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
