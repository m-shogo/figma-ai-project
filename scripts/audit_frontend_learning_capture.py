#!/usr/bin/env python3
from __future__ import annotations

import argparse
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


def run_reference_id(run: dict[str, Any]) -> str:
    reference = run.get("reference", {})
    if isinstance(reference, dict) and str(reference.get("reference_id", "")).strip():
        return str(reference["reference_id"]).strip()
    return str(run.get("reference_id", "")).strip()


def reusable_run_fragment_records(root: Path) -> list[dict[str, str]]:
    fragments: list[dict[str, str]] = []
    for path, run in run_records(root):
        relative = path.relative_to(root).as_posix()
        run_id = str(run.get("run_id", "")).strip()
        reference_id = run_reference_id(run)
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
                    {
                        "path": relative,
                        "run_id": run_id,
                        "reference_id": reference_id,
                        "source_field": f"lessons.{field}",
                        "source_text_sha256": learning.text_sha256(text),
                        "source_text": text,
                    }
                )
    return fragments


def reusable_run_fragments(root: Path) -> list[tuple[str, str, str, str, str]]:
    return [
        (
            item["path"],
            item["run_id"],
            item["source_field"],
            item["source_text_sha256"],
            item["source_text"],
        )
        for item in reusable_run_fragment_records(root)
    ]


def unindexed_fragment_records(index: dict[str, Any], *, root: Path) -> list[dict[str, str]]:
    captured = captured_fragments(index)
    return [
        item
        for item in reusable_run_fragment_records(root)
        if (
            item["path"],
            item["run_id"],
            item["source_field"],
            item["source_text_sha256"],
        )
        not in captured
    ]


def capture_errors(index: dict[str, Any], *, root: Path) -> list[str]:
    errors: list[str] = []
    for item in unindexed_fragment_records(index, root=root):
        text = item["source_text"]
        preview = text if len(text) <= 120 else text[:117] + "..."
        errors.append(
            f"unindexed reusable run lesson: {item['path']} run_id={item['run_id']} "
            f"{item['source_field']} sha256={item['source_text_sha256']} text={preview!r}"
        )
    return errors


def suggested_relation(source_field: str) -> str:
    if source_field in {"lessons.contradicted_rules", "lessons.demotion_candidates"}:
        return "contradicts"
    if source_field == "lessons.rules_needing_retest":
        return "review"
    return "supports"


def capture_proposals(index: dict[str, Any], *, root: Path) -> list[dict[str, str]]:
    proposals: list[dict[str, str]] = []
    for item in unindexed_fragment_records(index, root=root):
        proposals.append(
            {
                "reference_id": item["reference_id"],
                "run_id": item["run_id"],
                "path": item["path"],
                "source_field": item["source_field"],
                "source_text_sha256": item["source_text_sha256"],
                "source_text": item["source_text"],
                "suggested_relation": suggested_relation(item["source_field"]),
            }
        )
    return proposals


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Audit reusable run lessons and optionally print evidence-only capture proposals"
    )
    parser.add_argument(
        "--propose",
        action="store_true",
        help="Print exact unindexed run/source/hash metadata as YAML without modifying evidence indexes",
    )
    args = parser.parse_args()

    index, shards, combine_errors = learning.load_combined_index(ROOT)
    if combine_errors:
        print("FAIL frontend learning capture audit")
        for error in combine_errors:
            print(f"  - {error}")
        return 1

    if args.propose:
        print(yaml.safe_dump({"capture_proposals": capture_proposals(index, root=ROOT)}, sort_keys=False).rstrip())
        return 0

    errors = capture_errors(index, root=ROOT)
    if errors:
        print("FAIL frontend learning capture audit")
        for error in errors:
            print(f"  - {error}")
        print("  - run with --propose to print exact evidence fragments for review")
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
