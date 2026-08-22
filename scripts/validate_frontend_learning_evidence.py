#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any

import yaml
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
INDEX_PATH = ROOT / "research" / "frontend-learning-evidence.yaml"
SCHEMA_PATH = ROOT / "schemas" / "frontend-learning-evidence.schema.json"
POLICY_PATH = ROOT / "config" / "frontend-implementation-policy.yaml"
LOCAL_EVIDENCE_KINDS = {"LOCAL_RESEARCH", "RUN_RECORD", "COMMIT", "CANONICAL_DOC"}
PROMOTED_STATES = {"ACTIVE", "CORE"}
HEX_COMMIT = re.compile(r"^[0-9a-f]{7,40}$")


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"top-level YAML value must be an object: {path}")
    return value


def load_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"top-level JSON value must be an object: {path}")
    return value


def material_text(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def text_sha256(value: str) -> str:
    return hashlib.sha256(value.strip().encode("utf-8")).hexdigest()


def local_evidence_path(root: Path, value: str) -> Path | None:
    if not material_text(value):
        return None
    candidate = (root / value).resolve()
    root = root.resolve()
    if candidate != root and root not in candidate.parents:
        return None
    return candidate


def run_lesson_values(run: dict[str, Any], source_field: str) -> list[str]:
    prefix = "lessons."
    if not source_field.startswith(prefix):
        return []
    lessons = run.get("lessons", {})
    if not isinstance(lessons, dict):
        return []
    value = lessons.get(source_field[len(prefix) :], [])
    if not isinstance(value, list):
        return []
    return [item.strip() for item in value if material_text(item)]


def semantic_errors(
    data: dict[str, Any],
    *,
    root: Path,
    allowed_states: set[str],
) -> list[str]:
    errors: list[str] = []
    policy = data.get("policy", {})
    if policy.get("auto_promotion") is not False:
        errors.append("learning evidence index must never auto-promote rules")
    if policy.get("contradictions_are_preserved") is not True:
        errors.append("learning evidence index must preserve contradicting evidence")

    records = data.get("records", [])
    learning_ids: set[str] = set()
    evidence_ids: set[str] = set()

    for index, record in enumerate(records):
        if not isinstance(record, dict):
            continue
        label = f"records[{index}]"
        learning_id = str(record.get("learning_id", ""))
        if learning_id in learning_ids:
            errors.append(f"{label}: duplicate learning_id {learning_id!r}")
        learning_ids.add(learning_id)

        state = record.get("promotion_state")
        if state is not None and state not in allowed_states:
            errors.append(f"{label}: promotion_state {state!r} is not in canonical rule lifecycle")

        promotion = record.get("promotion", {})
        if state == "CANDIDATE" and promotion.get("candidate") is not True:
            errors.append(f"{label}: CANDIDATE promotion_state requires promotion.candidate=true")
        if state in PROMOTED_STATES and promotion.get("candidate") is True:
            errors.append(f"{label}: {state} evidence must not remain marked as an unreviewed promotion candidate")

        evidence = record.get("evidence", {})
        supports = evidence.get("supports", []) if isinstance(evidence, dict) else []
        contradicts = evidence.get("contradicts", []) if isinstance(evidence, dict) else []
        if not supports:
            errors.append(f"{label}: at least one supporting evidence item is required")

        supporting_references: set[str] = set()
        for relation, items in (("supports", supports), ("contradicts", contradicts)):
            if not isinstance(items, list):
                continue
            for evidence_index, item in enumerate(items):
                if not isinstance(item, dict):
                    continue
                item_label = f"{label}.evidence.{relation}[{evidence_index}]"
                evidence_id = str(item.get("evidence_id", ""))
                if evidence_id in evidence_ids:
                    errors.append(f"{item_label}: duplicate evidence_id {evidence_id!r}")
                evidence_ids.add(evidence_id)

                reference_id = str(item.get("reference_id", "")).strip()
                if relation == "supports" and reference_id:
                    supporting_references.add(reference_id)

                kind = item.get("kind")
                path_value = str(item.get("path", ""))
                path: Path | None = None
                if kind in LOCAL_EVIDENCE_KINDS:
                    path = local_evidence_path(root, path_value)
                    if path is None:
                        errors.append(f"{item_label}: local evidence path is required and must stay inside repository")
                    elif not path.is_file():
                        errors.append(f"{item_label}: local evidence path does not exist: {path_value}")
                elif kind == "EXTERNAL_GUIDANCE":
                    if not (path_value.startswith("https://") or path_value.startswith("http://")):
                        errors.append(f"{item_label}: EXTERNAL_GUIDANCE path must be an http(s) URL")

                commit = str(item.get("commit", "")).strip()
                if kind == "COMMIT":
                    if not HEX_COMMIT.fullmatch(commit):
                        errors.append(f"{item_label}: COMMIT evidence requires a 7..40 character lowercase hex commit")
                elif commit and not HEX_COMMIT.fullmatch(commit):
                    errors.append(f"{item_label}: commit must be lowercase hex when provided")

                if kind == "RUN_RECORD":
                    run_id = str(item.get("run_id", "")).strip()
                    if not run_id:
                        errors.append(f"{item_label}: RUN_RECORD evidence requires run_id")
                    if path is not None and path.is_file():
                        try:
                            run = load_yaml(path)
                        except Exception as exc:
                            errors.append(f"{item_label}: cannot load RUN_RECORD evidence: {exc}")
                        else:
                            if str(run.get("run_id", "")).strip() != run_id:
                                errors.append(f"{item_label}: run_id does not match linked RUN_RECORD")
                            source_field = str(item.get("source_field", "")).strip()
                            source_hash = str(item.get("source_text_sha256", "")).strip()
                            if source_field or source_hash:
                                values = run_lesson_values(run, source_field)
                                if not values:
                                    errors.append(
                                        f"{item_label}: source_field {source_field!r} has no material lesson values in RUN_RECORD"
                                    )
                                elif source_hash not in {text_sha256(value) for value in values}:
                                    errors.append(
                                        f"{item_label}: source_text_sha256 does not match any item in {source_field}"
                                    )

        if state in PROMOTED_STATES and len(supporting_references) < 2:
            errors.append(
                f"{label}: {state} learning requires supporting evidence from at least two distinct references"
            )
        if state in PROMOTED_STATES and contradicts and not material_text(promotion.get("contradiction_review")):
            errors.append(
                f"{label}: {state} learning with contradicting evidence requires promotion.contradiction_review"
            )

    return errors


def schema_errors(data: dict[str, Any], schema: dict[str, Any]) -> list[str]:
    validator = Draft202012Validator(schema)
    output: list[str] = []
    for error in sorted(validator.iter_errors(data), key=lambda item: list(item.absolute_path)):
        path = ".".join(str(part) for part in error.absolute_path) or "<root>"
        output.append(f"{path}: {error.message}")
    return output


def main() -> int:
    data = load_yaml(INDEX_PATH)
    schema = load_json(SCHEMA_PATH)
    frontend_policy = load_yaml(POLICY_PATH)
    allowed_states = set(frontend_policy.get("rule_lifecycle", {}).get("allowed_states", []))

    errors = schema_errors(data, schema)
    if not errors:
        errors.extend(semantic_errors(data, root=ROOT, allowed_states=allowed_states))

    if errors:
        print("FAIL frontend learning evidence index")
        for error in errors:
            print(f"  - {error}")
        return 1

    records = data.get("records", [])
    states = Counter(
        str(record.get("promotion_state") or "UNPROMOTED")
        for record in records
        if isinstance(record, dict)
    )
    reference_ids = {
        str(item.get("reference_id", "")).strip()
        for record in records
        if isinstance(record, dict)
        for relation in ("supports", "contradicts")
        for item in record.get("evidence", {}).get(relation, [])
        if isinstance(item, dict) and str(item.get("reference_id", "")).strip()
    }
    contradiction_count = sum(
        len(record.get("evidence", {}).get("contradicts", []))
        for record in records
        if isinstance(record, dict)
    )

    print("PASS frontend learning evidence index")
    print(f"  records={len(records)} distinct_references={len(reference_ids)} contradictions={contradiction_count}")
    print("  states=" + ",".join(f"{key}:{states[key]}" for key in sorted(states)))
    print("  auto_promotion=false")
    return 0


if __name__ == "__main__":
    sys.exit(main())
