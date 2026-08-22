#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

from validate_records import SECTION_SCHEMA, load_json as load_schema_json, validate_schema
from validate_reuse_preflight import reuse_preflight_errors

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT_SCHEMA_VERSION = 3
SUPPORTED_SNAPSHOT_SCHEMA_VERSIONS = {1, 2, 3}
OBSERVATION_LINEAGE_RUN_SCHEMA_VERSION = 13
OBSERVATION_LINEAGE_SCOPES = {"SECTION", "INTEGRATION", "PAGE_BENCHMARK"}
OBSERVATION_COVERAGE_SECTION_SCHEMA_VERSION = 9
REUSE_PREFLIGHT_LINEAGE_RUN_SCHEMA_VERSION = 14


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"top-level YAML must be an object: {path}")
    return value


def canonical_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def snapshot_path(run_path: Path) -> Path:
    return run_path.with_name(f"{run_path.stem}.first-pass.json")


def repo_file(value: str, label: str) -> Path:
    text = value.strip()
    if not text:
        raise ValueError(f"{label} is required before FIRST PASS freeze")
    path = (ROOT / text).resolve()
    if path != ROOT and ROOT not in path.parents:
        raise ValueError(f"{label} escapes repository root: {text}")
    if not path.is_file():
        raise ValueError(f"{label} does not exist: {text}")
    return path


def require_pinned_file(coordination: dict[str, Any], path_field: str, hash_field: str, label: str) -> tuple[str, str, Path]:
    path_value = str(coordination.get(path_field, "")).strip()
    expected_hash = str(coordination.get(hash_field, "")).strip()
    if not expected_hash:
        raise ValueError(f"coordination.{hash_field} is required before FIRST PASS freeze")
    path = repo_file(path_value, f"coordination.{path_field}")
    actual_hash = file_sha256(path)
    if actual_hash != expected_hash:
        raise ValueError(
            f"{label} sha256 mismatch before FIRST PASS freeze: expected {expected_hash}, actual {actual_hash}"
        )
    return path_value, expected_hash, path


def observation_lineage(run: dict[str, Any]) -> dict[str, str]:
    version = int(run.get("schema_version", 0) or 0)
    coordination = run.get("coordination", {})
    scope = str(coordination.get("scope", "")).strip()
    if version < OBSERVATION_LINEAGE_RUN_SCHEMA_VERSION or scope not in OBSERVATION_LINEAGE_SCOPES:
        return {}

    manifest_path_value, manifest_hash, manifest_path = require_pinned_file(
        coordination,
        "section_manifest_path",
        "section_manifest_sha256",
        "Section Manifest",
    )
    profile_path_value, profile_hash, _ = require_pinned_file(
        coordination,
        "figma_structure_profile_path",
        "figma_structure_profile_sha256",
        "Figma Structure Profile",
    )

    manifest = load_yaml(manifest_path)
    manifest_version = int(manifest.get("schema_version", 0) or 0)
    if manifest_version < OBSERVATION_COVERAGE_SECTION_SCHEMA_VERSION:
        raise ValueError(
            "FIRST PASS freeze requires Section Manifest schema v9+ so Observation Coverage is part of the frozen evidence"
        )
    schema_errors = validate_schema(manifest, load_schema_json(SECTION_SCHEMA))
    if schema_errors:
        raise ValueError(
            "Section Manifest is invalid before FIRST PASS freeze:\n- " + "\n- ".join(schema_errors)
        )

    if str(manifest.get("figma_structure_profile", "")).strip() != profile_path_value:
        raise ValueError("run Figma Structure Profile path does not match Section Manifest before FIRST PASS freeze")
    if str(manifest.get("figma_structure_profile_sha256", "")).strip() != profile_hash:
        raise ValueError("run Figma Structure Profile hash does not match Section Manifest before FIRST PASS freeze")

    return {
        "section_manifest_path": manifest_path_value,
        "section_manifest_sha256": manifest_hash,
        "figma_structure_profile_path": profile_path_value,
        "figma_structure_profile_sha256": profile_hash,
    }


