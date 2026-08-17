#!/usr/bin/env python3
from __future__ import annotations

import argparse
import copy
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
QUESTIONS_PATH = ROOT / "questions.json"
ALLOWED_SOURCES = {"human", "figma-observation", "repo-observation", "requirement", "policy", "unknown"}
ALLOWED_DECIDERS = {"owner", "designer", "developer", "ai", "policy", "unknown"}
COLLECTION_OWNERSHIP = {"fixed", "repeater", "post-type", "relationship", "flexible-content", "undetermined"}
SEVERITY_ORDER = {"blocking": 0, "review": 1, "info": 2}


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def catalog() -> list[dict[str, Any]]:
    data = load_json(QUESTIONS_PATH)
    if data.get("version") != 1 or not isinstance(data.get("questions"), list):
        raise ValueError("Unsupported questions catalog")
    return data["questions"]


def get_value(profile: dict[str, Any], question_id: str) -> Any:
    answer = profile.get("answers", {}).get(question_id)
    return answer.get("value") if isinstance(answer, dict) else None


def is_unresolved(value: Any) -> bool:
    if value is None or value == "" or value == "undetermined":
        return True
    if isinstance(value, list) and not value:
        return True
    return False


def is_active(question: dict[str, Any], profile: dict[str, Any]) -> bool:
    conditions = question.get("when")
    if not conditions:
        return True
    for dependency, allowed_values in conditions.items():
        current = get_value(profile, dependency)
        if isinstance(current, list):
            if not any(item in allowed_values for item in current):
                return False
        elif current not in allowed_values:
            return False
    return True


def validate_answer(question: dict[str, Any], answer: Any) -> list[str]:
    errors: list[str] = []
    if not isinstance(answer, dict):
        return ["answer must be an object"]

    value = answer.get("value")
    qtype = question.get("type")
    options = question.get("options", [])

    if qtype == "single" and not is_unresolved(value) and value not in options:
        errors.append(f"value must be one of {options}")
    elif qtype == "multi" and not is_unresolved(value):
        if not isinstance(value, list):
            errors.append("value must be an array")
        else:
            invalid = [item for item in value if item not in options]
            if invalid:
                errors.append(f"invalid values: {invalid}")
    elif qtype == "text-list" and not is_unresolved(value):
        if not isinstance(value, list) or not all(isinstance(item, str) and item.strip() for item in value):
            errors.append("value must be an array of non-empty strings")

    source = answer.get("source", "unknown")
    if source not in ALLOWED_SOURCES:
        errors.append(f"source must be one of {sorted(ALLOWED_SOURCES)}")

    confidence = answer.get("confidence", 0)
    if not isinstance(confidence, (int, float)) or isinstance(confidence, bool) or not 0 <= confidence <= 1:
        errors.append("confidence must be between 0 and 1")

    decided_by = answer.get("decidedBy", "unknown")
    if decided_by not in ALLOWED_DECIDERS:
        errors.append(f"decidedBy must be one of {sorted(ALLOWED_DECIDERS)}")

    evidence = answer.get("evidence", "")
    if not is_unresolved(value) and source != "unknown" and (not isinstance(evidence, str) or not evidence.strip()):
        errors.append("resolved evidence-backed answers require a non-empty evidence string")

    return errors


def validate_collections(profile: dict[str, Any]) -> list[str]:
    collections = profile.get("collections", [])
    if not isinstance(collections, list):
        return ["profile.collections must be an array"]
    errors: list[str] = []
    seen: set[str] = set()
    for index, item in enumerate(collections):
        prefix = f"collections[{index}]"
        if not isinstance(item, dict):
            errors.append(f"{prefix} must be an object")
            continue
        collection_id = item.get("id")
        if not isinstance(collection_id, str) or not collection_id.strip():
            errors.append(f"{prefix}.id must be a non-empty string")
        elif collection_id in seen:
            errors.append(f"duplicate collection id: {collection_id}")
        else:
            seen.add(collection_id)
        count = item.get("figmaCount")
        if count is not None and (not isinstance(count, int) or isinstance(count, bool) or count < 0):
            errors.append(f"{prefix}.figmaCount must be a non-negative integer or omitted")
        ownership = item.get("cmsOwnership", "undetermined")
        if ownership not in COLLECTION_OWNERSHIP:
            errors.append(f"{prefix}.cmsOwnership must be one of {sorted(COLLECTION_OWNERSHIP)}")
        fields = item.get("editableFields", [])
        if not isinstance(fields, list) or not all(isinstance(field, str) and field.strip() for field in fields):
            errors.append(f"{prefix}.editableFields must be an array of non-empty strings")
        evidence = item.get("evidence", "")
        if ownership != "undetermined" and (not isinstance(evidence, str) or not evidence.strip()):
            errors.append(f"{prefix}.evidence is required when CMS ownership is resolved")
    return errors


