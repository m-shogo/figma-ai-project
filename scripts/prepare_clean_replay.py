#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import os
import tempfile
from pathlib import Path
from typing import Any

import yaml

from first_pass_evidence import load_yaml, snapshot_path, validate_run_file

ROOT = Path(__file__).resolve().parents[1]


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def resolve(path: Path) -> Path:
    resolved = path if path.is_absolute() else ROOT / path
    resolved = resolved.resolve()
    if resolved != ROOT and ROOT not in resolved.parents:
        raise ValueError(f"path escapes repository root: {path}")
    if not resolved.is_file():
        raise ValueError(f"file does not exist: {path}")
    return resolved


def relative(path: Path) -> str:
    return path.resolve().relative_to(ROOT).as_posix()


def atomic_write(path: Path, data: dict[str, Any]) -> None:
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            yaml.safe_dump(data, handle, sort_keys=False, allow_unicode=True)
        os.replace(temp_name, path)
    except Exception:
        try:
            os.unlink(temp_name)
        except FileNotFoundError:
            pass
        raise


def pair_errors(source: dict[str, Any], replay: dict[str, Any], *, source_path: Path | None = None) -> list[str]:
    errors: list[str] = []
    if replay.get("run_class") != "REPLAY":
        errors.append("clean replay run_class must be REPLAY")
    if source.get("run_class") == "REPLAY":
        errors.append("source run for a clean replay must not itself be REPLAY")

    source_reference = source.get("reference", {})
    replay_reference = replay.get("reference", {})
    if source_reference.get("reference_id") != replay_reference.get("reference_id"):
        errors.append("clean replay must use the same reference_id")
    if source_reference.get("manifest_sha256") != replay_reference.get("manifest_sha256"):
        errors.append("clean replay must use the same frozen Reference Manifest SHA-256")

    source_coord = source.get("coordination", {})
    replay_coord = replay.get("coordination", {})
    if source_coord.get("scope") != replay_coord.get("scope"):
        errors.append("clean replay must use the same run scope")
    if source_coord.get("section_id") != replay_coord.get("section_id"):
        errors.append("clean replay must use the same section_id")
    if sorted(source_coord.get("required_environment_profiles", [])) != sorted(
        replay_coord.get("required_environment_profiles", [])
    ):
        errors.append("clean replay must use the same Required Environment profile set")

    source_impl_id = str(source_coord.get("implementation_profile_id", "")).strip()
    replay_impl_id = str(replay_coord.get("implementation_profile_id", "")).strip()
    source_impl_hash = str(source_coord.get("implementation_profile_sha256", "")).strip()
    replay_impl_hash = str(replay_coord.get("implementation_profile_sha256", "")).strip()
    if source_impl_id or replay_impl_id or source_impl_hash or replay_impl_hash:
        if not source_impl_id or not replay_impl_id or source_impl_id != replay_impl_id:
            errors.append("clean replay must use the same Implementation Profile id")
        if not source_impl_hash or not replay_impl_hash or source_impl_hash != replay_impl_hash:
            errors.append("clean replay must use the same frozen Implementation Profile SHA-256")

    source_code = source.get("code", {})
    replay_code = replay.get("code", {})
    if source_code.get("repository") != replay_code.get("repository"):
        errors.append("clean replay must target the same repository")

    source_isolation = str(source_coord.get("isolation_ref", "")).strip()
    replay_isolation = str(replay_coord.get("isolation_ref", "")).strip()
    if not replay_isolation:
        errors.append("clean replay requires a fresh isolation_ref")
    elif source_isolation and replay_isolation == source_isolation:
        errors.append("clean replay isolation_ref must differ from RUN A")

    replay_meta = replay.get("replay", {})
    if replay_meta.get("fresh_isolation") is not True:
        errors.append("clean replay requires replay.fresh_isolation=true")
    for field in (
        "source_final_code_exposed",
        "source_repair_diff_exposed",
        "project_specific_values_exposed",
    ):
        if replay_meta.get(field) is not False:
            errors.append(f"clean replay requires replay.{field}=false")

    if not str(replay_meta.get("source_run", "")).strip():
        errors.append("clean replay requires replay.source_run")
    if not str(replay_meta.get("source_run_sha256", "")).strip():
        errors.append("clean replay requires replay.source_run_sha256")
    if not str(replay_meta.get("source_run_id", "")).strip():
        errors.append("clean replay requires replay.source_run_id")
    elif replay_meta.get("source_run_id") != source.get("run_id"):
        errors.append("replay.source_run_id does not match source run")

    if source_path is not None:
        if replay_meta.get("source_run") != relative(source_path):
            errors.append("replay.source_run path does not match source file")
        if replay_meta.get("source_run_sha256") != file_sha256(source_path):
            errors.append("replay.source_run_sha256 does not match source file")

    return errors


