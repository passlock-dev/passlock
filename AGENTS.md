## Overview

This is the public Passlock PNPM monorepo. It contains the public client libraries and sample projects. Most packages here are intended for public distribution, including publication to npm.

The sibling private repository exists at `../private`.

## Package map

Key packages in this repo:

- `packages/client` — browser/client SDK
- `packages/server` — server-side SDK
- `packages/cli` — developer CLI
- `packages/node` — deprecated
- `examples/sveltekit` — reference example app

Root config includes files such as `biome.json`.

## Relationship to the private repo

The private repo at `../private` contains the Passlock cloud/backend implementation, including the REST APIs and related internal packages.

Useful private packages include:

- `packages/core`
- `packages/api`
- `packages/console`
- `packages/eventbus`
- `packages/website`

## Repository boundary rules

- You may modify files only inside this repository.
- You may read `../private` when necessary to verify API behaviour, endpoint names, and request/response shapes.
- Do not modify, create, delete, or stage files outside this repository.
- Do not copy private implementation details, secrets, credentials, or internal-only code into this public repository.
- Prefer an explicit handoff note or API contract as the source of truth.
- Use `../private` for verification, not for guessing product intent from incomplete internal implementation details.

## Cross-repo workflow

When a task depends on private API changes:

1. Look for a handoff note first.
2. If needed, inspect `../private` to verify:
   - endpoint paths
   - request fields
   - response fields
   - naming
   - error cases
3. Update only the relevant public package(s) and example(s).
4. Report any mismatch between the handoff note and the private implementation.

When reporting back, mention:

- which public package(s) were changed
- whether the change was verified against `../private`
- any remaining uncertainty or contract mismatch

## Monorepo rules

- Treat each `packages/<name>` directory as an isolated project.
- Do not edit workspace-level files unless the task clearly requires it:
  - root `package.json`
  - `pnpm-workspace.yaml`
  - root tooling/config files such as `tsconfig`, `biome`, eslint/prettier equivalents
- Avoid changing `pnpm-lock.yaml` unless dependency changes are required.
- If a root-level or lockfile change would affect other packages, stop and ask first.

## Project references and dependencies

- We use the PNPM workspace protocol to link packages within the monorepo.
- We use TypeScript project references.
- If a PNPM dependency is shared across multiple projects, prefer PNPM catalog entries in `pnpm-workspace.yaml` and use `"catalog:"` in `package.json`.

## Running commands

- Prefer running commands inside the target package directory:
  - `cd packages/<target> && pnpm <script>`
- If a task requires PNPM root execution, explain why before doing so.

## Language and style

- Language of choice: TypeScript
- Prefer a functional style where practical
- Wherever possible, use the Effect framework
- Prefer minimal, focused diffs
- Preserve existing formatting and conventions
- Do not invent filenames, directories, or package names
- If unsure where a change belongs, ask before writing

## Validation

Common scripts include:

- `pnpm run build`
- `pnpm run typecheck`
- `pnpm run clean:all`
- `pnpm run build:clean`
- `pnpm run test:unit`
- `pnpm run test:integration`
- `pnpm run test:all`
- `pnpm run format`
- `pnpm run lint:fix`

After making code changes, run `pnpm run build` or `pnpm run typecheck` in the affected project.

[effect]: https://effect.website/docs