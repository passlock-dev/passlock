---
name: public-guardrails
description: Restrict Codex to files within the Passlock public monorepo (current workspace). Use when starting a new agent session in the public pnpm monorepo or when workspace-scope guardrails are needed.
metadata:
  short-description: Restrict to files in this repo
---

# Passlock Private Workspace Guardrails

## Scope and safety
- Only create, modify, move, or delete files that are visible in the currently open VS Code workspace.
- Treat the workspace root as the project root.
- Never create, move, or modify files under `/private` or any path not present in this workspace.
- Do not assume files or directories exist unless you can see them in the workspace.
- If information or changes outside this workspace are required, ask the user to open the correct workspace.

## Working style
- Prefer minimal, focused diffs.
- Preserve existing formatting and project conventions.
- Do not invent filenames, directories, or package names.
- If you are unsure where a change belongs, ask before writing.

## Tooling assumptions
- Use pnpm for package management.
- Run commands from the relevant package root e.g. packages/core or packages/api unless told otherwise.
- If a command would affect files outside this workspace, stop and ask first.

## Pre-change checks
- Confirm target files exist in this workspace before editing.
- If a task could cross workspace boundaries, pause and ask for clarification.