def prepare(source_path: Path, replay_path: Path) -> dict[str, Any]:
    source_path = resolve(source_path)
    replay_path = resolve(replay_path)
    source = load_yaml(source_path)
    replay = load_yaml(replay_path)

    if source.get("status") != "COMPLETE":
        raise ValueError("RUN A must be COMPLETE before preparing clean replay")
    source_first_pass_errors = validate_run_file(source_path)
    if source_first_pass_errors:
        raise ValueError("RUN A FIRST PASS evidence is not frozen: " + "; ".join(source_first_pass_errors))

    source_isolation = str(source.get("coordination", {}).get("isolation_ref", "")).strip()
    replay_isolation = str(replay.get("coordination", {}).get("isolation_ref", "")).strip()
    if not replay_isolation or replay_isolation == source_isolation:
        raise ValueError("candidate replay must already use a different fresh isolation_ref")

    updated = dict(replay)
    updated["run_class"] = "REPLAY"
    meta = dict(updated.get("replay", {}))
    meta.update(
        {
            "required": True,
            "source_run": relative(source_path),
            "source_run_sha256": file_sha256(source_path),
            "source_run_id": str(source.get("run_id", "")),
            "fresh_isolation": True,
            "source_final_code_exposed": False,
            "source_repair_diff_exposed": False,
            "project_specific_values_exposed": False,
            "treatment_changes": [],
            "result": "NOT_RUN",
        }
    )
    updated["replay"] = meta
    errors = pair_errors(source, updated, source_path=source_path)
    if errors:
        raise ValueError("candidate replay pair is not comparable: " + "; ".join(errors))
    return updated


def validate_replay_file(replay_path: Path) -> list[str]:
    replay_path = resolve(replay_path)
    replay = load_yaml(replay_path)
    if replay.get("run_class") != "REPLAY":
        return []
    source_value = str(replay.get("replay", {}).get("source_run", "")).strip()
    if not source_value:
        return ["REPLAY run is missing replay.source_run"]
    try:
        source_path = resolve(Path(source_value))
    except Exception as exc:
        return [str(exc)]
    source = load_yaml(source_path)
    errors = pair_errors(source, replay, source_path=source_path)

    source_snapshot = snapshot_path(source_path)
    if not source_snapshot.is_file():
        errors.append("RUN A FIRST PASS snapshot is missing")
    if replay.get("status") == "COMPLETE" or replay.get("replay", {}).get("result") != "NOT_RUN":
        replay_snapshot = snapshot_path(replay_path)
        if not replay_snapshot.is_file():
            errors.append("RUN B FIRST PASS snapshot is missing")
        else:
            errors.extend(validate_run_file(replay_path))
    return errors


def candidate_replays(root: Path = ROOT) -> list[Path]:
    found: list[Path] = []
    for base in (root / "experiments", root / "references", root / "contracts"):
        if not base.exists():
            continue
        for path in sorted(base.rglob("*.yaml")):
            if path.name == "run.yaml" or path.name.endswith("run.yaml"):
                try:
                    if load_yaml(path).get("run_class") == "REPLAY":
                        found.append(path)
                except Exception:
                    pass
    return found


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare or validate clean replay run pairs")
    sub = parser.add_subparsers(dest="command", required=True)

    prepare_parser = sub.add_parser("prepare")
    prepare_parser.add_argument("source_run", type=Path)
    prepare_parser.add_argument("replay_run", type=Path)
    prepare_parser.add_argument("--apply", action="store_true")

    validate_parser = sub.add_parser("validate")
    validate_parser.add_argument("replay_run", type=Path, nargs="?")

    args = parser.parse_args()
    if args.command == "prepare":
        path = resolve(args.replay_run)
        updated = prepare(args.source_run, args.replay_run)
        if args.apply:
            atomic_write(path, updated)
            print(f"UPDATED {relative(path)} → REPLAY")
        else:
            print(f"DRY-RUN {relative(path)} → REPLAY")
        return 0

    targets = [resolve(args.replay_run)] if args.replay_run else candidate_replays()
    if not targets:
        print("SKIP clean-replay-pair validation: no REPLAY run records found; reproducibility has not been tested yet")
        return 0

    failures = 0
    for path in targets:
        errors = validate_replay_file(path)
        if errors:
            failures += 1
            print(f"FAIL {relative(path)}")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"PASS {relative(path)} clean-replay-pair")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
