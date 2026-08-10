#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from prepare_section_execution import atomic_write_yaml, prepare_manifest

ROOT = Path(__file__).resolve().parents[1]
ACTIVE = {"READY", "RUNNING", "COMPLETE"}
PARALLEL_MODES = {"BRANCH_WORKTREE", "AGENT_SANDBOX", "OTHER"}
ALL_MODES = PARALLEL_MODES | {"SERIAL_SHARED_TREE"}


def find_section(manifest: dict[str, Any], section_id: str) -> dict[str, Any]:
    matches = [
        section
        for section in manifest.get("sections", [])
        if str(section.get("section_id", "")).strip() == section_id
    ]
    if len(matches) != 1:
        raise ValueError(f"expected exactly one section_id={section_id}, found {len(matches)}")
    return matches[0]


def wave_for_section(plan: dict[str, Any], section_id: str) -> dict[str, Any]:
    matches = [
        wave for wave in plan.get("waves", []) if section_id in [str(v) for v in wave.get("sections", [])]
    ]
    if len(matches) != 1:
        raise ValueError(f"expected exactly one planner wave for {section_id}, found {len(matches)}")
    return matches[0]


def validate_isolation(
    mode: str,
    ref: str,
    notes: list[str],
    wave: dict[str, Any],
) -> None:
    if mode not in ALL_MODES:
        raise ValueError(f"unsupported isolation mode: {mode}")
    if not ref.strip():
        raise ValueError("isolation ref is required")

    wave_size = len(wave.get("sections", []))
    if mode == "SERIAL_SHARED_TREE":
        if wave_size != 1:
            raise ValueError(
                "SERIAL_SHARED_TREE is allowed only for a singleton planner wave; "
                f"current wave has {wave_size} sections"
            )
        return

    if mode == "OTHER" and not notes:
        raise ValueError("OTHER isolation requires explicit safety notes")


def ensure_unique_isolation_ref(
    manifest: dict[str, Any],
    *,
    section_id: str,
    group: str,
    ref: str,
) -> None:
    for section in manifest.get("sections", []):
        other_id = str(section.get("section_id", "")).strip()
        if other_id == section_id:
            continue
        worker = section.get("worker", {})
        if str(worker.get("parallel_group", "")).strip() != group:
            continue
        if str(worker.get("status", "PLANNED")) not in ACTIVE:
            continue
        isolation = worker.get("isolation", {})
        if str(isolation.get("ref", "")).strip() == ref:
            raise ValueError(
                f"isolation ref {ref!r} is already used by active section {other_id} in {group}"
            )


def activate(
    manifest_path: Path,
    *,
    root: Path = ROOT,
    section_id: str,
    mode: str,
    isolation_ref: str,
    agent: str = "",
    model: str = "",
    notes: list[str] | None = None,
) -> tuple[dict[str, Any], dict[str, Any]]:
    notes = list(notes or [])
    prepared, plan = prepare_manifest(manifest_path, root=root)
    section = find_section(prepared, section_id)
    worker = section.setdefault("worker", {})
    status = str(worker.get("status", "PLANNED"))

    if status in {"RUNNING", "COMPLETE"}:
        raise ValueError(f"cannot re-activate section {section_id} with status={status}")
    if status == "READY":
        raise ValueError(
            f"section {section_id} is already READY; do not silently rewrite its worker identity"
        )

    wave = wave_for_section(plan, section_id)
    group = str(wave.get("recommended_parallel_group", "")).strip()
    if not group:
        raise ValueError(f"planner did not assign a parallel group for {section_id}")

    validate_isolation(mode, isolation_ref, notes, wave)
    ensure_unique_isolation_ref(
        prepared,
        section_id=section_id,
        group=group,
        ref=isolation_ref,
    )

    worker["parallel_group"] = group
    worker["isolation"] = {
        "mode": mode,
        "ref": isolation_ref,
        "parallel_safe": mode in PARALLEL_MODES,
        "notes": notes,
    }
    worker["agent"] = agent
    worker["model"] = model
    worker["status"] = "READY"

    return prepared, wave


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Pin execution lineage, assign safe isolation, and mark one Section worker READY"
    )
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--section-id", required=True)
    parser.add_argument(
        "--isolation-mode",
        required=True,
        choices=sorted(ALL_MODES),
    )
    parser.add_argument("--isolation-ref", required=True)
    parser.add_argument("--agent", default="")
    parser.add_argument("--model", default="")
    parser.add_argument("--note", action="append", default=[])
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    manifest_path = args.manifest if args.manifest.is_absolute() else ROOT / args.manifest
    prepared, wave = activate(
        manifest_path,
        root=ROOT,
        section_id=args.section_id,
        mode=args.isolation_mode,
        isolation_ref=args.isolation_ref,
        agent=args.agent,
        model=args.model,
        notes=args.note,
    )

    if args.apply:
        atomic_write_yaml(manifest_path, prepared)

    result = {
        "manifest": manifest_path.resolve().relative_to(ROOT).as_posix(),
        "section_id": args.section_id,
        "status": "READY",
        "parallel_group": wave.get("recommended_parallel_group", ""),
        "wave_sections": wave.get("sections", []),
        "isolation_mode": args.isolation_mode,
        "isolation_ref": args.isolation_ref,
        "applied": args.apply,
    }

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        action = "UPDATED" if args.apply else "DRY-RUN"
        print(f"{action} {result['manifest']} {args.section_id} → READY")
        print(f"Wave: {result['parallel_group']} ({', '.join(result['wave_sections'])})")
        print(f"Isolation: {args.isolation_mode} {args.isolation_ref}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
