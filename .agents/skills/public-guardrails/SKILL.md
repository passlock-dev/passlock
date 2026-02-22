---
name: public-guardrails
description: Restrict Codex to files within the Passlock public monorepo (current repository). Use when starting a new agent session in the public pnpm monorepo or when repository-scope guardrails are needed.
metadata:
  short-description: Restrict to files in this repo
---

This is a **pnpm workspace monorepo** with independent projects under `packages/*` and `examples/*`.

## Repo boundary (critical)
- Only operate within the **current repository working tree** (the directory containing this `SKILL.md` and its `.git` folder).
- **Never read, write, or run commands** in parent directories or sibling checkouts.
- Do not modify any files outside this repository (including `~`, other repos, global config, or system files).
- If an instruction suggests editing anything outside the repo, **stop and ask for approval**.

## Precedence (important)
- If a `SKILL.md` exists inside a package directory (e.g. `packages/client/.codex/skills/client-guardrails/SKILL.md`), **it overrides this root file**.
- Before making changes, identify the target package and **read that package’s `SKILL.md`**.

## Monorepo safety rules
- Treat each `packages/<name>` directory as an isolated project.
- Do **not** modify multiple packages unless explicitly requested.
- Do **not** edit workspace-level files without approval:
  - root `package.json`
  - `pnpm-workspace.yaml`
  - root tooling config (eslint/prettier/tsconfig/biome/etc) unless the task explicitly requires it
- Lockfile policy:
  - Avoid changing `pnpm-lock.yaml` unless dependency changes are required.
  - If a change would affect other packages, **stop and ask** before proceeding.

## Running commands
- Prefer running commands inside the target package directory:
  - `cd packages/<target> && pnpm <script>`
- If a task requires root execution (rare), explain why and ask first.

## Cross-package references
- If you discover relevant code outside the target package:
  - Summarize what you found (paths + key details)
  - Do **not** edit outside the target package without explicit approval.

## Working style
- Prefer minimal, focused diffs.
- Preserve existing formatting and project conventions.
- Do not invent filenames, directories, or package names.
- If you are unsure where a change belongs, ask before writing.  