def reuse_preflight_lineage(run: dict[str, Any]) -> dict[str, str]:
    version = int(run.get("schema_version", 0) or 0)
    if version < REUSE_PREFLIGHT_LINEAGE_RUN_SCHEMA_VERSION:
        return {}

    errors = reuse_preflight_errors(run)
    if errors:
        raise ValueError(
            "Reuse-Before-Build preflight is invalid before FIRST PASS freeze:\n- " + "\n- ".join(errors)
        )
    preflight = run.get("reuse_preflight")
    if not isinstance(preflight, dict):
        raise ValueError("reuse_preflight must be an object before FIRST PASS freeze")
    return {"reuse_preflight_sha256": sha256_text(canonical_json(preflight))}


def first_pass_payload(run: dict[str, Any], tooling_revision: str) -> dict[str, Any]:
    code = run.get("code", {})
    captures = run.get("captures", {}).get("first_pass", [])
    score = run.get("scores", {}).get("first_pass_fidelity", {})
    coordination = run.get("coordination", {})
    reference = run.get("reference", {})

    first_pass_commit = str(code.get("first_pass_commit", "")).strip()
    if not first_pass_commit:
        raise ValueError("code.first_pass_commit is required before FIRST PASS freeze")
    if not isinstance(captures, list) or not captures:
        raise ValueError("captures.first_pass must contain evidence before FIRST PASS freeze")
    if score.get("total") is None:
        raise ValueError("scores.first_pass_fidelity.total is required before FIRST PASS freeze")
    tooling_revision = tooling_revision.strip()
    if not tooling_revision:
        raise ValueError("tooling_revision is required to pin the figma-ai-project baseline")

    payload = {
        "schema_version": SNAPSHOT_SCHEMA_VERSION,
        "experiment_id": str(run.get("experiment_id", "")),
        "run_id": str(run.get("run_id", "")),
        "frozen_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "tooling_revision": tooling_revision,
        "reference_manifest_sha256": str(reference.get("manifest_sha256", "")),
        "company_policy_sha256": str(coordination.get("company_policy_sha256", "")),
        "implementation_profile_id": str(coordination.get("implementation_profile_id", "")),
        "implementation_profile_sha256": str(coordination.get("implementation_profile_sha256", "")),
        "required_environment_profiles": sorted(
            str(value) for value in coordination.get("required_environment_profiles", [])
        ),
        "code_starting_commit": str(code.get("starting_commit", "")),
        "first_pass_commit": first_pass_commit,
        "captures_sha256": sha256_text(canonical_json(captures)),
        "first_pass_fidelity": score,
    }
    payload.update(observation_lineage(run))
    payload.update(reuse_preflight_lineage(run))
    return payload


