#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sys
from datetime import date
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
POLICY_PATH = ROOT / "config" / "frontend-learning-promotion-policy.yaml"
CANDIDATE_DIR = ROOT / "playbook" / "candidates"
EVIDENCE_GLOB = "frontend-learning-evidence*.yaml"


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"top-level YAML value must be an object: {path}")
    return value


def material_text(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def parse_date(value: Any, *, label: str) -> date:
    if not material_text(value):
        raise ValueError(f"{label} must be a YYYY-MM-DD string")
    try:
        return date.fromisoformat(str(value).strip())
    except ValueError as exc:
        raise ValueError(f"{label} must be YYYY-MM-DD, got {value!r}") from exc


def load_evidence_index() -> tuple[dict[str, dict[str, Any]], list[str]]:
    records: dict[str, dict[str, Any]] = {}
    errors: list[str] = []
    for path in sorted((ROOT / "research").glob(EVIDENCE_GLOB)):
        data = load_yaml(path)
        for record in data.get("records", []):
            if not isinstance(record, dict):
                continue
            learning_id = str(record.get("learning_id", "")).strip()
            if not learning_id:
                continue
            if learning_id in records:
                errors.append(f"duplicate learning_id across evidence shards: {learning_id}")
                continue
            records[learning_id] = record
    return records, errors


def is_review_candidate(record: dict[str, Any]) -> bool:
    promotion = record.get("promotion", {})
    candidate_flag = isinstance(promotion, dict) and promotion.get("candidate") is True
    return record.get("promotion_state") == "CANDIDATE" or candidate_flag


def supporting_references(record: dict[str, Any]) -> set[str]:
    evidence = record.get("evidence", {})
    if not isinstance(evidence, dict):
        return set()
    output: set[str] = set()
    for item in evidence.get("supports", []):
        if not isinstance(item, dict):
            continue
        reference_id = str(item.get("reference_id", "")).strip()
        if reference_id:
            output.add(reference_id)
    return output


def load_queue(policy: dict[str, Any]) -> tuple[Path, dict[str, dict[str, Any]], list[str]]:
    errors: list[str] = []
    queue_value = str(policy.get("queue_path", "")).strip()
    if not queue_value:
        return ROOT, {}, ["promotion policy must define queue_path"]
    queue_path = (ROOT / queue_value).resolve()
    if ROOT.resolve() not in queue_path.parents or not queue_path.is_file():
        return queue_path, {}, [f"promotion queue path is missing or outside repository: {queue_value}"]

    data = load_yaml(queue_path)
    entries: dict[str, dict[str, Any]] = {}
    for index, entry in enumerate(data.get("entries", [])):
        if not isinstance(entry, dict):
            errors.append(f"{queue_value}: entries[{index}] must be an object")
            continue
        learning_id = str(entry.get("learning_id", "")).strip()
        if not learning_id:
            errors.append(f"{queue_value}: entries[{index}].learning_id is required")
            continue
        if learning_id in entries:
            errors.append(f"{queue_value}: duplicate queue learning_id {learning_id}")
            continue
        entries[learning_id] = entry
    return queue_path, entries, errors


def audit_review_entry(
    learning_id: str,
    review: dict[str, Any],
    *,
    today: date,
    policy: dict[str, Any],
    refs: set[str],
    label: str,
) -> tuple[list[str], str | None]:
    errors: list[str] = []
    allowed_statuses = set(policy.get("review_statuses", []))
    status = str(review.get("status", "")).strip()
    if status not in allowed_statuses:
        errors.append(f"{label}: status {status!r} is not allowed")

    try:
        last_reviewed = parse_date(review.get("last_reviewed_at"), label=f"{label}.last_reviewed_at")
        next_review = parse_date(review.get("next_review_at"), label=f"{label}.next_review_at")
    except ValueError as exc:
        errors.append(str(exc))
        return errors, None

    if next_review < last_reviewed:
        errors.append(f"{label}: next_review_at must not be before last_reviewed_at")

    sla = policy.get("sla", {})
    max_days = int(sla.get("candidate_review_max_days", 14))
    if status == "READY_FOR_PROVEN":
        max_days = int(sla.get("ready_for_proven_max_days", 7))
    review_window = (next_review - last_reviewed).days
    if review_window > max_days:
        errors.append(f"{label}: review window is {review_window} days; maximum is {max_days} days")

    if next_review < today:
        errors.append(
            f"{label}: overdue since {next_review.isoformat()} ({(today - next_review).days} days); "
            "make an explicit KEEP_CANDIDATE / RETEST_REQUIRED / READY_FOR_PROVEN / DEMOTE / RETIRE decision"
        )

    for field in ("reason", "trigger"):
        if not material_text(review.get(field)):
            errors.append(f"{label}.{field} must be concrete and non-empty")

    evidence_needed = review.get("evidence_needed")
    if status in {"KEEP_CANDIDATE", "RETEST_REQUIRED", "READY_FOR_PROVEN"}:
        if not isinstance(evidence_needed, list) or not any(material_text(item) for item in evidence_needed):
            errors.append(f"{label}: {status} requires non-empty evidence_needed")

    min_refs = int(policy.get("promotion_gates", {}).get("active", {}).get("distinct_reference_minimum", 2))
    if status == "READY_FOR_PROVEN" and len(refs) < min_refs:
        errors.append(
            f"{label}: READY_FOR_PROVEN requires at least {min_refs} distinct supporting references; found {len(refs)}"
        )

    note = (
        f"{learning_id}: status={status} refs={len(refs)} "
        f"next_review={next_review.isoformat()} days_until={(next_review - today).days}"
    )
    return errors, note


def audit_playbook_candidates(
    *,
    indexed: dict[str, dict[str, Any]],
    queue: dict[str, dict[str, Any]],
) -> list[str]:
    errors: list[str] = []
    seen_ids: set[str] = set()
    for path in sorted(CANDIDATE_DIR.glob("*.yaml")):
        data = load_yaml(path)
        rule_id = str(data.get("rule_id", "")).strip()
        label = path.relative_to(ROOT).as_posix()
        if not rule_id:
            errors.append(f"{label}: rule_id is required")
            continue
        if rule_id in seen_ids:
            errors.append(f"{label}: duplicate candidate rule_id {rule_id}")
        seen_ids.add(rule_id)

        if not isinstance(data.get("retest_triggers"), list) or not any(
            material_text(item) for item in data.get("retest_triggers", [])
        ):
            errors.append(f"{label}: retest_triggers must contain at least one concrete trigger")

        record = indexed.get(rule_id)
        if record is None:
            errors.append(f"{label}: {rule_id} is missing from research/frontend-learning-evidence*.yaml")
        elif record.get("promotion_state") != "CANDIDATE":
            errors.append(
                f"{label}: playbook/candidates entry has evidence state {record.get('promotion_state')!r}; "
                "move/promote/demote it explicitly"
            )

        queue_entry = queue.get(rule_id)
        if queue_entry is None:
            errors.append(f"{label}: {rule_id} is missing from the promotion queue")
            continue

        local_review = data.get("promotion_review")
        if not isinstance(local_review, dict):
            errors.append(f"{label}: promotion_review is required")
            continue
        for field in ("last_reviewed_at", "next_review_at", "status"):
            if local_review.get(field) != queue_entry.get(field):
                errors.append(
                    f"{label}: promotion_review.{field} must match central queue "
                    f"({local_review.get(field)!r} != {queue_entry.get(field)!r})"
                )
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Fail when frontend learning promotion candidates are untracked or overdue"
    )
    parser.add_argument("--today", help="Override today's date as YYYY-MM-DD for deterministic tests/replays")
    args = parser.parse_args()

    try:
        today = date.fromisoformat(args.today) if args.today else date.today()
    except ValueError:
        print(f"FAIL invalid --today value: {args.today!r}")
        return 2

    policy = load_yaml(POLICY_PATH)
    indexed, errors = load_evidence_index()
    queue_path, queue, queue_errors = load_queue(policy)
    errors.extend(queue_errors)

    review_candidates = {
        learning_id: record for learning_id, record in indexed.items() if is_review_candidate(record)
    }
    expected_ids = set(review_candidates)
    queue_ids = set(queue)
    for missing in sorted(expected_ids - queue_ids):
        errors.append(f"promotion queue missing candidate evidence record: {missing}")
    for stale in sorted(queue_ids - expected_ids):
        errors.append(
            f"promotion queue still contains non-candidate {stale}; remove it or update lifecycle state in the same change"
        )

    notes: list[str] = []
    for learning_id in sorted(expected_ids & queue_ids):
        record = review_candidates[learning_id]
        entry_errors, note = audit_review_entry(
            learning_id,
            queue[learning_id],
            today=today,
            policy=policy,
            refs=supporting_references(record),
            label=f"{queue_path.relative_to(ROOT).as_posix()}:{learning_id}",
        )
        errors.extend(entry_errors)
        if note:
            notes.append(note)

    errors.extend(audit_playbook_candidates(indexed=indexed, queue=queue))

    if errors:
        print("FAIL frontend learning promotion backlog")
        for error in errors:
            print(f"  - {error}")
        print("  - canonical: docs/frontend-learning-promotion-policy.md")
        return 1

    print("PASS frontend learning promotion backlog")
    print(
        f"  today={today.isoformat()} indexed_learning_records={len(indexed)} "
        f"review_candidates={len(review_candidates)} queued={len(queue)}"
    )
    for note in notes:
        print(f"  - {note}")
    print("  auto_promotion=false; CI forces review timing and queue completeness, not semantic promotion")
    return 0


if __name__ == "__main__":
    sys.exit(main())
