#!/usr/bin/env python3
from __future__ import annotations

import argparse
import subprocess
import sys
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Any

import validate_frontend_learning_evidence as learning

ROOT = Path(__file__).resolve().parents[1]
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


def git_dates_for_learning(learning_id: str) -> tuple[date | None, date | None]:
    """Return first-seen and last-touched dates for a learning record from git history.

    The scheduled workflow checks out full history. When history is unavailable, return
    (None, None) and keep evidence-count triggers active instead of inventing dates.
    """

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

    values = [line.strip() for line in completed.stdout.splitlines() if line.strip()]
    parsed: list[date] = []
    for value in values:
        try:
            parsed.append(datetime.strptime(value, "%Y-%m-%d").date())
        except ValueError:
            continue
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
    if first_seen is None:
        return None
    return max(0, (today - first_seen).days)


def review_reason(
    *,
    state: str,
    support_refs: int,
    contradictions: int,
    age: int | None,
) -> str | None:
    # Evidence-strength triggers are immediate. They intentionally request a review;
    # they never change promotion_state automatically.
    if contradictions > 0 and state in {"CANDIDATE", "ACTIVE", "CORE"}:
        return "contradiction requires scope/demotion/retirement review"

    if state == "CANDIDATE":
        if support_refs >= 2:
            return "cross-reference evidence reached ACTIVE review threshold"
        if age is not None and age >= CANDIDATE_MAX_DAYS:
            return f"candidate exceeded {CANDIDATE_MAX_DAYS}-day maximum review window"

    if state == "PROJECT_ONLY":
        if support_refs >= 2:
            return "project-only rule now has cross-reference evidence; scope expansion review is due"
        if age is not None and age >= PROJECT_ONLY_REVIEW_DAYS:
            return f"project-only rule reached {PROJECT_ONLY_REVIEW_DAYS}-day revalidation window"

    if state == "ACTIVE" and support_refs >= ACTIVE_CORE_REFERENCE_THRESHOLD:
        return (
            "ACTIVE rule has at least "
            f"{ACTIVE_CORE_REFERENCE_THRESHOLD} supporting references; CORE review is due"
        )

    if state == "DEPRECATED" and age is not None and age >= DEPRECATED_REVIEW_DAYS:
        return f"deprecated rule reached {DEPRECATED_REVIEW_DAYS}-day retire-or-reactivate review window"

    return None


def queue_items(index: dict[str, Any], *, today: date) -> list[ReviewItem]:
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
        age = age_days(first_seen, today=today)
        support_refs = len(support_reference_ids(record))
        contradictions = contradiction_count(record)
        reason = review_reason(
            state=state,
            support_refs=support_refs,
            contradictions=contradictions,
            age=age,
        )
        if reason is None:
            continue
        output.append(
            ReviewItem(
                learning_id=learning_id,
                promotion_state=state,
                reason=reason,
                age_days=age,
                supporting_references=support_refs,
                contradiction_count=contradictions,
                blocked_by_count=blocked_by_count(record),
            )
        )

    return sorted(output, key=lambda item: (item.promotion_state, item.learning_id))


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Report frontend learning records whose promotion/demotion review is due. "
            "This tool never promotes automatically."
        )
    )
    parser.add_argument(
        "--fail-on-due",
        action="store_true",
        help="Exit 1 when one or more promotion reviews are due.",
    )
    parser.add_argument(
        "--today",
        help="Override today's date for deterministic tests, formatted YYYY-MM-DD.",
    )
    args = parser.parse_args()

    today = date.today()
    if args.today:
        try:
            today = datetime.strptime(args.today, "%Y-%m-%d").date()
        except ValueError:
            print("FAIL frontend learning promotion queue")
            print("  - --today must use YYYY-MM-DD")
            return 2

    index, shards, combine_errors = learning.load_combined_index(ROOT)
    if combine_errors:
        print("FAIL frontend learning promotion queue")
        for error in combine_errors:
            print(f"  - {error}")
        return 1

    items = queue_items(index, today=today)
    print("PASS frontend learning promotion queue audit")
    print(f"  shards={len(shards)} due_reviews={len(items)} today={today.isoformat()}")
    print(
        "  cadence: CANDIDATE<=14d, PROJECT_ONLY review<=30d, "
        "ACTIVE CORE-review at >=3 references, contradictions immediate"
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
            "\nDisposition required: promote, narrow to PROJECT_ONLY, keep with fresh blocker/evidence, "
            "deprecate, or retire. Do not leave a due item untouched."
        )

    if items and args.fail_on_due:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