def validate_profile(profile: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if profile.get("version") != 1:
        errors.append("profile.version must be 1")
    if not isinstance(profile.get("project"), dict):
        errors.append("profile.project must be an object")
    if not isinstance(profile.get("answers"), dict):
        errors.append("profile.answers must be an object")
        return errors

    questions = {item["id"]: item for item in catalog()}
    for answer_id, answer in profile["answers"].items():
        if answer_id not in questions:
            errors.append(f"unknown answer id: {answer_id}")
            continue
        for message in validate_answer(questions[answer_id], answer):
            errors.append(f"{answer_id}: {message}")

    errors.extend(validate_collections(profile))

    runtime = get_value(profile, "target.runtime")
    acf = get_value(profile, "cms.acf")
    cms_mode = get_value(profile, "cms.mode")

    if runtime != "wordpress" and acf not in {None, "", "none", "undetermined"}:
        errors.append("contradiction: cms.acf can only be enabled for target.runtime=wordpress")
    if runtime != "wordpress" and cms_mode not in {None, "", "none", "undetermined"}:
        errors.append("contradiction: CMS editability is currently modeled only for WordPress targets")
    if runtime != "wordpress" and profile.get("collections"):
        for item in profile.get("collections", []):
            if isinstance(item, dict) and item.get("cmsOwnership") not in {None, "fixed", "undetermined"}:
                errors.append(f"contradiction: collection {item.get('id', '?')} has WordPress CMS ownership on non-WordPress target")

    return errors


def active_questions(profile: dict[str, Any]) -> list[dict[str, Any]]:
    return [question for question in catalog() if is_active(question, profile)]


def unresolved_questions(profile: dict[str, Any]) -> list[dict[str, Any]]:
    result = []
    for question in active_questions(profile):
        if is_unresolved(get_value(profile, question["id"])):
            result.append(question)
    return sorted(result, key=lambda item: (SEVERITY_ORDER.get(item.get("severity", "info"), 9), item["id"]))


def unresolved_collections(profile: dict[str, Any]) -> list[dict[str, Any]]:
    if get_value(profile, "target.runtime") != "wordpress":
        return []
    return [
        item for item in profile.get("collections", [])
        if isinstance(item, dict) and item.get("cmsOwnership", "undetermined") == "undetermined"
    ]


def low_confidence_questions(profile: dict[str, Any], threshold: float) -> list[dict[str, Any]]:
    result = []
    for question in active_questions(profile):
        answer = profile.get("answers", {}).get(question["id"])
        if not isinstance(answer, dict) or is_unresolved(answer.get("value")):
            continue
        confidence = answer.get("confidence", 0)
        source = answer.get("source", "unknown")
        if source in {"figma-observation", "repo-observation", "unknown"} and isinstance(confidence, (int, float)) and confidence < threshold:
            result.append(question)
    return result


def profile_fingerprint(profile: dict[str, Any]) -> str:
    normalized = copy.deepcopy(profile)
    project = normalized.setdefault("project", {})
    project.pop("profileStatus", None)
    project.pop("lockedAt", None)
    raw = json.dumps(normalized, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def compile_plan(profile: dict[str, Any]) -> dict[str, Any]:
    runtime = get_value(profile, "target.runtime")
    page_type = get_value(profile, "target.pageType")
    acf = get_value(profile, "cms.acf")
    visual = get_value(profile, "qa.visualReference")
    cms_mutation = get_value(profile, "qa.cmsMutation")
    editability = get_value(profile, "editability.human")
    deliverable = get_value(profile, "deliverables.acfJson")

    checks = ["scope-boundary", "runtime-errors", "responsive-overflow"]
    deliverables: list[str] = []
    implementation: list[str] = []

    if runtime == "wordpress":
        checks.extend(["wordpress-runtime-smoke", "wp-cli-availability"])
        implementation.append("adapt WordPress structure to project evidence")
    if acf in {"acf-pro", "acf-free", "existing-project-contract"}:
        checks.append("acf-field-definition-validation")
        implementation.append("resolve CMS ownership per field/collection")
    if cms_mutation == "required":
        checks.append("cms-mutation-robustness")
    if visual in {"figma-frame", "approved-screenshot", "existing-site"}:
        checks.append("visual-fidelity")
    if visual == "figma-frame":
        checks.append("reference-width-capture")
    if editability == "high":
        checks.append("human-editability-review")
        deliverables.append("ownership-readable implementation structure")
    if deliverable == "local-json":
        deliverables.append("acf-json")
    elif deliverable == "portable-export":
        deliverables.append("acf-export.json")
    elif deliverable == "both":
        deliverables.extend(["acf-json", "acf-export.json"])

    for item in profile.get("collections", []):
        if not isinstance(item, dict):
            continue
        ownership = item.get("cmsOwnership", "undetermined")
        if ownership != "undetermined":
            implementation.append(f"collection:{item.get('id')}={ownership}")

    return {
        "version": 1,
        "project": profile.get("project", {}).get("name", "unnamed"),
        "target": {"runtime": runtime, "pageType": page_type, "integration": get_value(profile, "integration.mode")},
        "implementationDirectives": sorted(set(implementation)),
        "requiredChecks": sorted(set(checks)),
        "requiredDeliverables": sorted(set(deliverables)),
        "unresolvedBlockingQuestions": [item["id"] for item in unresolved_questions(profile) if item.get("severity") == "blocking"],
        "reviewDebt": [item["id"] for item in unresolved_questions(profile) if item.get("severity") == "review"],
        "unresolvedCollections": [item.get("id") for item in unresolved_collections(profile)],
        "decisionFingerprint": profile_fingerprint(profile),
    }


def cmd_new(args: argparse.Namespace) -> int:
    profile = {
        "version": 1,
        "project": {"name": args.name, "profileStatus": "draft"},
        "answers": {},
        "collections": [],
    }
    write_json(Path(args.output), profile)
    print(f"PASS created {args.output}")
    return 0


def cmd_validate(args: argparse.Namespace) -> int:
    profile = load_json(Path(args.profile))
    errors = validate_profile(profile)
    if errors:
        for error in errors:
            print(f"FAIL {error}", file=sys.stderr)
        return 1
    print("PASS implementation profile structure and contradictions")
    return 0


def cmd_questions(args: argparse.Namespace) -> int:
    profile = load_json(Path(args.profile))
    errors = validate_profile(profile)
    if errors:
        for error in errors:
            print(f"FAIL {error}", file=sys.stderr)
        return 1
    pending = unresolved_questions(profile)
    collections = unresolved_collections(profile)
    if not pending and not collections:
        print("PASS no unresolved active questions")
        return 0
    for question in pending:
        options = question.get("options")
        suffix = f" [{', '.join(options)}]" if options else ""
        print(f"{question['severity'].upper():8} {question['id']}: {question['prompt']}{suffix}")
        print(f"         why: {question['why']}")
    for item in collections:
        print(f"REVIEW   collection:{item.get('id')}: choose CMS ownership [{', '.join(sorted(COLLECTION_OWNERSHIP - {'undetermined'}))}]")
        print("         why: repeated Figma content must not become Repeater/Post Type without CMS ownership evidence")
    return 2 if any(item.get("severity") == "blocking" for item in pending) else 0


def cmd_preflight(args: argparse.Namespace) -> int:
    profile = load_json(Path(args.profile))
    errors = validate_profile(profile)
    if errors:
        for error in errors:
            print(f"FAIL {error}", file=sys.stderr)
        return 1

    pending = unresolved_questions(profile)
    blockers = [item for item in pending if item.get("severity") == "blocking"]
    review = [item for item in pending if item.get("severity") == "review"]
    collection_debt = unresolved_collections(profile)
    low = low_confidence_questions(profile, args.confidence_threshold)

    print(f"Implementation Preflight: {profile.get('project', {}).get('name', 'unnamed')}")
    print(f"  active questions: {len(active_questions(profile))}")
    print(f"  blocking unknowns: {len(blockers)}")
    print(f"  review debt: {len(review)}")
    print(f"  unresolved collection ownership: {len(collection_debt)}")
    print(f"  low-confidence observations: {len(low)}")
    print(f"  decision fingerprint: {profile_fingerprint(profile)}")

    for item in blockers:
        print(f"BLOCK {item['id']}: {item['prompt']}")
    for item in collection_debt:
        print(f"REVIEW collection:{item.get('id')}: CMS ownership is undetermined")
    for item in low:
        print(f"REVIEW confidence {item['id']}: {item['prompt']}")

    if blockers and not args.allow_blockers:
        print("FAIL implementation must not start while blocking decisions are unresolved", file=sys.stderr)
        return 2
    print("PASS implementation preflight")
    return 0


def cmd_compile(args: argparse.Namespace) -> int:
    profile = load_json(Path(args.profile))
    errors = validate_profile(profile)
    if errors:
        for error in errors:
            print(f"FAIL {error}", file=sys.stderr)
        return 1
    plan = compile_plan(profile)
    if args.output:
        write_json(Path(args.output), plan)
        print(f"PASS compiled definition of done: {args.output}")
    else:
        print(json.dumps(plan, ensure_ascii=False, indent=2))
    return 0


def cmd_lock(args: argparse.Namespace) -> int:
    profile_path = Path(args.profile)
    profile = load_json(profile_path)
    errors = validate_profile(profile)
    if errors:
        for error in errors:
            print(f"FAIL {error}", file=sys.stderr)
        return 1
    blockers = [item for item in unresolved_questions(profile) if item.get("severity") == "blocking"]
    if blockers:
        print("FAIL cannot lock profile with blocking unknowns", file=sys.stderr)
        return 2
    lock = {
        "version": 1,
        "profile": str(profile_path),
        "fingerprint": profile_fingerprint(profile),
        "note": "Re-run check-lock after changing implementation assumptions.",
    }
    write_json(Path(args.output), lock)
    print(f"PASS decision lock {lock['fingerprint']}")
    return 0


def cmd_check_lock(args: argparse.Namespace) -> int:
    profile = load_json(Path(args.profile))
    lock = load_json(Path(args.lock))
    current = profile_fingerprint(profile)
    expected = lock.get("fingerprint")
    if current != expected:
        print(f"FAIL implementation decision drift: expected {expected}, current {current}", file=sys.stderr)
        return 3
    print(f"PASS decision lock unchanged: {current}")
    return 0


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description="Implementation intake and preflight gate")
    sub = root.add_subparsers(dest="command", required=True)

    new = sub.add_parser("new")
    new.add_argument("--name", required=True)
    new.add_argument("--output", required=True)
    new.set_defaults(func=cmd_new)

    validate = sub.add_parser("validate")
    validate.add_argument("profile")
    validate.set_defaults(func=cmd_validate)

    questions = sub.add_parser("questions")
    questions.add_argument("profile")
    questions.set_defaults(func=cmd_questions)

    preflight = sub.add_parser("preflight")
    preflight.add_argument("profile")
    preflight.add_argument("--allow-blockers", action="store_true")
    preflight.add_argument("--confidence-threshold", type=float, default=0.8)
    preflight.set_defaults(func=cmd_preflight)

    compile_cmd = sub.add_parser("compile")
    compile_cmd.add_argument("profile")
    compile_cmd.add_argument("--output")
    compile_cmd.set_defaults(func=cmd_compile)

    lock = sub.add_parser("lock")
    lock.add_argument("profile")
    lock.add_argument("--output", required=True)
    lock.set_defaults(func=cmd_lock)

    check = sub.add_parser("check-lock")
    check.add_argument("profile")
    check.add_argument("--lock", required=True)
    check.set_defaults(func=cmd_check_lock)
    return root


def main() -> int:
    args = parser().parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
