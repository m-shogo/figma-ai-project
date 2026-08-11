#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from audit_figma_variable_modes import (
    audit_record,
    infer_expected_viewport,
    load_yaml,
    mode_for_viewport,
    optional_text,
)


def build_remediation_plan(record: dict[str, Any]) -> dict[str, Any]:
    findings = audit_record(record)
    by_node: dict[str, list[dict[str, Any]]] = {}
    for item in findings:
        if item["severity"] == "ERROR" and item["node_id"]:
            by_node.setdefault(item["node_id"], []).append(item)

    collection = record.get("responsive_collection", {})
    collection_id = optional_text(collection.get("id")) if isinstance(collection, dict) else None
    actions: list[dict[str, Any]] = []
    blocked: list[dict[str, Any]] = []

    for root in record.get("roots", []):
        if not isinstance(root, dict):
            continue
        node_id = optional_text(root.get("node_id"))
        if not node_id:
            continue

        viewport, confidence, evidence = infer_expected_viewport(root)
        root_errors = by_node.get(node_id, [])
        root_codes = {item["code"] for item in root_errors}
        if not root_errors:
            continue

        if confidence != "AUTHORITATIVE" or viewport not in {"desktop", "mobile"}:
            blocked.append({
                "node_id": node_id,
                "reason": "VIEWPORT_NOT_AUTHORITATIVE",
                "confidence": confidence,
                "evidence": evidence,
                "error_codes": sorted(root_codes),
            })
            continue

        expected_mode = mode_for_viewport(record, viewport)
        explicit_mode = optional_text(root.get("explicit_mode_id"))
        resolved_mode = optional_text(root.get("resolved_mode_id"))
        fixable_codes = {
            "RESPONSIVE_ROOT_MODE_NOT_PINNED",
            "ROOT_EXPLICIT_MODE_MISMATCH",
            "ROOT_RESOLVED_MODE_MISMATCH",
        }

        if collection_id and expected_mode and root_codes & fixable_codes:
            if explicit_mode == expected_mode and resolved_mode != expected_mode:
                blocked.append({
                    "node_id": node_id,
                    "reason": "EXPLICIT_MODE_ALREADY_EXPECTED_BUT_RESOLUTION_DISAGREES",
                    "expected_mode_id": expected_mode,
                    "resolved_mode_id": resolved_mode,
                    "error_codes": sorted(root_codes),
                })
                continue

            actions.append({
                "action": "SET_EXPLICIT_VARIABLE_MODE",
                "node_id": node_id,
                "collection_id": collection_id,
                "mode_id": expected_mode,
                "expected_viewport": viewport,
                "current_explicit_mode_id": explicit_mode,
                "current_resolved_mode_id": resolved_mode,
                "reason_codes": sorted(root_codes & fixable_codes),
                "preconditions": {
                    "viewport_confidence": confidence,
                    "reference_mapping_required": True,
                    "no_conflicting_viewport_evidence": True,
                },
                "verify_after": [
                    f"root resolved_mode_id == {expected_mode}",
                    "re-audit responsive-variable-bound descendants",
                    "visual-check the affected section before implementation",
                ],
            })

    action_nodes = {item["node_id"] for item in actions}
    for item in findings:
        if item["severity"] != "ERROR" or not item["node_id"]:
            continue
        if item["node_id"] in action_nodes:
            continue
        if item["code"] == "DESCENDANT_MODE_MISMATCH":
            blocked.append({
                "node_id": item["node_id"],
                "reason": "DESCENDANT_OVERRIDE_OR_NESTED_MODE_REQUIRES_INSPECTION",
                "error_codes": [item["code"]],
                "evidence": item.get("evidence", []),
            })

    return {
        "reference_id": record.get("reference_id"),
        "safe_to_auto_apply": bool(actions) and not any(
            item["reason"] in {
                "VIEWPORT_NOT_AUTHORITATIVE",
                "EXPLICIT_MODE_ALREADY_EXPECTED_BUT_RESOLUTION_DISAGREES",
            }
            for item in blocked
        ),
        "actions": actions,
        "blocked": blocked,
        "audit_summary": {
            "errors": sum(item["severity"] == "ERROR" for item in findings),
            "warnings": sum(item["severity"] == "WARNING" for item in findings),
            "infos": sum(item["severity"] == "INFO" for item in findings),
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate evidence-gated Figma Variable Mode remediation actions from an audit record"
    )
    parser.add_argument("path", type=Path)
    parser.add_argument("--output", type=Path, help="optional JSON output path")
    args = parser.parse_args()

    plan = build_remediation_plan(load_yaml(args.path))
    payload = json.dumps(plan, ensure_ascii=False, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(payload + "\n", encoding="utf-8")
    else:
        print(payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
