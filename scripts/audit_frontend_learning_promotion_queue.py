#!/usr/bin/env python3
from __future__ import annotations

import argparse
import subprocess
import sys
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

import yaml

import validate_frontend_learning_evidence as learning

ROOT = Path(__file__).resolve().parents[1]
REVIEW_LEDGER_PATH = ROOT / "research" / "frontend-learning-promotion-reviews.yaml"
CANDIDATE_MAX_DAYS = 14
PROJECT_ONLY_REVIEW_DAYS = 30
DEPRECATED_REVIEW_DAYS = 60
ACTIVE_CORE_REFERENCE_THRESHOLD = 3


@dataclass(frozen=True)
class ReviewItem:
    learning_id: str
    promotion_state: str
    reason: str
    age_days: int | None
    supporting_references: int
    contradiction_count: int
    blocked_by_count: int


def parse_date(value: Any) -> date | None:
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        return datetime.strptime(value.strip(), "%Y-%m-%d").date()
    except ValueError:
        return None


def load_review_ledger() -> dict[str, dict[str, Any]]:
    if not REVIEW_LEDGER_PATH.is_file():
        return {}
    value = yaml.safe_load(REVIEW_LEDGER_PATH.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        return {}
    reviews = value.get("reviews", {})
    return reviews if isinstance(reviews, dict) else {}


def git_dates_for_learning(learning_id: str) -> tuple[date | None, date | None]:
    """Return first-seen and last-touched dates for a learning record from git history."""
    try:
        completed = subprocess.run(
            [
                "git",
                "log",
                "--format=%cs",
                "-S",
                learning_id,
                "--",
                "research/frontend-learning-evidence*.yaml",
            ],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
    except (OSError, subprocess.CalledProcessError):
        return None, None

    parsed = [d for line in completed.stdout.splitlines() if (d := parse_date(line.strip()))]
    if not parsed:
        return None, None
    return min(parsed), max(parsed)


def support_reference_ids(record: dict[str, Any]) -> set[str]:
    evidence = record.get("evidence", {})
    if not isinstance(evidence, dict):
        return set()
    supports = evidence.get("supports", [])
    if not isinstance(supports, list):
        return set()
    return {
        str(item.get("reference_id", "")).strip()
        for item in supports
        if isinstance(item, dict) and str(item.get("reference_id", "")).strip()
    }


def contradiction_count(record: dict[str, Any]) -> int:
    evidence = record.get("evidence", {})
    if not isinstance(evidence, dict):
        return 0
    items = evidence.get("contradicts", [])
    return len(items) if isinstance(items, list) else 0


def blocked_by_count(record: dict[str, Any]) -> int:
    promotion = record.get("promotion", {})
    if not isinstance(promotion, dict):
        return 0
    items = promotion.get("blocked_by", [])
    return len(items) if isinstance(items, list) else 0


def age_days(first_seen: date | None, *, today: date) -> int | None:
    return None if first_seen is None else max(0, (today - first_seen).days)


def default_due_date(state: str, first_seen: date | None) -> date | None:
    if first_seen is None:
        return None
    windows = {
        "CANDIDATE": CANDIDATE_MAX_DAYS,
        "PROJECT_ONLY": PROJECT_ONLY_REVIEW_DAYS,
        "DEPRECATED": DEPRECATED_REVIEW_DAYS,
    }
    days = windows.get(state)
    return first_seen + timedelta(days=days) if days is not None else None


def review_reason(
    *,
    state: str,
    support_refs: int,
    contradictions: int,
    first_seen: date | None,
    today: date,
    prior_review: dict[str, Any] | None,
) -> str | None:
    prior_review = prior_review or {}
    reviewed_refs = int(prior_review.get("reviewed_supporting_references", -1))
    reviewed_contradictions = int(prior_review.get("reviewed_contradictions", -1))
    next_review_due = parse_date(prior_review.get("next_review_due"))

    # New evidence after a recorded disposition reopens review immediately.
    if contradictions > max(reviewed_contradictions, 0) and state in {"CANDIDATE", "ACTIVE", "CORE"}:
        return "new contradiction requires scope/demotion/retirement review"

    if state == "CANDIDATE" and support_refs >= 2 and support_refs > max(reviewed_refs, 0):
        return "new cross-reference evidence reached ACTIVE review threshold"
    if state == "PROJECT_ONLY" and support_refs >= 2 and support_refs > max(reviewed_refs, 0):
        return "new cross-reference evidence requires scope expansion review"
    if (
        state == "ACTIVE"
        and support_refs >= ACTIVE_CORE_REFERENCE_THRESHOLD
        and support_refs > max(reviewed_refs, 0)
    ):
        return f"new evidence reached CORE review threshold ({ACTIVE_CORE_REFERENCE_THRESHOLD} references)"

    # Once a disposition is recorded, its explicit next_review_due becomes authoritative.
    if prior_review:
        if next_review_due is not None and today >= next_review_due:
            return f"recorded follow-up review date reached ({next_review_due.isoformat()})"
        return None

    due = default_due_date(state, first_seen)
    if due is not None and today >= due:
        if state == "CANDIDATE":
            return f"candidate exceeded {CANDIDATE_MAX_DAYS}-day maximum review window"
        if state == "PROJECT_ONLY":
            return f"project-only rule reached {PROJECT_ONLY_REVIEW_DAYS}-day revalidation window"
        if state == "DEPRECATED":
            return f"deprecated rule reached {DEPRECATED_REVIEW_DAYS}-day retire-or-reactivate review window"
    return None


def ledger_errors(ledger: dict[str, dict[str, Any]]) -> list[str]:
    errors: list[str] = []
    for learning_id, review in ledger.items():
        if not isinstance(review, dict):
            errors.append(f"{learning_id}: review entry must be an object")
            continue
        last_reviewed = parse_date(review.get("last_reviewed_at"))
        next_due = parse_date(review.get("next_review_due"))
        if last_reviewed is None:
            errors.append(f"{learning_id}: last_reviewed_at must use YYYY-MM-DD")
        if next_due is None:
            errors.append(f"{learning_id}: next_review_due must use YYYY-MM-DD")
        if last_reviewed is not None and next_due is not None and next_due <= last_reviewed:
            errors.append(f"{learning_id}: next_review_due must be after last_reviewed_at")
        for field in ("reviewed_supporting_references", "reviewed_contradictions"):
            value = review.get(field)
            if not isinstance(value, int) or value < 0:
                errors.append(f"{learning_id}: {field} must be a non-negative integer")
        if not str(review.get("disposition", "")).strip():
            errors.append(f"{learning_id}: disposition is required")
        if not str(review.get("rationale", "")).strip():
            errors.append(f"{learning_id}: rationale is required")
    return errors


def queue_items(index: dict[str, Any], *, today: date, ledger: dict[str, dict[str, Any]]) -> list[ReviewItem]:
    output: list[ReviewItem] = []
    records = index.get("records", [])
    if not isinstance(records, list):
        return output

    for record in records:
        if not isinstance(record, dict):
            continue
        learning_id = str(record.get("learning_id", "")).strip()
        if not learning_id:
            continue
        state = str(record.get("promotion_state") or "UNPROMOTED")
        if state in {"UNPROMOTED", "RETIRED"}:
            continue

        first_seen, _last_touched = git_dates_for_learning(learning_id)
        support_refs = len(support_reference_ids(record))
        contradictions = contradiction_count(record)
        reason = review_reason(
            state=state,
            support_refs=support_refs,
            contradictions=contradictions,
            first_seen=first_seen,
            today=today,
            prior_review=ledger.get(learning_id),
        )
        if reason is None:
            continue
        output.append(
            ReviewItem(
                learning_id=learning_id,
                promotion_state=state,
                reason=reason,
                age_days=age_days(first_seen, today=today),
                supporting_references=support_refs,
                contradiction_count=contradictions,
                blocked_by_count=blocked_by_count(record),
            )
        )
    return sorted(output, key=lambda item: (item.promotion_state, item.learning_id))


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Report frontend learning records whose promotion/demotion review is due; never auto-promote."
    )
    parser.add_argument("--fail-on-due", action="store_true", help="Exit 1 when reviews are due.")
    parser.add_argument("--today", help="Override date for deterministic tests, YYYY-MM-DD.")
    args = parser.parse_args()

    today = date.today()
    if args.today:
        parsed = parse_date(args.today)
        if parsed is None:
            print("FAIL frontend learning promotion queue\n  - --today must use YYYY-MM-DD")
            return 2
        today = parsed

    index, shards, combine_errors = learning.load_combined_index(ROOT)
    ledger = load_review_ledger()
    errors = combine_errors + ledger_errors(ledger)
    if errors:
        print("FAIL frontend learning promotion queue")
        for error in errors:
            print(f"  - {error}")
        return 1

    items = queue_items(index, today=today, ledger=ledger)
    print("PASS frontend learning promotion queue audit")
    print(f"  shards={len(shards)} recorded_reviews={len(ledger)} due_reviews={len(items)} today={today.isoformat()}")
    print(
        "  cadence: CANDIDATE<=14d, PROJECT_ONLY<=30d, ACTIVE CORE-review at >=3 refs, "
        "new contradictions immediate; reviewed items use explicit next_review_due"
    )

    if items:
        print("\nReview queue:")
        for item in items:
            age = "unknown" if item.age_days is None else str(item.age_days)
            print(
                f"  - {item.learning_id} state={item.promotion_state} age_days={age} "
                f"support_refs={item.supporting_references} contradictions={item.contradiction_count} "
                f"blocked_by={item.blocked_by_count}: {item.reason}"
            )
        print(
            "\nDisposition required: promote, narrow to PROJECT_ONLY, keep with a dated review disposition, "
            "deprecate, or retire. Do not leave a due item untouched."
        )

    return 1 if items and args.fail_on_due else 0


if __name__ == "__main__":
    sys.exit(main())
