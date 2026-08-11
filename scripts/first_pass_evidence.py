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

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT_SCHEMA_VERSION = 1


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

    return {
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


def validate_snapshot(run: dict[str, Any], snapshot: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if snapshot.get("schema_version") != SNAPSHOT_SCHEMA_VERSION:
        errors.append("unsupported FIRST PASS snapshot schema_version")
    if snapshot.get("run_id") != run.get("run_id"):
        errors.append("FIRST PASS snapshot run_id mismatch")
    if snapshot.get("experiment_id") != run.get("experiment_id"):
        errors.append("FIRST PASS snapshot experiment_id mismatch")

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