def validate_snapshot(run: dict[str, Any], snapshot: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    snapshot_version = snapshot.get("schema_version")
    if snapshot_version not in SUPPORTED_SNAPSHOT_SCHEMA_VERSIONS:
        errors.append("unsupported FIRST PASS snapshot schema_version")
    if snapshot.get("run_id") != run.get("run_id"):
        errors.append("FIRST PASS snapshot run_id mismatch")
    if snapshot.get("experiment_id") != run.get("experiment_id"):
        errors.append("FIRST PASS snapshot experiment_id mismatch")

    run_schema_version = int(run.get("schema_version", 0) or 0)
    if run_schema_version >= REUSE_PREFLIGHT_LINEAGE_RUN_SCHEMA_VERSION and snapshot_version in {1, 2}:
        errors.append("schema-v14+ run requires FIRST PASS snapshot schema v3+ with reuse preflight lineage")

    reference = run.get("reference", {})
    coordination = run.get("coordination", {})
    code = run.get("code", {})
    captures = run.get("captures", {}).get("first_pass", [])
    score = run.get("scores", {}).get("first_pass_fidelity", {})

    expected = {
        "reference_manifest_sha256": str(reference.get("manifest_sha256", "")),
        "company_policy_sha256": str(coordination.get("company_policy_sha256", "")),
        "implementation_profile_id": str(coordination.get("implementation_profile_id", "")),
        "implementation_profile_sha256": str(coordination.get("implementation_profile_sha256", "")),
        "required_environment_profiles": sorted(
            str(value) for value in coordination.get("required_environment_profiles", [])
        ),
        "code_starting_commit": str(code.get("starting_commit", "")),
        "first_pass_commit": str(code.get("first_pass_commit", "")),
        "captures_sha256": sha256_text(canonical_json(captures)),
        "first_pass_fidelity": score,
    }
    if snapshot_version in {2, 3}:
        try:
            expected.update(observation_lineage(run))
        except Exception as exc:
            errors.append(str(exc))
    if snapshot_version == 3:
        try:
            expected.update(reuse_preflight_lineage(run))
        except Exception as exc:
            errors.append(str(exc))

    for key, value in expected.items():
        if snapshot.get(key) != value:
            errors.append(f"FIRST PASS snapshot {key} no longer matches run record")
    if not str(snapshot.get("tooling_revision", "")).strip():
        errors.append("FIRST PASS snapshot tooling_revision is required")
    return errors


def candidate_runs(root: Path = ROOT) -> list[Path]:
    found: list[Path] = []
    for base in (root / "experiments", root / "references", root / "contracts"):
        if not base.exists():
            continue
        for path in sorted(base.rglob("*.yaml")):
            if path.name == "run.yaml" or path.name.endswith("run.yaml"):
                found.append(path)
    return found


def freeze(run_path: Path, tooling_revision: str) -> Path:
    run = load_yaml(run_path)
    output = snapshot_path(run_path)
    if output.exists():
        raise ValueError(f"FIRST PASS snapshot already exists and is immutable: {output}")
    payload = first_pass_payload(run, tooling_revision)
    output.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=f".{output.name}.", suffix=".tmp", dir=output.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2, sort_keys=True)
            handle.write("\n")
        os.replace(temp_name, output)
    except Exception:
        try:
            os.unlink(temp_name)
        except FileNotFoundError:
            pass
        raise
    return output


def validate_run_file(path: Path) -> list[str]:
    run = load_yaml(path)
    output = snapshot_path(path)
    code = run.get("code", {})
    first_pass_started = bool(str(code.get("first_pass_commit", "")).strip())
    complete = run.get("status") == "COMPLETE"
    if not (first_pass_started or complete):
        return []
    if not output.is_file():
        return [f"FIRST PASS snapshot missing: {output.name}"]
    try:
        snapshot = json.loads(output.read_text(encoding="utf-8"))
    except Exception as exc:
        return [f"cannot read FIRST PASS snapshot: {exc}"]
    if not isinstance(snapshot, dict):
        return ["FIRST PASS snapshot must be an object"]
    return validate_snapshot(run, snapshot)


def main() -> int:
    parser = argparse.ArgumentParser(description="Freeze or validate immutable FIRST PASS evidence")
    sub = parser.add_subparsers(dest="command", required=True)

    freeze_parser = sub.add_parser("freeze")
    freeze_parser.add_argument("run_record", type=Path)
    freeze_parser.add_argument("--tooling-revision", required=True)

    validate_parser = sub.add_parser("validate")
    validate_parser.add_argument("run_record", type=Path, nargs="?")

    args = parser.parse_args()
    if args.command == "freeze":
        path = args.run_record if args.run_record.is_absolute() else ROOT / args.run_record
        output = freeze(path, args.tooling_revision)
        print(f"FROZEN {output.relative_to(ROOT)} sha256={file_sha256(output)}")
        return 0

    targets = [args.run_record if args.run_record.is_absolute() else ROOT / args.run_record] if args.run_record else candidate_runs()
    if not targets:
        print("SKIP FIRST-PASS validation: no run records found; no immutable FIRST PASS evidence exists yet")
        return 0

    failures = 0
    for path in targets:
        errors = validate_run_file(path)
        if errors:
            failures += 1
            print(f"FAIL {path.relative_to(ROOT)}")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"PASS {path.relative_to(ROOT)} FIRST-PASS")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
