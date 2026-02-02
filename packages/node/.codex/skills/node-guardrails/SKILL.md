---
name: node-guardrails
description: Restrict Codex to files within the packages/node directory. Use when operating on files in the packages/node directory or the @passlock/node library
metadata:
  short-description: Restrict to files in this project
---

You are operating **ONLY** within the `packages/node` project.

## Hard boundaries
- Treat `packages/node/**` as the only writable area.
- **Do not edit** files outside `packages/node/**` unless you first:
  1) explain why it’s necessary,
  2) list the exact external files you want to change,
  3) ask for my approval.
- Do not move/rename files across package boundaries.

## Working directory + commands
- Assume the working directory for all commands is: `packages/node`
- Run scripts like:
  - `cd packages/node && pnpm test`
  - `cd packages/node && pnpm lint`
  - `cd packages/node && pnpm typecheck`
  - `cd packages/node && pnpm build`
- If you believe a root-level command is required, stop and ask first.

## Dependency rules
- Prefer package-local dependency changes:
  - edit `packages/node/package.json` only
- Avoid workspace-wide changes (root package.json, pnpm-workspace.yaml, shared tooling config).
- Lockfile changes:
  - If `pnpm-lock.yaml` changes, call it out explicitly in your summary.
  - If it impacts other packages, stop and ask.

## File discovery
- When searching/reading, prioritize:
  1) `packages/node/**`
  2) shared read-only configs only if required (do not edit without approval)

## Reporting expectations
When proposing changes, always include:
- list of files you will modify (full paths)
- confirmation they are within `packages/node/**`
- the exact command(s) you ran (including working directory)