#!/usr/bin/env python3
from __future__ import annotations

import argparse
import copy
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import intake

DECISION_STATES = {"unknown", "provisional", "observed", "confirmed", "superseded"}
SOURCE_WEIGHT = {
    "human": 1.0,
    "requirement": 1.0,
    "policy": 0.95,
    "figma-observation": 0.9,
    "repo-observation": 0.9,
    "unknown": 0.0,
}
RISK_WEIGHT = {"blocking": 3, "review": 2, "info": 1}


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def parse_time(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def dependency_graph() -> dict[str, set[str]]:
    graph: dict[str, set[str]] = {}
    for question in intake.catalog():
        for dependency in question.get("when", {}):
            graph.setdefault(dependency, set()).add(question["id"])
    return graph


def transitive_dependents(question_id: str) -> list[str]:
    graph = dependency_graph()
    seen: set[str] = set()
    stack = list(graph.get(question_id, set()))
    while stack:
        current = stack.pop()
        if current in seen:
            continue
        seen.add(current)
        stack.extend(graph.get(current, set()))
    return sorted(seen)


def answer_state(answer: Any) -> str:
    if not isinstance(answer, dict) or intake.is_unresolved(answer.get("value")):
        return "unknown"
    return answer.get("state", "confirmed" if answer.get("source") == "human" else "observed")


def validate_states(profile: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    for key, answer in profile.get("answers", {}).items():
        if not isinstance(answer, dict):
            continue
        state = answer_state(answer)
        if state not in DECISION_STATES:
            errors.append(f"{key}: state must be one of {sorted(DECISION_STATES)}")
        if state == "confirmed" and answer.get("source") == "unknown":
            errors.append(f"{key}: confirmed answer cannot have unknown source")
    return errors


def append_history(profile: dict[str, Any], event: dict[str, Any]) -> None:
    event = {"at": now_iso(), **event}
    profile.setdefault("decisionHistory", []).append(event)


def evolve(profile: dict[str, Any], question_id: str, value: Any, *, state: str, source: str, confidence: float,
           evidence: str, decided_by: str, reason: str) -> dict[str, Any]:
    if state not in DECISION_STATES - {"superseded"}:
        raise ValueError("new decision state must be unknown/provisional/observed/confirmed")
    previous = copy.deepcopy(profile.get("answers", {}).get(question_id))
    if previous:
        previous["state"] = "superseded"
    profile.setdefault("answers", {})[question_id] = {
        "value": value,
        "source": source,
        "confidence": confidence,
        "evidence": evidence,
        "decidedBy": decided_by,
        "state": state,
        "updatedAt": now_iso(),
    }
    append_history(profile, {
        "type": "decision-change",
        "question": question_id,
        "previous": previous,
        "current": copy.deepcopy(profile["answers"][question_id]),
        "reason": reason,
        "impactedQuestions": transitive_dependents(question_id),
    })
    return profile


def evidence_report(profile: dict[str, Any]) -> dict[str, Any]:
    active = intake.active_questions(profile)
    total_weight = 0.0
    earned = 0.0
    counts: dict[str, int] = {}
    unsupported: list[str] = []
    for question in active:
        severity = question.get("severity", "info")
        weight = float(RISK_WEIGHT.get(severity, 1))
        total_weight += weight
        answer = profile.get("answers", {}).get(question["id"])
        if not isinstance(answer, dict) or intake.is_unresolved(answer.get("value")):
            unsupported.append(question["id"])
            continue
        source = answer.get("source", "unknown")
        confidence = float(answer.get("confidence", 0) or 0)
        state_factor = {"provisional": 0.65, "observed": 0.85, "confirmed": 1.0, "unknown": 0.0, "superseded": 0.0}.get(answer_state(answer), 0.5)
        earned += weight * SOURCE_WEIGHT.get(source, 0.0) * confidence * state_factor
        counts[source] = counts.get(source, 0) + 1
    score = 100.0 if total_weight == 0 else round(earned / total_weight * 100, 1)
    return {"score": score, "sourceCounts": counts, "unsupported": unsupported, "activeQuestionCount": len(active)}


def expired_answers(profile: dict[str, Any], as_of: datetime) -> list[dict[str, Any]]:
    expired: list[dict[str, Any]] = []
    for key, answer in profile.get("answers", {}).items():
        if not isinstance(answer, dict):
            continue
        expires = parse_time(answer.get("expiresAt"))
        if expires and expires <= as_of:
            expired.append({"id": key, "expiresAt": answer["expiresAt"], "value": answer.get("value")})
    return expired


def question_budget(profile: dict[str, Any], limit: int) -> list[dict[str, Any]]:
    graph = dependency_graph()
    pending = intake.unresolved_questions(profile)
    ranked = sorted(
        pending,
        key=lambda q: (
            -RISK_WEIGHT.get(q.get("severity", "info"), 1),
            -len(graph.get(q["id"], set())),
            q["id"],
        ),
    )
    return ranked[:max(0, limit)]


def impact_report(profile: dict[str, Any], changed: list[str]) -> dict[str, Any]:
    affected: set[str] = set(changed)
    for item in changed:
        affected.update(transitive_dependents(item))
    plan = intake.compile_plan(profile)
    check_map = {
        "target.runtime": ["runtime-errors", "scope-boundary"],
        "target.pageType": ["responsive-overflow", "human-editability-review"],
        "integration.mode": ["scope-boundary", "human-editability-review"],
        "cms.mode": ["cms-mutation-robustness"],
        "cms.acf": ["acf-field-definition-validation", "cms-mutation-robustness"],
        "responsive.references": ["reference-width-capture", "responsive-overflow", "visual-fidelity"],
        "responsive.intermediate": ["responsive-overflow"],
        "assets.pcSp": ["visual-fidelity"],
        "interaction.slider": ["runtime-errors", "responsive-overflow"],
        "qa.visualReference": ["visual-fidelity", "reference-width-capture"],
        "qa.cmsMutation": ["cms-mutation-robustness"],
        "editability.human": ["human-editability-review"],
    }
    checks: set[str] = set()
    for item in affected:
        checks.update(check_map.get(item, []))
    return {
        "changed": changed,
        "affectedQuestions": sorted(affected - set(changed)),
        "rerunChecks": sorted(checks.intersection(plan.get("requiredChecks", [])) or checks),
        "fullPlanFingerprint": plan.get("decisionFingerprint"),
    }


def apply_overlay(profile: dict[str, Any], overlay: dict[str, Any]) -> dict[str, Any]:
    result = copy.deepcopy(profile)
    for question_id, default in overlay.get("answers", {}).items():
        current = result.setdefault("answers", {}).get(question_id)
        if current and not intake.is_unresolved(current.get("value")):
            continue
        answer = copy.deepcopy(default)
        answer.setdefault("source", "policy")
        answer.setdefault("confidence", 1.0)
        answer.setdefault("decidedBy", "policy")
        answer.setdefault("evidence", f"Company/project overlay: {overlay.get('name', 'unnamed')}")
        answer.setdefault("state", "provisional")
        result["answers"][question_id] = answer
    append_history(result, {"type": "overlay-applied", "overlay": overlay.get("name", "unnamed")})
    return result


def apply_recon(profile: dict[str, Any], observations: dict[str, Any]) -> dict[str, Any]:
    result = copy.deepcopy(profile)
    for question_id, observation in observations.get("answers", {}).items():
        if question_id not in {q["id"] for q in intake.catalog()}:
            continue
        current = result.setdefault("answers", {}).get(question_id)
        if current and answer_state(current) == "confirmed":
            continue
        candidate = copy.deepcopy(observation)
        candidate.setdefault("source", "repo-observation")
        candidate.setdefault("confidence", 0.7)
        candidate.setdefault("decidedBy", "ai")
        candidate.setdefault("evidence", "Automated reconnaissance observation")
        candidate.setdefault("state", "observed")
        result["answers"][question_id] = candidate
    append_history(result, {"type": "recon-applied", "source": observations.get("source", "recon")})
    return result


def record_override(profile: dict[str, Any], question_id: str, previous: Any, current: Any, reason: str, actor: str) -> dict[str, Any]:
    result = copy.deepcopy(profile)
    result.setdefault("overrideLedger", []).append({
        "at": now_iso(), "question": question_id, "from": previous, "to": current, "reason": reason, "actor": actor,
    })
    return result


def learning_update(ledger: dict[str, Any], event: dict[str, Any]) -> dict[str, Any]:
    result = copy.deepcopy(ledger)
    result.setdefault("version", 1)
    result.setdefault("events", []).append({"at": now_iso(), **event})
    stats = result.setdefault("questionStats", {})
    question = event.get("question")
    if question:
        row = stats.setdefault(question, {"asked": 0, "preventedRework": 0, "lateDiscovery": 0, "noValue": 0})
        kind = event.get("kind")
        if kind == "asked": row["asked"] += 1
        elif kind == "prevented-rework": row["preventedRework"] += 1
        elif kind == "late-discovery": row["lateDiscovery"] += 1
        elif kind == "no-value": row["noValue"] += 1
        row["utility"] = row["preventedRework"] * 3 + row["lateDiscovery"] * 2 - row["noValue"]
    return result


def complexity_report(manifest: dict[str, Any]) -> dict[str, Any]:
    sections = []
    for section in manifest.get("sections", []):
        files = int(section.get("implementationFiles", 0))
        abstractions = int(section.get("abstractions", 0))
        conditions = int(section.get("conditionalBranches", 0))
        figma_nodes = max(1, int(section.get("figmaStructuralNodes", 1)))
        score = round((files * 1.2 + abstractions * 2.0 + conditions * 0.8) / figma_nodes, 2)
        level = "high" if score >= 1.5 else "review" if score >= 0.8 else "normal"
        sections.append({"id": section.get("id"), "score": score, "level": level})
    return {"sections": sections, "high": [s["id"] for s in sections if s["level"] == "high"]}


def reverse_audit(profile: dict[str, Any], observed: dict[str, Any]) -> dict[str, Any]:
    expected = intake.compile_plan(profile)
    expected_directives = set(expected.get("implementationDirectives", []))
    observed_directives = set(observed.get("implementationDirectives", []))
    expected_checks = set(expected.get("requiredChecks", []))
    observed_checks = set(observed.get("executedChecks", []))
    return {
        "missingImplementationDirectives": sorted(expected_directives - observed_directives),
        "unexpectedImplementationDirectives": sorted(observed_directives - expected_directives),
        "missingChecks": sorted(expected_checks - observed_checks),
        "pass": not (expected_directives - observed_directives or expected_checks - observed_checks),
    }


def route_checks(profile: dict[str, Any]) -> dict[str, Any]:
    checks = intake.compile_plan(profile).get("requiredChecks", [])
    full_names = {"visual-fidelity", "cms-mutation-robustness", "human-editability-review", "reference-width-capture"}
    return {
        "light": [c for c in checks if c not in full_names],
        "full": [c for c in checks if c in full_names],
    }


def dump(payload: dict[str, Any], output: str | None) -> None:
    if output:
        intake.write_json(Path(output), payload)
    else:
        print(json.dumps(payload, ensure_ascii=False, indent=2))


def main() -> int:
    parser = argparse.ArgumentParser(description="Adaptive implementation decision engine")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("report"); p.add_argument("profile"); p.add_argument("--as-of"); p.add_argument("--output")
    p = sub.add_parser("impact"); p.add_argument("profile"); p.add_argument("--changed", nargs="+", required=True); p.add_argument("--output")
    p = sub.add_parser("budget"); p.add_argument("profile"); p.add_argument("--limit", type=int, default=3); p.add_argument("--output")
    p = sub.add_parser("evolve"); p.add_argument("profile"); p.add_argument("--question", required=True); p.add_argument("--value", required=True); p.add_argument("--state", choices=sorted(DECISION_STATES - {"superseded"}), required=True); p.add_argument("--source", default="human"); p.add_argument("--confidence", type=float, default=1.0); p.add_argument("--evidence", required=True); p.add_argument("--decided-by", default="owner"); p.add_argument("--reason", required=True); p.add_argument("--output", required=True)
    p = sub.add_parser("overlay"); p.add_argument("profile"); p.add_argument("overlay"); p.add_argument("--output", required=True)
    p = sub.add_parser("recon"); p.add_argument("profile"); p.add_argument("observations"); p.add_argument("--output", required=True)
    p = sub.add_parser("override"); p.add_argument("profile"); p.add_argument("--question", required=True); p.add_argument("--from-value"); p.add_argument("--to-value", required=True); p.add_argument("--reason", required=True); p.add_argument("--actor", default="owner"); p.add_argument("--output", required=True)
    p = sub.add_parser("learn"); p.add_argument("ledger"); p.add_argument("--question", required=True); p.add_argument("--kind", choices=["asked", "prevented-rework", "late-discovery", "no-value"], required=True); p.add_argument("--note", default=""); p.add_argument("--output", required=True)
    p = sub.add_parser("complexity"); p.add_argument("manifest"); p.add_argument("--output")
    p = sub.add_parser("reverse-audit"); p.add_argument("profile"); p.add_argument("observed"); p.add_argument("--output")
    p = sub.add_parser("route"); p.add_argument("profile"); p.add_argument("--output")

    args = parser.parse_args()
    if args.command in {"report", "impact", "budget", "evolve", "overlay", "recon", "override", "reverse-audit", "route"}:
        profile = intake.load_json(Path(args.profile))
        errors = intake.validate_profile(profile) + validate_states(profile)
        if errors:
            raise SystemExit("Invalid profile: " + "; ".join(errors))

    if args.command == "report":
        as_of = parse_time(args.as_of) or datetime.now(timezone.utc)
        dump({"evidenceCoverage": evidence_report(profile), "expiredAssumptions": expired_answers(profile, as_of), "questionBudget": [q["id"] for q in question_budget(profile, 3)]}, args.output)
    elif args.command == "impact": dump(impact_report(profile, args.changed), args.output)
    elif args.command == "budget": dump({"questions": [q["id"] for q in question_budget(profile, args.limit)]}, args.output)
    elif args.command == "evolve":
        value: Any = args.value
        try: value = json.loads(args.value)
        except json.JSONDecodeError: pass
        dump(evolve(profile, args.question, value, state=args.state, source=args.source, confidence=args.confidence, evidence=args.evidence, decided_by=args.decided_by, reason=args.reason), args.output)
    elif args.command == "overlay": dump(apply_overlay(profile, intake.load_json(Path(args.overlay))), args.output)
    elif args.command == "recon": dump(apply_recon(profile, intake.load_json(Path(args.observations))), args.output)
    elif args.command == "override": dump(record_override(profile, args.question, args.from_value, args.to_value, args.reason, args.actor), args.output)
    elif args.command == "learn":
        path = Path(args.ledger); ledger = intake.load_json(path) if path.exists() else {"version": 1, "events": [], "questionStats": {}}
        dump(learning_update(ledger, {"question": args.question, "kind": args.kind, "note": args.note}), args.output)
    elif args.command == "complexity": dump(complexity_report(intake.load_json(Path(args.manifest))), args.output)
    elif args.command == "reverse-audit": dump(reverse_audit(profile, intake.load_json(Path(args.observed))), args.output)
    elif args.command == "route": dump(route_checks(profile), args.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
