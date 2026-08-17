#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import adaptive
import intake


def parse_time(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def confidence_decay(profile: dict[str, Any], as_of: datetime, threshold: float = 0.65) -> dict[str, Any]:
    rows: list[dict[str, Any]] = []
    stale: list[str] = []
    for question_id, answer in profile.get("answers", {}).items():
        if not isinstance(answer, dict) or intake.is_unresolved(answer.get("value")):
            continue
        base = float(answer.get("confidence", 0) or 0)
        effective = base
        age_days = 0.0
        if answer.get("volatile"):
            observed = parse_time(answer.get("observedAt") or answer.get("updatedAt"))
            half_life = float(answer.get("halfLifeDays", 30) or 30)
            if observed and half_life > 0:
                age_days = max(0.0, (as_of - observed).total_seconds() / 86400)
                effective = base * math.pow(0.5, age_days / half_life)
        effective = round(effective, 3)
        row = {"id": question_id, "baseConfidence": base, "effectiveConfidence": effective, "ageDays": round(age_days, 1), "volatile": bool(answer.get("volatile"))}
        rows.append(row)
        if effective < threshold:
            stale.append(question_id)
    return {"threshold": threshold, "answers": rows, "needsRecheck": sorted(stale)}


def learned_question_budget(profile: dict[str, Any], ledger: dict[str, Any], limit: int) -> dict[str, Any]:
    graph = adaptive.dependency_graph()
    stats = ledger.get("questionStats", {}) if isinstance(ledger, dict) else {}
    ranked = []
    for question in intake.unresolved_questions(profile):
        utility = float(stats.get(question["id"], {}).get("utility", 0) or 0)
        score = adaptive.RISK_WEIGHT.get(question.get("severity", "info"), 1) * 100 + len(graph.get(question["id"], set())) * 10 + utility * 5
        ranked.append({"id": question["id"], "severity": question.get("severity"), "score": round(score, 1), "learnedUtility": utility})
    ranked.sort(key=lambda item: (-item["score"], item["id"]))
    return {"questions": ranked[:max(0, limit)]}


def ownership_report(manifest: dict[str, Any]) -> dict[str, Any]:
    allowed_types = {"section", "code", "asset", "interaction", "cms"}
    errors: list[str] = []
    rows: list[dict[str, Any]] = []
    seen: set[str] = set()
    for index, item in enumerate(manifest.get("ownership", [])):
        if not isinstance(item, dict):
            errors.append(f"ownership[{index}] must be an object")
            continue
        item_id = item.get("id")
        if not isinstance(item_id, str) or not item_id.strip():
            errors.append(f"ownership[{index}].id missing")
            continue
        if item_id in seen:
            errors.append(f"duplicate ownership id: {item_id}")
        seen.add(item_id)
        kind = item.get("type")
        if kind not in allowed_types:
            errors.append(f"{item_id}: invalid type {kind}")
        owners = item.get("owners", [])
        if not isinstance(owners, list) or not all(isinstance(v, str) and v.strip() for v in owners):
            errors.append(f"{item_id}: owners must be an array of non-empty strings")
            owners = []
        elif not owners:
            errors.append(f"{item_id}: at least one owner path is required")
        evidence = item.get("evidence")
        if not evidence:
            errors.append(f"{item_id}: ownership evidence required")
        rows.append({"id": item_id, "type": kind, "owners": owners, "humanEditable": bool(item.get("humanEditable")), "figmaNode": item.get("figmaNode")})
    unresolved = [row["id"] for row in rows if not row["owners"]]
    coverage = 100.0 if not rows else round((len(rows) - len(unresolved)) / len(rows) * 100, 1)
    return {"valid": not errors, "errors": errors, "coverage": coverage, "unresolved": unresolved, "ownership": rows}


def change_recheck_plan(profile: dict[str, Any], changed: list[str], ledger: dict[str, Any] | None = None) -> dict[str, Any]:
    impact = adaptive.impact_report(profile, changed)
    budget = learned_question_budget(profile, ledger or {}, 5)
    return {
        "changed": changed,
        "affectedQuestions": impact["affectedQuestions"],
        "rerunChecks": impact["rerunChecks"],
        "nextQuestions": budget["questions"],
        "principle": "Re-question and re-run only impacted decisions/checks; do not freeze the original intake.",
    }


def write(payload: dict[str, Any], output: str | None) -> None:
    if output:
        intake.write_json(Path(output), payload)
    else:
        print(json.dumps(payload, ensure_ascii=False, indent=2))


def main() -> int:
    parser = argparse.ArgumentParser(description="Implementation decision governance")
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("decay"); p.add_argument("profile"); p.add_argument("--as-of"); p.add_argument("--threshold", type=float, default=0.65); p.add_argument("--output")
    p = sub.add_parser("learned-budget"); p.add_argument("profile"); p.add_argument("ledger"); p.add_argument("--limit", type=int, default=3); p.add_argument("--output")
    p = sub.add_parser("ownership"); p.add_argument("manifest"); p.add_argument("--output")
    p = sub.add_parser("recheck"); p.add_argument("profile"); p.add_argument("--changed", nargs="+", required=True); p.add_argument("--ledger"); p.add_argument("--output")
    args = parser.parse_args()
    if args.command == "decay":
        profile = intake.load_json(Path(args.profile)); as_of = parse_time(args.as_of) or datetime.now(timezone.utc); write(confidence_decay(profile, as_of, args.threshold), args.output)
    elif args.command == "learned-budget":
        write(learned_question_budget(intake.load_json(Path(args.profile)), intake.load_json(Path(args.ledger)), args.limit), args.output)
    elif args.command == "ownership": write(ownership_report(intake.load_json(Path(args.manifest))), args.output)
    elif args.command == "recheck":
        ledger = intake.load_json(Path(args.ledger)) if args.ledger else None; write(change_recheck_plan(intake.load_json(Path(args.profile)), args.changed, ledger), args.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
