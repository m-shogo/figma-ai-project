#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
RESPONSIVE_VIEWPORTS = {"desktop", "mobile"}
DESKTOP_ROLE_TOKENS = {"desktop", "desktop-page", "pc", "web"}
MOBILE_ROLE_TOKENS = {"mobile", "mobile-page", "sp", "phone"}
DESKTOP_NAME_RE = re.compile(r"(^|[\s_/@-])(pc|desktop|web)(?=$|[\s_/@-])", re.IGNORECASE)
MOBILE_NAME_RE = re.compile(r"(^|[\s_/@-])(sp|mobile|phone)(?=$|[\s_/@-])", re.IGNORECASE)


def optional_text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("top-level YAML value must be an object")
    return value


def candidate_records() -> list[Path]:
    found: list[Path] = []
    for base in (ROOT / "references", ROOT / "experiments", ROOT / "contracts"):
        if base.exists():
            found.extend(sorted(base.rglob("*.variable-mode-audit.yaml")))
    return list(dict.fromkeys(found))


def mode_for_viewport(record: dict[str, Any], viewport: str) -> str | None:
    modes = record.get("responsive_collection", {}).get("modes", {})
    entry = modes.get(viewport, {}) if isinstance(modes, dict) else {}
    if isinstance(entry, str):
        return optional_text(entry)
    if isinstance(entry, dict):
        return optional_text(entry.get("id") or entry.get("mode_id"))
    return None


def infer_expected_viewport(root: dict[str, Any]) -> tuple[str | None, str, list[str]]:
    explicit = (optional_text(root.get("expected_viewport")) or "").lower()
    if explicit:
        if explicit not in RESPONSIVE_VIEWPORTS:
            return None, "INVALID", [f"expected_viewport={explicit}"]
        return explicit, "AUTHORITATIVE", [f"expected_viewport={explicit}"]

    strong: set[str] = set()
    evidence: list[str] = []
    role = (optional_text(root.get("role")) or "").lower()
    if role in DESKTOP_ROLE_TOKENS:
        strong.add("desktop")
        evidence.append(f"role={role}")
    if role in MOBILE_ROLE_TOKENS:
        strong.add("mobile")
        evidence.append(f"role={role}")

    name = optional_text(root.get("name")) or ""
    if DESKTOP_NAME_RE.search(name):
        strong.add("desktop")
        evidence.append(f"name={name!r} signals desktop")
    if MOBILE_NAME_RE.search(name):
        strong.add("mobile")
        evidence.append(f"name={name!r} signals mobile")

    if len(strong) > 1:
        return None, "AMBIGUOUS", evidence
    if len(strong) == 1:
        viewport = next(iter(strong))
        width = root.get("width")
        if isinstance(width, (int, float)):
            if viewport == "desktop" and width <= 480:
                return None, "AMBIGUOUS", [*evidence, f"width={width} conflicts with desktop signal"]
            if viewport == "mobile" and width >= 1024:
                return None, "AMBIGUOUS", [*evidence, f"width={width} conflicts with mobile signal"]
        return viewport, "HIGH", evidence

    width = root.get("width")
    if isinstance(width, (int, float)):
        if width <= 480:
            return "mobile", "LOW", [f"width={width} only"]
        if width >= 1024:
            return "desktop", "LOW", [f"width={width} only"]
    return None, "UNKNOWN", evidence


def finding(
    severity: str,
    code: str,
    node_id: str,
    message: str,
    *,
    evidence: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "severity": severity,
        "code": code,
        "node_id": node_id,
        "message": message,
        "evidence": evidence or [],
    }


