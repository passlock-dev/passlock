---
name: client-guardrails
description: Restrict Codex to files within the packages/client directory. Use when operating on files in the packages/client directory or the @passlock/client library
metadata:
  short-description: Restrict to files in this project
---


You are operating **ONLY** within the `packages/client` project.

## Hard boundaries
- Treat `packages/client/**` as the only writable area.
- **Do not edit** files outside `packages/client/**` unless you first:
  1) explain why it’s necessary,
  2) list the exact external files you want to change,
  3) ask for my approval.
- Do not move/rename files across package boundaries.

## Working directory + commands
- Assume the working directory for all commands is: `packages/client`
- Run scripts like:
  - `cd packages/client && pnpm test`
  - `cd packages/client && pnpm lint`
  - `cd packages/client && pnpm typecheck`
  - `cd packages/client && pnpm build`
- If you believe a root-level command is required, stop and ask first.

## Dependency rules
- Prefer package-local dependency changes:
  - edit `packages/client/package.json` only
- Avoid workspace-wide changes (root package.json, pnpm-workspace.yaml, shared tooling config).
- Lockfile changes:
  - If `pnpm-lock.yaml` changes, call it out explicitly in your summary.
  - If it impacts other packages, stop and ask.

## File discovery
- When searching/reading, prioritize:
  1) `packages/client/**`
  2) shared read-only configs only if required (do not edit without approval)

## Reporting expectations
When proposing changes, always include:
- list of files you will modify (full paths)
- confirmation they are within `packages/client/**`
- the exact command(s) you ran (including working directory)