#!/usr/bin/env python3
from __future__ import annotations

import argparse
import fnmatch
import hashlib
import json
import shutil
import subprocess
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_NAME = ".sanitized-run-workspace.json"
SCHEMA_VERSION = 1


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def file_sha256(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def load_profile(path: Path) -> dict[str, Any]:
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError("workspace profile must be a YAML mapping")
    return data


def safe_relative(value: str) -> Path:
    path = Path(value)
    if path.is_absolute() or ".." in path.parts or value.strip() in {"", "."}:
        raise ValueError(f"workspace path must be an explicit repository-relative path: {value!r}")
    return path


def matches_any(relative_path: str, patterns: list[str]) -> bool:
    return any(fnmatch.fnmatchcase(relative_path, pattern) for pattern in patterns)


def validate_profile(profile: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if profile.get("schema_version") != SCHEMA_VERSION:
        errors.append(f"schema_version must be {SCHEMA_VERSION}")

    for key in ("workspace_id", "reference_id"):
        if not str(profile.get(key, "")).strip():
            errors.append(f"{key} is required")

    include_paths = profile.get("include_paths")
    if not isinstance(include_paths, list) or not include_paths:
        errors.append("include_paths must be a non-empty list")
        include_paths = []

    for value in include_paths:
        if not isinstance(value, str):
            errors.append("include_paths entries must be strings")
            continue
        try:
            safe_relative(value)
        except ValueError as exc:
            errors.append(str(exc))

    for key in ("exclude_globs", "forbidden_globs"):
        values = profile.get(key, [])
        if not isinstance(values, list) or any(not isinstance(value, str) or not value.strip() for value in values):
            errors.append(f"{key} must be a list of non-empty glob strings")

    return errors


def resolve_profile_path(profile_path: Path, root: Path) -> Path:
    resolved = profile_path if profile_path.is_absolute() else root / profile_path
    resolved = resolved.resolve()
    root = root.resolve()
    if resolved != root and root not in resolved.parents:
        raise ValueError(f"profile path escapes repository root: {profile_path}")
    if not resolved.is_file():
        raise ValueError(f"workspace profile does not exist: {profile_path}")
    return resolved


def collect_source_files(root: Path, profile: dict[str, Any]) -> list[Path]:
    root = root.resolve()
    errors = validate_profile(profile)
    if errors:
        raise ValueError("invalid workspace profile: " + "; ".join(errors))

    exclude = list(profile.get("exclude_globs", []))
    forbidden = list(profile.get("forbidden_globs", []))
    collected: dict[str, Path] = {}

    for include_value in profile["include_paths"]:
        include_rel = safe_relative(include_value)
        source = (root / include_rel).resolve()
        if source != root and root not in source.parents:
            raise ValueError(f"include path escapes repository root: {include_value}")
        if not source.exists():
            raise ValueError(f"included path does not exist: {include_value}")
        if source.is_symlink():
            raise ValueError(f"workspace include must not be a symlink: {include_value}")

        candidates = [source] if source.is_file() else sorted(path for path in source.rglob("*") if path.is_file())
        for candidate in candidates:
            if candidate.is_symlink():
                raise ValueError(f"workspace source must not contain symlink files: {candidate.relative_to(root)}")
            relative = candidate.relative_to(root).as_posix()
            if relative.startswith(".git/"):
                continue
            if matches_any(relative, exclude) or matches_any(relative, forbidden):
                continue
            collected[relative] = candidate

    if not collected:
        raise ValueError("workspace profile selected zero source files")

    leaked = [relative for relative in collected if matches_any(relative, forbidden)]
    if leaked:
        raise ValueError("forbidden source leaked into workspace selection: " + ", ".join(sorted(leaked)))

    return [collected[key] for key in sorted(collected)]


def source_commit(root: Path) -> str | None:
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=root,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
        )
    except (FileNotFoundError, subprocess.CalledProcessError):
        return None
    value = result.stdout.strip()
    return value or None


def selection_manifest(root: Path, profile_path: Path, profile: dict[str, Any], files: list[Path]) -> dict[str, Any]:
    root = root.resolve()
    profile_path = profile_path.resolve()
    entries = []
    digest = hashlib.sha256()
    for source in files:
        relative = source.relative_to(root).as_posix()
        content_hash = file_sha256(source)
        size = source.stat().st_size
        entries.append({"path": relative, "sha256": content_hash, "bytes": size})
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update(content_hash.encode("ascii"))
        digest.update(b"\0")

    try:
        profile_relative = profile_path.relative_to(root).as_posix()
    except ValueError:
        profile_relative = str(profile_path)

    return {
        "schema_version": SCHEMA_VERSION,
        "workspace_id": profile["workspace_id"],
        "reference_id": profile["reference_id"],
        "purpose": str(profile.get("purpose", "CLEAN_RUN")),
        "profile_path": profile_relative,
        "profile_sha256": file_sha256(profile_path),
        "source_commit": source_commit(root),
        "workspace_digest": digest.hexdigest(),
        "forbidden_globs": list(profile.get("forbidden_globs", [])),
        "file_count": len(entries),
        "files": entries,
    }


def validate_output_location(root: Path, output: Path) -> None:
    root = root.resolve()
    output = output.resolve()
    if output == root or root in output.parents:
        raise ValueError("sanitized workspace output must be outside the source repository")


def prepare_output(output: Path, *, replace: bool, expected_workspace_id: str) -> None:
    if not output.exists():
        return
    if not replace:
        raise ValueError(f"output already exists: {output}; pass --replace only for a previously generated workspace")

    manifest_path = output / MANIFEST_NAME
    if not manifest_path.is_file():
        raise ValueError("refusing --replace because output is not marked as a generated sanitized workspace")
    try:
        existing = json.loads(manifest_path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise ValueError(f"refusing --replace because existing workspace manifest is unreadable: {exc}") from exc
    if existing.get("workspace_id") != expected_workspace_id:
        raise ValueError("refusing --replace because existing workspace_id differs")
    shutil.rmtree(output)


def audit_workspace(output: Path, profile: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    manifest_path = output / MANIFEST_NAME
    if not manifest_path.is_file():
        return [f"missing {MANIFEST_NAME}"]
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except Exception as exc:
        return [f"cannot read workspace manifest: {exc}"]

    if manifest.get("workspace_id") != profile.get("workspace_id"):
        errors.append("workspace_id does not match profile")
    if manifest.get("reference_id") != profile.get("reference_id"):
        errors.append("reference_id does not match profile")

    expected = {entry["path"]: entry for entry in manifest.get("files", []) if isinstance(entry, dict) and entry.get("path")}
    actual: dict[str, Path] = {}
    for path in sorted(output.rglob("*")):
        if not path.is_file() or path == manifest_path:
            continue
        relative = path.relative_to(output).as_posix()
        actual[relative] = path

    forbidden = list(profile.get("forbidden_globs", []))
    leaked = sorted(relative for relative in actual if matches_any(relative, forbidden))
    if leaked:
        errors.append("forbidden paths exist in generated workspace: " + ", ".join(leaked))

    missing = sorted(set(expected) - set(actual))
    extras = sorted(set(actual) - set(expected))
    if missing:
        errors.append("manifest files missing from workspace: " + ", ".join(missing))
    if extras:
        errors.append("unmanifested files found in workspace: " + ", ".join(extras))

    digest = hashlib.sha256()
    for relative in sorted(expected):
        path = actual.get(relative)
        if path is None:
            continue
        actual_hash = file_sha256(path)
        if actual_hash != expected[relative].get("sha256"):
            errors.append(f"workspace file hash drift: {relative}")
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update(actual_hash.encode("ascii"))
        digest.update(b"\0")

    if not missing and digest.hexdigest() != manifest.get("workspace_digest"):
        errors.append("workspace_digest does not match generated files")
    return errors


def build_workspace(root: Path, profile_path: Path, output: Path, *, replace: bool = False) -> dict[str, Any]:
    root = root.resolve()
    profile_path = resolve_profile_path(profile_path, root)
    profile = load_profile(profile_path)
    files = collect_source_files(root, profile)
    validate_output_location(root, output)
    output = output.resolve()
    prepare_output(output, replace=replace, expected_workspace_id=str(profile["workspace_id"]))
    output.mkdir(parents=True, exist_ok=False)

    for source in files:
        relative = source.relative_to(root)
        destination = output / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)

    manifest = selection_manifest(root, profile_path, profile, files)
    (output / MANIFEST_NAME).write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    audit_errors = audit_workspace(output, profile)
    if audit_errors:
        raise ValueError("generated workspace audit failed: " + "; ".join(audit_errors))
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser(description="Build a sanitized workspace for controlled clean runs/replays")
    sub = parser.add_subparsers(dest="command", required=True)

    validate_parser = sub.add_parser("validate")
    validate_parser.add_argument("profile", type=Path)

    build_parser = sub.add_parser("build")
    build_parser.add_argument("profile", type=Path)
    build_parser.add_argument("--output", type=Path, required=True)
    build_parser.add_argument("--replace", action="store_true")

    audit_parser = sub.add_parser("audit")
    audit_parser.add_argument("profile", type=Path)
    audit_parser.add_argument("--output", type=Path, required=True)

    args = parser.parse_args()
    try:
        profile_path = resolve_profile_path(args.profile, ROOT)
        profile = load_profile(profile_path)
        errors = validate_profile(profile)
        if errors:
            raise ValueError("invalid workspace profile: " + "; ".join(errors))

        if args.command == "validate":
            files = collect_source_files(ROOT, profile)
            manifest = selection_manifest(ROOT, profile_path, profile, files)
            print(
                f"PASS {manifest['workspace_id']} sanitized selection: "
                f"{manifest['file_count']} files, digest={manifest['workspace_digest']}"
            )
            return 0

        if args.command == "build":
            manifest = build_workspace(ROOT, profile_path, args.output, replace=args.replace)
            print(
                f"BUILT {args.output.resolve()} from {manifest['file_count']} sanitized files "
                f"digest={manifest['workspace_digest']}"
            )
            return 0

        output = args.output.resolve()
        audit_errors = audit_workspace(output, profile)
        if audit_errors:
            print(f"FAIL {output}")
            for error in audit_errors:
                print(f"  - {error}")
            return 1
        print(f"PASS {output} sanitized workspace audit")
        return 0
    except Exception as exc:
        print(f"FAIL sanitized workspace: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