def audit_record(record: dict[str, Any]) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    collection = record.get("responsive_collection", {})
    collection_id = optional_text(collection.get("id")) if isinstance(collection, dict) else None
    if not collection_id:
        return [finding("ERROR", "MISSING_RESPONSIVE_COLLECTION", "", "responsive_collection.id is required")]

    desktop_mode = mode_for_viewport(record, "desktop")
    mobile_mode = mode_for_viewport(record, "mobile")
    if not desktop_mode or not mobile_mode or desktop_mode == mobile_mode:
        return [finding(
            "ERROR",
            "INVALID_RESPONSIVE_MODE_MAP",
            "",
            "responsive_collection.modes must define distinct desktop and mobile mode ids",
        )]

    same_page = bool(record.get("same_page_responsive", False))
    roots = record.get("roots", [])
    if not isinstance(roots, list) or not roots:
        return [finding("ERROR", "MISSING_RESPONSIVE_ROOTS", "", "roots must contain at least one responsive root")]

    seen_expected: set[str] = set()
    correctly_pinned: set[str] = set()

    for index, root in enumerate(roots):
        if not isinstance(root, dict):
            findings.append(finding("ERROR", "INVALID_ROOT", "", f"roots[{index}] must be an object"))
            continue

        node_id = optional_text(root.get("node_id")) or f"roots[{index}]"
        viewport, confidence, signals = infer_expected_viewport(root)
        if confidence == "INVALID":
            findings.append(finding(
                "ERROR", "INVALID_EXPECTED_VIEWPORT", node_id,
                "expected_viewport must be desktop or mobile", evidence=signals,
            ))
            continue
        if confidence == "AMBIGUOUS":
            findings.append(finding(
                "WARNING", "AMBIGUOUS_VIEWPORT", node_id,
                "viewport evidence conflicts; do not auto-change Figma mode", evidence=signals,
            ))
            continue
        if viewport is None:
            findings.append(finding(
                "WARNING", "UNKNOWN_VIEWPORT", node_id,
                "viewport could not be inferred; obtain reference/owner evidence before changing Figma mode",
                evidence=signals,
            ))
            continue
        if confidence == "LOW":
            findings.append(finding(
                "WARNING", "LOW_CONFIDENCE_VIEWPORT", node_id,
                "width is the only viewport signal; width alone is not sufficient for automatic mode mutation",
                evidence=signals,
            ))
            continue

        seen_expected.add(viewport)
        expected_mode = desktop_mode if viewport == "desktop" else mobile_mode
        explicit_mode = optional_text(root.get("explicit_mode_id"))
        resolved_mode = optional_text(root.get("resolved_mode_id"))

        if same_page and explicit_mode is None:
            findings.append(finding(
                "ERROR", "RESPONSIVE_ROOT_MODE_NOT_PINNED", node_id,
                f"{viewport} root shares a page with another viewport but does not explicitly pin the responsive collection mode",
                evidence=[f"expected_mode={expected_mode}", *signals],
            ))
        elif explicit_mode is not None and explicit_mode != expected_mode:
            findings.append(finding(
                "ERROR", "ROOT_EXPLICIT_MODE_MISMATCH", node_id,
                f"{viewport} root explicitly pins mode {explicit_mode}, expected {expected_mode}", evidence=signals,
            ))
        elif explicit_mode == expected_mode:
            correctly_pinned.add(viewport)

        if resolved_mode is None:
            findings.append(finding(
                "ERROR", "ROOT_RESOLVED_MODE_UNKNOWN", node_id,
                f"cannot prove the effective responsive mode for the {viewport} root", evidence=signals,
            ))
        elif resolved_mode != expected_mode:
            findings.append(finding(
                "ERROR", "ROOT_RESOLVED_MODE_MISMATCH", node_id,
                f"{viewport} root resolves responsive mode {resolved_mode}, expected {expected_mode}",
                evidence=[f"width={root.get('width')}", *signals],
            ))

        descendants = root.get("descendants", [])
        if not isinstance(descendants, list):
            findings.append(finding("ERROR", "INVALID_DESCENDANTS", node_id, "descendants must be a list"))
            continue

        for child_index, child in enumerate(descendants):
            if not isinstance(child, dict):
                findings.append(finding(
                    "ERROR", "INVALID_DESCENDANT", node_id,
                    f"descendants[{child_index}] must be an object",
                ))
                continue
            if not bool(child.get("bound_to_responsive_collection", False)):
                continue
            child_id = optional_text(child.get("node_id")) or f"{node_id}/descendants[{child_index}]"
            child_mode = optional_text(child.get("resolved_mode_id"))
            if child_mode != expected_mode:
                child_evidence = [
                    f"root={node_id}",
                    f"expected_mode={expected_mode}",
                    f"resolved_mode={child_mode or 'UNKNOWN'}",
                ]
                if "width" in child:
                    child_evidence.append(f"width={child.get('width')}")
                findings.append(finding(
                    "ERROR", "DESCENDANT_MODE_MISMATCH", child_id,
                    "a variable-bound descendant resolves a different responsive mode than its logical root",
                    evidence=child_evidence,
                ))

    if same_page and {"desktop", "mobile"}.issubset(seen_expected) and {"desktop", "mobile"}.issubset(correctly_pinned):
        page = record.get("page", {})
        page_mode = optional_text(page.get("explicit_mode_id")) if isinstance(page, dict) else None
        if page_mode:
            findings.append(finding(
                "INFO",
                "PAGE_MODE_SHADOWED_BY_ROOT_PINS",
                optional_text(page.get("node_id")) or "",
                "page-level mode may remain set because both responsive roots explicitly pin their own modes",
                evidence=[f"page_mode={page_mode}"],
            ))

    return findings


def validate_record(record: dict[str, Any]) -> list[str]:
    return [
        f"{item['code']} {item['node_id']}: {item['message']}"
        for item in audit_record(record)
        if item["severity"] == "ERROR"
    ]


def print_findings(path: Path, findings: list[dict[str, Any]]) -> bool:
    errors = [item for item in findings if item["severity"] == "ERROR"]
    relative = path.relative_to(ROOT) if path.is_relative_to(ROOT) else path
    print(f"{'FAIL' if errors else 'PASS'} {relative}")
    for item in findings:
        if item["severity"] == "INFO" and not errors:
            continue
        location = f" {item['node_id']}" if item["node_id"] else ""
        print(f"  - {item['severity']} {item['code']}{location}: {item['message']}")
        for evidence in item.get("evidence", []):
            print(f"      evidence: {evidence}")
    return not errors


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Audit responsive Figma Variable Mode inheritance without assuming viewport from width alone"
    )
    parser.add_argument("paths", nargs="*", type=Path, help="audit record YAML paths; defaults to repository records")
    args = parser.parse_args()

    paths = args.paths or candidate_records()
    if not paths:
        print("PASS no Figma variable-mode audit records found")
        return 0

    all_passed = True
    for path in paths:
        try:
            findings = audit_record(load_yaml(path))
        except Exception as exc:
            findings = [finding("ERROR", "INVALID_AUDIT_RECORD", "", str(exc))]
        all_passed = print_findings(path, findings) and all_passed
    return 0 if all_passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
