#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import intake


def dig(data: dict[str, Any], path: str, default: Any = None) -> Any:
    cur: Any = data
    for part in path.split('.'):
        if not isinstance(cur, dict) or part not in cur:
            return default
        cur = cur[part]
    return cur


def add(rows: list[dict[str, Any]], risk_id: str, severity: str, why: str, action: str) -> None:
    rows.append({"id": risk_id, "severity": severity, "why": why, "action": action})


def scan(profile: dict[str, Any], facts: dict[str, Any]) -> dict[str, Any]:
    rows: list[dict[str, Any]] = []
    runtime = intake.get_value(profile, "target.runtime")
    visual = intake.get_value(profile, "qa.visualReference")

    if visual == "figma-frame" and not dig(facts, "figma.referenceRevision"):
        add(rows, "figma-reference-not-pinned", "review", "Figma can change while implementation is in progress.", "Record file/page/frame identity plus a revision/version/captured-at reference before final fidelity QA.")
    if not dig(facts, "content.ready", False):
        add(rows, "content-readiness", "review", "Placeholder copy can hide wrapping, overflow, CMS and legal-content problems.", "Mark which content is final and run long/real-content QA before completion.")
    if not dig(facts, "accessibility.standard"):
        add(rows, "accessibility-contract-missing", "review", "Visual fidelity alone does not define keyboard, semantics, contrast, focus or reduced-motion requirements.", "Declare the project accessibility target and include it in Definition of Done.")
    if not dig(facts, "browser.support"):
        add(rows, "browser-support-unknown", "review", "CSS/JS choices can silently depend on unsupported browser features.", "Record supported browsers/devices or explicitly inherit the existing project contract.")
    if not dig(facts, "performance.budget"):
        add(rows, "performance-budget-unknown", "info", "A visually correct LP can regress image weight, JS cost or layout stability.", "Declare project performance expectations or explicitly mark performance as observational only.")
    if dig(facts, "forms.present", False) and not dig(facts, "forms.backend"):
        add(rows, "form-backend-undetermined", "blocking", "A form UI is incomplete without submission ownership, validation and failure behavior.", "Resolve endpoint/plugin/service, validation, success, error and spam handling before implementation is called complete.")
    if dig(facts, "analytics.tracking", False) and not dig(facts, "analytics.privacyContract"):
        add(rows, "tracking-privacy-undetermined", "blocking", "Analytics/tag scripts may require consent, data-minimization or company policy handling.", "Resolve the privacy/consent contract before shipping tracking code.")
    if dig(facts, "thirdParty.scripts", []) and not dig(facts, "thirdParty.approved", False):
        add(rows, "third-party-script-approval", "review", "External scripts introduce performance, privacy, CSP and availability dependencies.", "Record approval and ownership for each third-party script.")
    if not dig(facts, "assets.licenseProvenance"):
        add(rows, "asset-license-provenance", "review", "Figma-exported or supplied imagery may not carry its usage rights with the file.", "Record source/usage authority for production assets; do not infer licensing from visual availability.")
    if not dig(facts, "fonts.licenseProvenance"):
        add(rows, "font-license-provenance", "review", "A Figma font name does not prove webfont redistribution rights.", "Record the approved webfont source or use an existing project-provided font asset.")
    if not dig(facts, "edgeStates.inventory"):
        add(rows, "edge-state-inventory", "review", "Figma often omits loading, empty, error, long-content and missing-asset states.", "Inventory applicable non-Figma states and test runtime robustness without pixel-diffing them against nonexistent references.")
    if not dig(facts, "deployment.environment"):
        add(rows, "deployment-contract-unknown", "review", "Local success does not prove the target server/runtime/build constraints.", "Record deployment runtime constraints before final merge or handoff.")
    if runtime == "wordpress" and dig(facts, "seo.indexing") is None:
        add(rows, "wordpress-indexing-undetermined", "review", "Staging and production WordPress often require different indexing behavior.", "Declare staging/production indexing ownership and avoid carrying fixture noindex settings into production accidentally.")
    languages = dig(facts, "localization.languages", [])
    if isinstance(languages, list) and len(languages) > 1 and not dig(facts, "localization.strategy"):
        add(rows, "localization-strategy-unknown", "review", "Multiple languages affect content ownership, line wrapping, CMS structure and URLs.", "Resolve translation/content strategy before architecture is frozen.")

    order = {"blocking": 0, "review": 1, "info": 2}
    rows.sort(key=lambda r: (order.get(r["severity"], 9), r["id"]))
    return {
        "version": 1,
        "blocking": [r["id"] for r in rows if r["severity"] == "blocking"],
        "review": [r["id"] for r in rows if r["severity"] == "review"],
        "info": [r["id"] for r in rows if r["severity"] == "info"],
        "risks": rows,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Scan latent implementation/delivery risks that are not safe to infer from Figma alone")
    parser.add_argument("profile")
    parser.add_argument("facts")
    parser.add_argument("--output")
    args = parser.parse_args()
    result = scan(intake.load_json(Path(args.profile)), intake.load_json(Path(args.facts)))
    if args.output:
        intake.write_json(Path(args.output), result)
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    return 2 if result["blocking"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
