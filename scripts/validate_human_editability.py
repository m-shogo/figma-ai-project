#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
RUN_TEMPLATE = ROOT / "templates" / "run-record.yaml"
SHARED_TEMPLATE = ROOT / "templates" / "shared-contract.yaml"

DIMENSIONS = (
    "discoverability",
    "locality_of_change",
    "intent_readability",
    "change_safety_reuse",
    "cms_content_ownership_clarity",
)
STATUSES = {"PENDING", "PASS", "FAIL", "NOT_APPLICABLE"}
DRILL_RESULTS = {"PASS", "FAIL", "NOT_APPLICABLE"}
PLACEHOLDER_EVIDENCE = {"", "n/a", "na", "none", "null", "pending", "todo", "unknown", "tbd"}


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("top-level YAML value must be an object")
    return value


def is_material_text(value: Any) -> bool:
    return isinstance(value, str) and value.strip().lower() not in PLACEHOLDER_EVIDENCE


def material_string_items(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [item.strip() for item in value if is_material_text(item)]


def validate_run_block(data: dict[str, Any], label: str) -> list[str]:
    errors: list[str] = []
    block = data.get("human_editability")
    if not isinstance(block, dict):
        return [f"{label}: schema_version>=11 requires human_editability object"]

    status = block.get("status")
    if status not in STATUSES:
        errors.append(f"{label}: human_editability.status must be one of {sorted(STATUSES)}")

    score = block.get("score")
    if score is not None and (not isinstance(score, (int, float)) or isinstance(score, bool) or not 0 <= score <= 10):
        errors.append(f"{label}: human_editability.score must be null or 0..10")

    dimensions = block.get("dimensions")
    if not isinstance(dimensions, dict):
        errors.append(f"{label}: human_editability.dimensions must be an object")
        dimensions = {}

    values: list[float] = []
    all_scored = True
    for name in DIMENSIONS:
        value = dimensions.get(name)
        if value is None:
            all_scored = False
            continue
        if not isinstance(value, (int, float)) or isinstance(value, bool) or not 0 <= value <= 2:
            errors.append(f"{label}: human_editability.dimensions.{name} must be null or 0..2")
            all_scored = False
            continue
        values.append(float(value))

    if all_scored:
        expected = sum(values)
        if score is None:
            errors.append(f"{label}: human_editability.score is required when all dimensions are scored")
        elif abs(float(score) - expected) > 1e-9:
            errors.append(f"{label}: human_editability.score must equal dimension sum {expected:g}")
    elif score is not None:
        errors.append(f"{label}: human_editability.score must remain null until all dimensions are scored")

    blockers = block.get("blockers")
    if not isinstance(blockers, list):
        errors.append(f"{label}: human_editability.blockers must be an array")
        blockers = []

    evidence = block.get("evidence")
    if not isinstance(evidence, list):
        errors.append(f"{label}: human_editability.evidence must be an array")
        evidence = []

    drills = block.get("change_drills")
    if not isinstance(drills, list):
        errors.append(f"{label}: human_editability.change_drills must be an array")
        drills = []

    for index, drill in enumerate(drills):
        if not isinstance(drill, dict):
            errors.append(f"{label}: human_editability.change_drills[{index}] must be an object")
            continue
        for field in (
            "drill_id",
            "task",
            "snapshot_commit",
            "located_paths",
            "changed_paths",
            "unexpected_paths",
            "regression_status",
            "result",
            "notes",
        ):
            if field not in drill:
                errors.append(f"{label}: human_editability.change_drills[{index}] missing {field}")
        result = drill.get("result")
        if result not in DRILL_RESULTS:
            errors.append(
                f"{label}: human_editability.change_drills[{index}].result must be one of {sorted(DRILL_RESULTS)}"
            )
        for field in ("located_paths", "changed_paths", "unexpected_paths"):
            if field in drill and not isinstance(drill[field], list):
                errors.append(f"{label}: human_editability.change_drills[{index}].{field} must be an array")
            elif isinstance(drill.get(field), list) and any(
                not is_material_text(item) for item in drill[field]
            ):
                errors.append(
                    f"{label}: human_editability.change_drills[{index}].{field} entries must be non-placeholder strings"
                )
        if "notes" in drill and not isinstance(drill["notes"], list):
            errors.append(f"{label}: human_editability.change_drills[{index}].notes must be an array")

        if result == "PASS":
            for field in ("drill_id", "task", "snapshot_commit"):
                if not is_material_text(drill.get(field)):
                    errors.append(
                        f"{label}: PASS change drill[{index}] requires material {field} evidence"
                    )
            if not material_string_items(drill.get("located_paths")):
                errors.append(f"{label}: PASS change drill[{index}] requires at least one located_path")
            if drill.get("regression_status") != "PASS":
                errors.append(f"{label}: PASS change drill[{index}] requires regression_status=PASS")
            if not material_string_items(drill.get("changed_paths")) and not material_string_items(
                drill.get("notes")
            ):
                errors.append(
                    f"{label}: PASS change drill[{index}] with zero changed_paths requires notes explaining the non-file change"
                )

    if status == "PASS":
        if score is None or float(score) < 8:
            errors.append(f"{label}: Human Editability PASS requires score >= 8")
        if blockers:
            errors.append(f"{label}: Human Editability PASS requires zero blockers")
        if any(isinstance(drill, dict) and drill.get("result") == "FAIL" for drill in drills):
            errors.append(f"{label}: Human Editability PASS cannot contain a failed change drill")

    if data.get("status") == "COMPLETE":
        if status != "PASS":
            errors.append(f"{label}: COMPLETE run requires human_editability.status=PASS")
        if not evidence:
            errors.append(f"{label}: COMPLETE run requires human_editability.evidence")
        scope = data.get("coordination", {}).get("scope")
        minimum_drills = 1 if scope == "SECTION" else 3
        relevant_drills = [
            drill
            for drill in drills
            if isinstance(drill, dict) and drill.get("result") != "NOT_APPLICABLE"
        ]
        if len(relevant_drills) < minimum_drills:
            errors.append(
                f"{label}: COMPLETE {scope or 'run'} requires at least {minimum_drills} relevant Human Editability change drill(s)"
            )
        if any(drill.get("result") != "PASS" for drill in relevant_drills):
            errors.append(f"{label}: all relevant Human Editability change drills must PASS for COMPLETE")

    return errors


def validate_shared_contract(data: dict[str, Any], label: str) -> list[str]:
    block = data.get("human_editability")
    if not isinstance(block, dict):
        return [f"{label}: schema_version>=10 requires human_editability object"]

    required_values = {
        "required": True,
        "section_locality_required": True,
        "shared_primitive_duplication_allowed": False,
        "cms_code_ownership_must_be_explicit": True,
        "change_drills_required": True,
    }
    errors: list[str] = []
    for key, expected in required_values.items():
        if block.get(key) is not expected:
            errors.append(f"{label}: human_editability.{key} must be {expected!r}")

    if block.get("policy_doc") != "docs/human-editability.md":
        errors.append(f"{label}: human_editability.policy_doc must be docs/human-editability.md")
    if block.get("global_overflow_hiding_for_layout_defect") != "PROHIBITED":
        errors.append(
            f"{label}: human_editability.global_overflow_hiding_for_layout_defect must be PROHIBITED"
        )
    return errors


def candidate_records() -> list[Path]:
    base = ROOT / "experiments"
    if not base.exists():
        return []
    return sorted(base.rglob("*.yaml"))


def main() -> int:
    errors: list[str] = []

    run_template = load_yaml(RUN_TEMPLATE)
    if int(run_template.get("schema_version", 0)) < 11:
        errors.append("templates/run-record.yaml must use schema_version >= 11")
    else:
        errors.extend(validate_run_block(run_template, "templates/run-record.yaml"))

    shared_template = load_yaml(SHARED_TEMPLATE)
    if int(shared_template.get("schema_version", 0)) < 10:
        errors.append("templates/shared-contract.yaml must use schema_version >= 10")
    else:
        errors.extend(validate_shared_contract(shared_template, "templates/shared-contract.yaml"))

    for path in candidate_records():
        try:
            data = load_yaml(path)
        except Exception:
            continue
        relative = str(path.relative_to(ROOT))
        schema_version = int(data.get("schema_version", 0) or 0)
        if "run_id" in data and schema_version >= 11:
            errors.extend(validate_run_block(data, relative))
        if "contract_id" in data and "reference_id" in data and schema_version >= 10:
            errors.extend(validate_shared_contract(data, relative))

    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1

    print("PASS Human Editability contract/run records")
    return 0


if __name__ == "__main__":
    sys.exit(main())
