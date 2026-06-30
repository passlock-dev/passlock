---
name: version-workspace-packages
description: Prepare a new version release for a PNPM workspace that keeps packages and demos on one shared version. Use when Codex needs to inspect CHANGELOG.md, ask whether the next release is major, minor, or patch, create a versioned changelog entry from the Unreleased section, recreate an empty Unreleased section, and update workspace package.json versions and workspace dependency ranges.
metadata:
  short-description: Bump the package versions
  internal: true
---

# Version Workspace Packages

## Workflow

Use this skill to prepare a workspace release version, including demo/example packages.

1. Inspect the repository root `CHANGELOG.md`.
2. Find the latest published version from the first non-`Unreleased` heading like `## [2.6.0] - 2026-06-10`.
3. Ask the user whether the bump is `major`, `minor`, or `patch`. Do not infer this silently.
4. Run `scripts/version_workspace_packages.py` from this skill at the repository root with the selected bump:

   ```bash
   python3 scripts/version_workspace_packages.py --bump patch
   ```

5. Review the diff. Confirm that:
   - `CHANGELOG.md` has a fresh `## [Unreleased]` section.
   - The previous Unreleased content moved into `## [x.y.z] - YYYY-MM-DD`.
   - Root and workspace `package.json` files use the new version.
   - Internal workspace dependency ranges like `workspace:^old.version` use the new version.
6. Run validation appropriate to the affected packages. For the Passlock public monorepo, run package-level `pnpm run typecheck` in affected package directories when code changes are part of the release prep. For version-only release prep, do not run root-level validation unless the user asks.

## Script Behavior

The script is intentionally conservative:

- It must run from a repository root containing `CHANGELOG.md`.
- It reads the latest published version from `CHANGELOG.md`, not from `package.json`.
- It requires `--bump major|minor|patch`.
- It writes today's date using the local system date unless `--date YYYY-MM-DD` is provided.
- It updates the root `package.json` plus package manifests matched by `pnpm-workspace.yaml` package globs.
- It updates each package's own `version` field when present.
- It updates `workspace:` dependency ranges that contain a semver version, preserving the range prefix, for example `workspace:^2.6.0` becomes `workspace:^2.6.1`.

Use `--dry-run` first when the repository layout is unfamiliar.
