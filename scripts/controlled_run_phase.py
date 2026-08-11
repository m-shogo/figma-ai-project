#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import yaml

import first_pass_evidence

ROOT = Path(__file__).resolve().parents[1]
PHASES = ("FIRST_PASS_BUILD", "FIRST_PASS_FREEZE", "REPAIR", "FINALIZE")


def load_run(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"run record must be a YAML mapping: {path}")
    return value


def snapshot_errors(run_path: Path, run: dict[str, Any]) -> list[str]:
    snapshot_path = first_pass_evidence.snapshot_path(run_path)
    if not snapshot_path.is_file():
        return [f"FIRST PASS snapshot missing: {snapshot_path.name}"]
    try:
        snapshot = json.loads(snapshot_path.read_text(encoding="utf-8"))
    except Exception as exc:
        return [f"cannot read FIRST PASS snapshot: {exc}"]
    if not isinstance(snapshot, dict):
        return ["FIRST PASS snapshot must be an object"]
    return first_pass_evidence.validate_snapshot(run, snapshot)


def freeze_readiness_errors(run: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    code = run.get("code", {}) if isinstance(run.get("code", {}), dict) else {}
    captures = run.get("captures", {}) if isinstance(run.get("captures", {}), dict) else {}
    scores = run.get("scores", {}) if isinstance(run.get("scores", {}), dict) else {}
    first_pass_score = scores.get("first_pass_fidelity", {}) if isinstance(scores.get("first_pass_fidelity", {}), dict) else {}

    if not str(code.get("first_pass_commit", "")).strip():
        errors.append("code.first_pass_commit is required before FIRST_PASS_FREEZE")
    if not isinstance(captures.get("first_pass"), list) or not captures.get("first_pass"):
        errors.append("captures.first_pass evidence is required before FIRST_PASS_FREEZE")
    if first_pass_score.get("total") is None:
        errors.append("scores.first_pass_fidelity.total is required before FIRST_PASS_FREEZE")
    return errors


def check_phase(run_path: Path, phase: str) -> list[str]:
    if phase not in PHASES:
        return [f"unsupported phase: {phase}"]

    run = load_run(run_path)
    code = run.get("code", {}) if isinstance(run.get("code", {}), dict) else {}
    first_pass_commit = str(code.get("first_pass_commit", "")).strip()
    final_commit = str(code.get("final_commit", "")).strip()
    snapshot_path = first_pass_evidence.snapshot_path(run_path)
    snapshot_exists = snapshot_path.is_file()
    errors: list[str] = []

    if final_commit and not snapshot_exists:
        errors.append("code.final_commit exists before immutable FIRST PASS evidence; run is invalid")

    if phase == "FIRST_PASS_BUILD":
        if snapshot_exists:
            errors.append("FIRST PASS is already frozen; do not mutate the baseline as FIRST_PASS_BUILD")
        if first_pass_commit:
            errors.append("code.first_pass_commit is already recorded; freeze FIRST PASS before any more implementation changes")
        if final_commit:
            errors.append("code.final_commit is already recorded; FIRST_PASS_BUILD cannot resume")
        return errors

    if phase == "FIRST_PASS_FREEZE":
        if snapshot_exists:
            errors.extend(snapshot_errors(run_path, run))
            if not errors:
                errors.append("FIRST PASS snapshot already exists and is immutable; freeze must not be repeated")
            return errors
        errors.extend(freeze_readiness_errors(run))
        return errors

    if not first_pass_commit:
        errors.append(f"{phase} requires code.first_pass_commit")
    errors.extend(snapshot_errors(run_path, run))

    if phase == "REPAIR" and final_commit:
        errors.append("code.final_commit is already recorded; use FINALIZE verification instead of new repair work")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Fail closed when a controlled run tries to enter a phase without immutable FIRST PASS evidence")
    parser.add_argument("run_record", type=Path)
    parser.add_argument("--phase", choices=PHASES, required=True)
    args = parser.parse_args()

    run_path = args.run_record if args.run_record.is_absolute() else ROOT / args.run_record
    if not run_path.is_file():
        print(f"FAIL controlled run phase: run record not found: {run_path}")
        return 1

    try:
        errors = check_phase(run_path, args.phase)
    except Exception as exc:
        print(f"FAIL controlled run phase: {exc}")
        return 1

    if errors:
        print(f"BLOCK {run_path} phase={args.phase}")
        for error in errors:
            print(f"  - {error}")
        return 1

    print(f"PASS {run_path} phase={args.phase}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
