#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

import yaml

import validate_frontend_learning_evidence as learning

ROOT = Path(__file__).resolve().parents[1]
TRACKED_FIELDS = (
    "candidate_rules",
    "confirmed_rules",
    "contradicted_rules",
    "rules_needing_retest",
    "promotion_candidates",
    "demotion_candidates",
)


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"top-level YAML value must be an object: {path}")
    return value


def run_records(root: Path) -> list[tuple[Path, dict[str, Any]]]:
    base = root / "experiments"
    if not base.exists():
        return []
    output: list[tuple[Path, dict[str, Any]]] = []
    for path in sorted(base.rglob("*.yaml")):
        try:
            data = load_yaml(path)
        except Exception:
            continue
        if not str(data.get("run_id", "")).strip():
            continue
        lessons = data.get("lessons")
        if not isinstance(lessons, dict):
            continue
        output.append((path, data))
    return output


def captured_fragments(index: dict[str, Any]) -> set[tuple[str, str, str, str]]:
    captured: set[tuple[str, str, str, str]] = set()
    for record in index.get("records", []):
        if not isinstance(record, dict):
            continue
        evidence = record.get("evidence", {})
        if not isinstance(evidence, dict):
            continue
        for relation in ("supports", "contradicts"):
            items = evidence.get(relation, [])
            if not isinstance(items, list):
                continue
            for item in items:
                if not isinstance(item, dict) or item.get("kind") != "RUN_RECORD":
                    continue
                source_field = str(item.get("source_field", "")).strip()
                source_hash = str(item.get("source_text_sha256", "")).strip()
                if not source_field or not source_hash:
                    continue
                captured.add(
                    (
                        str(item.get("path", "")).strip(),
                        str(item.get("run_id", "")).strip(),
                        source_field,
                        source_hash,
                    )
                )
    return captured


def reusable_run_fragments(root: Path) -> list[tuple[str, str, str, str, str]]:
    fragments: list[tuple[str, str, str, str, str]] = []
    for path, run in run_records(root):
        relative = path.relative_to(root).as_posix()
        run_id = str(run.get("run_id", "")).strip()
        lessons = run.get("lessons", {})
        for field in TRACKED_FIELDS:
            value = lessons.get(field, [])
            if not isinstance(value, list):
                continue
            for item in value:
                if not learning.material_text(item):
                    continue
                text = str(item).strip()
                fragments.append(
                    (
                        relative,
                        run_id,
                        f"lessons.{field}",
                        learning.text_sha256(text),
                        text,
                    )
                )
    return fragments


def capture_errors(index: dict[str, Any], *, root: Path) -> list[str]:
    captured = captured_fragments(index)
    errors: list[str] = []
    for path, run_id, source_field, source_hash, text in reusable_run_fragments(root):
        key = (path, run_id, source_field, source_hash)
        if key in captured:
            continue
        preview = text if len(text) <= 120 else text[:117] + "..."
        errors.append(
            f"unindexed reusable run lesson: {path} run_id={run_id} {source_field} "
            f"sha256={source_hash} text={preview!r}"
        )
    return errors


def main() -> int:
    index, shards, combine_errors = learning.load_combined_index(ROOT)
    errors = list(combine_errors)
    if not errors:
        errors.extend(capture_errors(index, root=ROOT))
    if errors:
        print("FAIL frontend learning capture audit")
        for error in errors:
            print(f"  - {error}")
        return 1

    fragments = reusable_run_fragments(ROOT)
    print("PASS frontend learning capture audit")
    print(
        f"  shards={len(shards)} reusable_run_fragments={len(fragments)} "
        f"indexed={len(captured_fragments(index))}"
    )
    print("  observations remain in run records; only reusable lifecycle fields require cross-run indexing")
    return 0


if __name__ == "__main__":
    sys.exit(main())
