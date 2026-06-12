## Overview

This is the public Passlock PNPM monorepo. It contains the public client libraries and sample projects. Most packages here are intended for public distribution, including publication to npm.

The sibling private repository exists at `../private`.

## Package map

Key packages in this repo:

- `packages/browser` — browser/device SDK
- `packages/server` — server-side SDK
- `packages/cli` — developer CLI
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
- You may write generated public API documentation to `../private/packages/public-api-docs`.
- Do not modify, create, delete, or stage other files outside this repository without permission.
- Do not copy private implementation details, secrets, credentials, or internal-only code into this public repository.
- Use `../private` for verification, not for guessing product intent from incomplete internal implementation details.

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
- Some packages use composite TypeScript configs, but there is no root TypeScript project-reference graph. Check the target package's `tsconfig*.json` files before assuming cross-package build behaviour.
- If a PNPM dependency is shared across multiple projects, prefer PNPM catalog entries in `pnpm-workspace.yaml` and use `"catalog:"` in `package.json`.

## Running commands

- Prefer running commands inside the target package directory:
  - `cd packages/<target> && pnpm <script>`
- If a task requires PNPM root execution, explain why before doing so.

## Language and style

- Language of choice: TypeScript
- Prefer a functional style where practical
- Wherever possible, use the Effect framework
- Aim for concise, but legible code
- Adopt the DRY principle, refactor existing code if it makes sense
- Preserve existing formatting and conventions
- Do not invent filenames, directories, or package names
- If unsure where a change belongs, ask before writing

## Design specifications

- Large feature implementations or refactorings should first be documented as a design spec.
- Specifications live in ../private/audit/design-specs/
- The spec ID is a unique 4 digit identifier e.g. `0001`
- Specification files are named `{id}-{title}.md`
- When asked to implement a design specification, follow the relevant spec.
 
## Validation

The root `package.json` is mainly release/readme tooling. Validation scripts usually live in the target package directory.

Common package-level scripts include; check the target package's `package.json` before running them:

- `pnpm run build`
- `pnpm run typecheck`
- `pnpm run clean:all`
- `pnpm run build:clean`
- `pnpm run test:unit`
- `pnpm run test:integration`
- `pnpm run test:all`
- `pnpm run format`
- `pnpm run lint:fix`

After making code changes, run `pnpm run typecheck` in the affected project.

[effect]: https://effect.website/docs
