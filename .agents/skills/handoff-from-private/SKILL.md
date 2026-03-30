---
name: handoff-from-private
description: Handle a design or coding task resulting from a scoped change in the private repo. Use this skill when updating the public Passlock repo to match a private API change.
metadata:
  short-description: Handoff from private spec
---

Use this skill when updating the public Passlock repo to match a private API change.

## Goals

- Update the relevant public package(s) and examples to match the current private API contract.
- Keep edits strictly inside the current repository.
- Use the handoff note as the primary source of truth.
- Use `../private` only for verification.

## Inputs

Expect one or more of:

- a handoff note
- a feature name
- an endpoint name
- a description of the required API/client change

## Process

1. Identify which public package(s) are affected:
   - `packages/client`
   - `packages/server`
   - `packages/cli`
   - `examples/sveltekit`

2. Read the handoff note carefully and extract:
   - endpoints
   - request fields
   - response fields
   - errors
   - breaking changes

3. If needed, inspect `../private` to verify:
   - endpoint path names
   - payload shape
   - response shape
   - error handling expectations

4. Make the smallest correct change in this repository only.

5. Update or add tests where appropriate.

6. Run package-local verification where possible:
   - `pnpm run build` or `pnpm run typecheck`
   - relevant tests

7. Report back with:
   - files changed
   - whether verification against `../private` was performed
   - any mismatch between handoff note and private implementation
   - any follow-up still needed

## Guardrails

- Never modify files outside the current repository.
- Never copy private/internal-only code into the public repository.
- Never expose secrets, credentials, or internal implementation details.
- Prefer minimal diffs.
- Ask before changing workspace-level config or lockfiles.