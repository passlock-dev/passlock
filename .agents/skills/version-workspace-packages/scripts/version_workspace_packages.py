#!/usr/bin/env python3
"""Prepare a shared-version PNPM workspace release."""

from __future__ import annotations

import argparse
import glob
import json
import re
from datetime import date
from pathlib import Path

CHANGELOG_HEADING_RE = re.compile(
    r"^## \[(?P<label>[^\]]+)\](?: - (?P<date>\d{4}-\d{2}-\d{2}))?\s*$", re.MULTILINE
)
SEMVER_RE = re.compile(
    r"^(?P<major>0|[1-9]\d*)\.(?P<minor>0|[1-9]\d*)\.(?P<patch>0|[1-9]\d*)$"
)
WORKSPACE_VERSION_RE = re.compile(
    r"^workspace:(?P<prefix>[~^]?)(?P<version>\d+\.\d+\.\d+)$"
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bump", choices=("major", "minor", "patch"), required=True)
    parser.add_argument(
        "--root", type=Path, default=Path.cwd(), help="Workspace root. Defaults to cwd."
    )
    parser.add_argument(
        "--date", default=date.today().isoformat(), help="Release date as YYYY-MM-DD."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print planned changes without writing files.",
    )
    return parser.parse_args()


def bump_version(version: str, bump: str) -> str:
    match = SEMVER_RE.match(version)
    if not match:
        raise ValueError(f"Latest changelog version is not plain semver: {version}")

    major = int(match.group("major"))
    minor = int(match.group("minor"))
    patch = int(match.group("patch"))

    if bump == "major":
        return f"{major + 1}.0.0"
    if bump == "minor":
        return f"{major}.{minor + 1}.0"
    return f"{major}.{minor}.{patch + 1}"


def build_changelog(
    content: str, new_version: str, release_date: str
) -> tuple[str, str]:
    headings = list(CHANGELOG_HEADING_RE.finditer(content))
    if not headings:
        raise ValueError("CHANGELOG.md has no Keep a Changelog version headings.")

    unreleased = next(
        (heading for heading in headings if heading.group("label") == "Unreleased"),
        None,
    )
    if unreleased is None:
        raise ValueError("CHANGELOG.md is missing a ## [Unreleased] section.")

    published = next(
        (heading for heading in headings if SEMVER_RE.match(heading.group("label"))),
        None,
    )
    if published is None:
        raise ValueError("CHANGELOG.md has no published semver heading.")

    latest_version = published.group("label")
    next_heading_after_unreleased = next(
        (heading for heading in headings if heading.start() > unreleased.start()), None
    )
    unreleased_body_start = unreleased.end()
    unreleased_body_end = (
        next_heading_after_unreleased.start()
        if next_heading_after_unreleased
        else len(content)
    )
    unreleased_body = content[unreleased_body_start:unreleased_body_end].strip()

    release_body = f"\n\n{unreleased_body}" if unreleased_body else ""
    replacement = (
        f"## [Unreleased]\n\n## [{new_version}] - {release_date}{release_body}\n\n"
    )
    updated = (
        content[: unreleased.start()]
        + replacement
        + content[unreleased_body_end:].lstrip("\n")
    )
    return latest_version, updated


def workspace_patterns(root: Path) -> list[str]:
    workspace_path = root / "pnpm-workspace.yaml"
    if not workspace_path.exists():
        return []

    patterns: list[str] = []
    in_packages = False
    for line in workspace_path.read_text().splitlines():
        if re.match(r"^packages:\s*$", line):
            in_packages = True
            continue
        if in_packages and re.match(r"^\S", line):
            break
        match = re.match(r"^\s*-\s+['\"]?(?P<pattern>[^'\"]+)['\"]?\s*$", line)
        if in_packages and match:
            pattern = match.group("pattern")
            if not pattern.startswith("!"):
                patterns.append(pattern)
    return patterns


def package_json_paths(root: Path) -> list[Path]:
    paths = {root / "package.json"}
    for pattern in workspace_patterns(root):
        for match in glob.glob(str(root / pattern)):
            package_json = Path(match) / "package.json"
            if package_json.exists():
                paths.add(package_json)
    return sorted(paths)


def update_workspace_ranges(value: object, new_version: str) -> object:
    if isinstance(value, dict):
        return {
            key: update_workspace_ranges(child, new_version)
            for key, child in value.items()
        }
    if isinstance(value, list):
        return [update_workspace_ranges(child, new_version) for child in value]
    if isinstance(value, str):
        match = WORKSPACE_VERSION_RE.match(value)
        if match:
            return f"workspace:{match.group('prefix')}{new_version}"
    return value


def update_package_json(path: Path, new_version: str, dry_run: bool) -> bool:
    original = path.read_text()
    data = json.loads(original)

    if isinstance(data, dict) and isinstance(data.get("version"), str):
        data["version"] = new_version

    data = update_workspace_ranges(data, new_version)
    updated = json.dumps(data, indent=2, ensure_ascii=False) + "\n"

    if updated == original:
        return False
    if not dry_run:
        path.write_text(updated)
    return True


def main() -> None:
    args = parse_args()
    root = args.root.resolve()
    changelog_path = root / "CHANGELOG.md"
    if not changelog_path.exists():
        raise SystemExit(f"CHANGELOG.md not found at {changelog_path}")

    changelog = changelog_path.read_text()
    latest_version = next(
        (
            heading.group("label")
            for heading in CHANGELOG_HEADING_RE.finditer(changelog)
            if SEMVER_RE.match(heading.group("label"))
        ),
        None,
    )
    if latest_version is None:
        raise SystemExit(
            "Could not find latest published semver version in CHANGELOG.md"
        )

    new_version = bump_version(latest_version, args.bump)
    _, updated_changelog = build_changelog(changelog, new_version, args.date)

    changed_files: list[Path] = []
    if updated_changelog != changelog:
        changed_files.append(changelog_path)
        if not args.dry_run:
            changelog_path.write_text(updated_changelog)

    for path in package_json_paths(root):
        if update_package_json(path, new_version, args.dry_run):
            changed_files.append(path)

    mode = "Would update" if args.dry_run else "Updated"
    print(f"{mode} workspace from {latest_version} to {new_version}:")
    for path in changed_files:
        print(f"- {path.relative_to(root)}")


if __name__ == "__main__":
    main()
