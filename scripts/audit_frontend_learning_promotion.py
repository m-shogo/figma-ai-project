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


def parse_date(value: Any, *, label: str) -> date:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{label} must be a YYYY-MM-DD string")
    try:
        return date.fromisoformat(value.strip())
    except ValueError as exc:
        raise ValueError(f"{label} must be YYYY-MM-DD, got {value!r}") from exc


def material_text(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def evidence_index() -> dict[str, dict[str, Any]]:
    records: dict[str, dict[str, Any]] = {}
    for path in sorted((ROOT / "research").glob(EVIDENCE_GLOB)):
        data = load_yaml(path)
        for record in data.get("records", []):
            if not isinstance(record, dict):
                continue
            learning_id = str(record.get("learning_id", "")).strip()
            if learning_id and learning_id not in records:
                records[learning_id] = record
    return records


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


def audit_candidate(
    path: Path,
    *,
    today: date,
    policy: dict[str, Any],
    indexed: dict[str, dict[str, Any]],
) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    notes: list[str] = []
    data = load_yaml(path)
    rule_id = str(data.get("rule_id", "")).strip()
    label = path.relative_to(ROOT).as_posix()

    if not rule_id:
        return [f"{label}: rule_id is required"], notes

    record = indexed.get(rule_id)
    if record is None:
        errors.append(f"{label}: {rule_id} is missing from research/frontend-learning-evidence*.yaml")
        refs: set[str] = set()
    else:
        state = record.get("promotion_state")
        if state != "CANDIDATE":
            errors.append(
                f"{label}: {rule_id} lives under playbook/candidates but evidence index state is {state!r}; "
                "move/promote/demote the rule explicitly"
            )
        refs = supporting_references(record)

    if not isinstance(data.get("retest_triggers"), list) or not any(
        material_text(item) for item in data.get("retest_triggers", [])
    ):
        errors.append(f"{label}: retest_triggers must contain at least one concrete trigger")

    review = data.get("promotion_review")
    if not isinstance(review, dict):
        errors.append(f"{label}: promotion_review is required")
        return errors, notes

    allowed_statuses = set(policy.get("review_statuses", []))
    status = str(review.get("status", "")).strip()
    if status not in allowed_statuses:
        errors.append(f"{label}: promotion_review.status {status!r} is not allowed")

    try:
        last_reviewed = parse_date(review.get("last_reviewed_at"), label=f"{label}.promotion_review.last_reviewed_at")
        next_review = parse_date(review.get("next_review_at"), label=f"{label}.promotion_review.next_review_at")
    except ValueError as exc:
        errors.append(str(exc))
        return errors, notes

    if next_review < last_reviewed:
        errors.append(f"{label}: next_review_at must not be before last_reviewed_at")

    sla = policy.get("sla", {})
    max_days = int(sla.get("candidate_review_max_days", 14))
    if status == "READY_FOR_PROVEN":
        max_days = int(sla.get("ready_for_proven_max_days", 7))

    review_window = (next_review - last_reviewed).days
    if review_window > max_days:
        errors.append(
            f"{label}: review window is {review_window} days; {status or 'candidate'} maximum is {max_days} days"
        )

    if next_review < today:
        errors.append(
            f"{label}: promotion review overdue since {next_review.isoformat()} "
            f"({(today - next_review).days} days); choose KEEP_CANDIDATE / RETEST_REQUIRED / "
            "READY_FOR_PROVEN / DEMOTE / RETIRE with current evidence"
        )

    for field in ("reason", "trigger"):
        if not material_text(review.get(field)):
            errors.append(f"{label}: promotion_review.{field} must be concrete and non-empty")

    evidence_needed = review.get("evidence_needed")
    if status in {"KEEP_CANDIDATE", "RETEST_REQUIRED", "READY_FOR_PROVEN"}:
        if not isinstance(evidence_needed, list) or not any(material_text(item) for item in evidence_needed):
            errors.append(f"{label}: {status} requires non-empty promotion_review.evidence_needed")

    active_gate = policy.get("promotion_gates", {}).get("active", {})
    min_refs = int(active_gate.get("distinct_reference_minimum", 2))
    if status == "READY_FOR_PROVEN" and len(refs) < min_refs:
        errors.append(
            f"{label}: READY_FOR_PROVEN requires at least {min_refs} distinct supporting references; found {len(refs)}"
        )

    days_until = (next_review - today).days
    notes.append(
        f"{rule_id}: status={status} refs={len(refs)} next_review={next_review.isoformat()} "
        f"days_until={days_until}"
    )
    return errors, notes


def main() -> int:
    parser = argparse.ArgumentParser(description="Fail when portable frontend learning candidates stagnate")
    parser.add_argument(
        "--today",
        help="Override today's date as YYYY-MM-DD for deterministic tests/replays",
    )
    args = parser.parse_args()

    try:
        today = date.fromisoformat(args.today) if args.today else date.today()
    except ValueError:
        print(f"FAIL invalid --today value: {args.today!r}")
        return 2

    policy = load_yaml(POLICY_PATH)
    indexed = evidence_index()
    candidate_paths = sorted(
        path for path in CANDIDATE_DIR.glob("*.yaml") if path.is_file()
    )

    errors: list[str] = []
    notes: list[str] = []
    seen_ids: set[str] = set()
    for path in candidate_paths:
        data = load_yaml(path)
        rule_id = str(data.get("rule_id", "")).strip()
        if rule_id in seen_ids and rule_id:
            errors.append(f"{path.relative_to(ROOT)}: duplicate candidate rule_id {rule_id}")
        seen_ids.add(rule_id)
        candidate_errors, candidate_notes = audit_candidate(
            path,
            today=today,
            policy=policy,
            indexed=indexed,
        )
        errors.extend(candidate_errors)
        notes.extend(candidate_notes)

    if errors:
        print("FAIL frontend learning promotion backlog")
        for error in errors:
            print(f"  - {error}")
        print("  - canonical: docs/frontend-learning-promotion-policy.md")
        return 1

    print("PASS frontend learning promotion backlog")
    print(f"  today={today.isoformat()} candidates={len(candidate_paths)} indexed_learning_records={len(indexed)}")
    for note in notes:
        print(f"  - {note}")
    print("  auto_promotion=false; this audit forces review timing, not semantic promotion")
    return 0


if __name__ == "__main__":
    sys.exit(main())
