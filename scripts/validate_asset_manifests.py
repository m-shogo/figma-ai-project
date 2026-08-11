#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any, Iterable

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_SUFFIX = ".asset.json"
ALLOWED_FORMATS = {"png", "jpeg", "gif", "webp", "svg"}
SOURCE_EPHEMERAL = "FIGMA_MCP_EPHEMERAL_ASSET"
SOURCE_PLUGIN_RENDERED = "FIGMA_PLUGIN_RENDERED_EXPORT"
ALLOWED_SOURCE_KINDS = {SOURCE_EPHEMERAL, SOURCE_PLUGIN_RENDERED}


class AssetManifestError(ValueError):
    pass


def sha256_file(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as handle:
        while True:
            chunk = handle.read(1024 * 1024)
            if not chunk:
                break
            hasher.update(chunk)
    return hasher.hexdigest()


def repo_path(value: str, *, root: Path = ROOT) -> Path:
    raw = value.strip()
    if not raw:
        raise AssetManifestError("artifact.path is required")
    candidate = Path(raw)
    path = candidate.resolve() if candidate.is_absolute() else (root / candidate).resolve()
    root_resolved = root.resolve()
    if path != root_resolved and root_resolved not in path.parents:
        raise AssetManifestError("artifact.path escapes repository root")
    return path


def load_manifest(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise AssetManifestError(f"cannot read manifest: {type(exc).__name__}") from None
    if not isinstance(value, dict):
        raise AssetManifestError("manifest top-level must be an object")
    return value


def validate_source_provenance(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    source_kind = str(data.get("source_kind", "")).strip()
    if source_kind not in ALLOWED_SOURCE_KINDS:
        errors.append(f"source_kind must be one of {sorted(ALLOWED_SOURCE_KINDS)}")
        return errors

    if data.get("source_url_persisted") is not False:
        errors.append("source_url_persisted must be false")

    figma = data.get("figma")
    if not isinstance(figma, dict):
        errors.append("figma must be an object")
        figma = {}
    for key in ("file_key", "node_id", "logical_name"):
        if not str(figma.get(key, "")).strip():
            errors.append(f"figma.{key} is required")

    security = data.get("security")
    if not isinstance(security, dict):
        errors.append("security must be an object")
        return errors

    if source_kind == SOURCE_EPHEMERAL:
        if security.get("source_url_storage") != "PROHIBITED":
            errors.append("security.source_url_storage must be PROHIBITED")
        if security.get("source_url_transport") != "STDIN_OR_ENV_ONLY":
            errors.append("security.source_url_transport must be STDIN_OR_ENV_ONLY")
        return errors

    if security.get("source_url_storage") != "NOT_APPLICABLE":
        errors.append("security.source_url_storage must be NOT_APPLICABLE for plugin rendered exports")
    if security.get("source_url_transport") != "NOT_USED":
        errors.append("security.source_url_transport must be NOT_USED for plugin rendered exports")
    if security.get("transport") != "FIGMA_PLUGIN_BASE64_CHUNKS":
        errors.append("security.transport must be FIGMA_PLUGIN_BASE64_CHUNKS")

    if figma.get("export_method") != "node.exportAsync":
        errors.append("figma.export_method must be node.exportAsync for plugin rendered exports")
    if figma.get("export_format") not in {"PNG", "JPG"}:
        errors.append("figma.export_format must be PNG or JPG for plugin rendered exports")

    provenance = data.get("provenance")
    if not isinstance(provenance, dict):
        errors.append("provenance must be an object for plugin rendered exports")
    else:
        if provenance.get("asset_semantics") != "RENDERED_VISIBLE_NODE_NOT_RAW_SOURCE":
            errors.append(
                "provenance.asset_semantics must be RENDERED_VISIBLE_NODE_NOT_RAW_SOURCE"
            )
        if provenance.get("cms_source_authority") is not False:
            errors.append("provenance.cms_source_authority must be false")
        if provenance.get("intended_use") != "VISUAL_FIXTURE":
            errors.append("provenance.intended_use must be VISUAL_FIXTURE")

    return errors


def validate_manifest(path: Path, *, root: Path = ROOT) -> list[str]:
    try:
        data = load_manifest(path)
    except AssetManifestError as exc:
        return [str(exc)]

    errors: list[str] = []
    if data.get("schema_version") != 1:
        errors.append("schema_version must be 1")
    errors.extend(validate_source_provenance(data))

    artifact = data.get("artifact")
    if not isinstance(artifact, dict):
        return errors + ["artifact must be an object"]

    try:
        asset_path = repo_path(str(artifact.get("path", "")), root=root)
    except AssetManifestError as exc:
        errors.append(str(exc))
        return errors

    if not asset_path.is_file():
        errors.append(f"artifact file does not exist: {asset_path.relative_to(root.resolve())}")
        return errors

    expected_sha = str(artifact.get("sha256", "")).strip().lower()
    if len(expected_sha) != 64 or any(char not in "0123456789abcdef" for char in expected_sha):
        errors.append("artifact.sha256 must be a lowercase SHA-256 hex digest")
    else:
        actual_sha = sha256_file(asset_path)
        if actual_sha != expected_sha:
            errors.append("artifact.sha256 does not match file bytes")

    expected_size = artifact.get("size_bytes")
    if not isinstance(expected_size, int) or isinstance(expected_size, bool) or expected_size <= 0:
        errors.append("artifact.size_bytes must be a positive integer")
    elif asset_path.stat().st_size != expected_size:
        errors.append("artifact.size_bytes does not match file bytes")

    detected_format = str(artifact.get("detected_format", "")).strip().lower()
    if detected_format not in ALLOWED_FORMATS:
        errors.append(f"artifact.detected_format must be one of {sorted(ALLOWED_FORMATS)}")

    return errors


def candidate_manifests(root: Path = ROOT) -> list[Path]:
    return sorted(path for path in root.rglob(f"*{MANIFEST_SUFFIX}") if ".git" not in path.parts)


def validate_many(paths: Iterable[Path], *, root: Path = ROOT) -> list[tuple[Path, list[str]]]:
    failures: list[tuple[Path, list[str]]] = []
    for path in paths:
        errors = validate_manifest(path, root=root)
        if errors:
            failures.append((path, errors))
    return failures


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate persisted Figma asset manifests against asset bytes.")
    parser.add_argument("paths", nargs="*", type=Path, help="Optional manifest paths; defaults to all *.asset.json files")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    if args.paths:
        paths = [path if path.is_absolute() else ROOT / path for path in args.paths]
    else:
        paths = candidate_manifests()

    failures = validate_many(paths)
    if failures:
        for path, errors in failures:
            try:
                label = path.resolve().relative_to(ROOT.resolve())
            except ValueError:
                label = path
            print(f"FAIL {label}", file=sys.stderr)
            for error in errors:
                print(f"  - {error}", file=sys.stderr)
        return 1

    print(f"PASS Figma asset manifests count={len(paths)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
