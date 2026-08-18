#!/usr/bin/env python3
"""Validate WordPress supplied-theme intake records.

The point of this gate is narrow and deliberate: keep an agent from inventing a
production theme structure before the real theme is supplied and observed.

Contract: docs/wordpress-theme-intake.md
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

import yaml
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schemas" / "wordpress-theme-intake.schema.json"
RECORD_NAME = "theme-intake.yaml"

# WordPress template surfaces a real project must consciously decide about.
# Presence in the matrix is required; `required: UNDETERMINED` is a valid answer.
REQUIRED_SURFACES: tuple[str, ...] = (
    "FRONT_PAGE",
    "POSTS_INDEX",
    "PAGE",
    "SINGLE",
    "ARCHIVE",
    "CATEGORY",
    "TAXONOMY",
    "SEARCH",
    "NOT_FOUND",
    "CPT_ARCHIVE",
    "CPT_SINGLE",
    "PAGE_TEMPLATE",
    "PART",
)

OBSERVED_STATES = {"OBSERVED"}
EPHEMERAL_FIGMA_ASSET = re.compile(r"https://www\.figma\.com/api/mcp/asset/[0-9a-fA-F-]{20,}")
LICENSE_KEY_ASSIGNMENT = re.compile(r"ACF_PRO_LICENSE_KEY\s*[:=]\s*(?P<value>\S+)")

# `- Header: `y=0 h=100`` rows inside the PC block of the section evidence document.
SECTION_ROW = re.compile(r"^- (?P<name>[A-Za-z][A-Za-z0-9 /-]*): `y=[0-9.]+ h=[0-9.]+`\s*$", re.M)
PC_BLOCK = re.compile(r"^### PC\s*$(?P<body>.*?)^### ", re.M | re.S)
MIN_REFERENCE_SECTIONS = 5


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("top-level YAML value must be an object")
    return value


def fmt_path(parts: list[Any]) -> str:
    output = ""
    for part in parts:
        output += f"[{part}]" if isinstance(part, int) else (("." if output else "") + str(part))
    return output or "<root>"


def schema_errors(data: dict[str, Any], schema: dict[str, Any]) -> list[str]:
    validator = Draft202012Validator(schema)
    ordered = sorted(validator.iter_errors(data), key=lambda error: list(error.absolute_path))
    return [f"{fmt_path(list(error.absolute_path))}: {error.message}" for error in ordered]


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.strip().lower()).strip("-")


def repo_path(value: str) -> Path:
    path = (ROOT / value).resolve()
    if path != ROOT and ROOT not in path.parents:
        raise ValueError(f"path escapes repository root: {value}")
    return path


def reference_sections(evidence_path: Path) -> tuple[list[str], list[str]]:
    """Extract the canonical section ids from committed benchmark evidence."""
    text = evidence_path.read_text(encoding="utf-8")
    block = PC_BLOCK.search(text)
    if not block:
        return [], [f"section evidence has no parsable '### PC' geometry block: {evidence_path}"]
    names = [match.group("name") for match in SECTION_ROW.finditer(block.group("body"))]
    slugs = list(dict.fromkeys(slugify(name) for name in names if slugify(name)))
    if len(slugs) < MIN_REFERENCE_SECTIONS:
        return [], [
            f"section evidence yielded only {len(slugs)} sections; refusing to validate coverage "
            f"against an under-parsed document: {evidence_path}"
        ]
    return slugs, []


def hygiene_errors(raw: str) -> list[str]:
    errors: list[str] = []
    if EPHEMERAL_FIGMA_ASSET.search(raw):
        errors.append("intake record must not persist short-lived Figma MCP asset URLs")
    for match in LICENSE_KEY_ASSIGNMENT.finditer(raw):
        value = match.group("value").strip("\"'")
        if value and value.upper() not in {"NULL", "NONE", '""', "''"}:
            errors.append("intake record must not commit an ACF_PRO_LICENSE_KEY value")
            break
    return errors


def state_machine_errors(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    status = data.get("status")
    delivery = data.get("theme_delivery", {})
    state = delivery.get("state")

    expected = {
        "AWAITING_THEME": "NOT_SUPPLIED",
        "THEME_SUPPLIED": "SUPPLIED_UNOBSERVED",
        "THEME_OBSERVED": "OBSERVED",
        "FROZEN": "OBSERVED",
    }.get(status)
    if expected and state != expected:
        errors.append(f"status {status} requires theme_delivery.state {expected}, found {state}")

    if state == "NOT_SUPPLIED" and str(delivery.get("repository", "")).strip():
        errors.append("theme_delivery.repository must stay empty while the theme is NOT_SUPPLIED")
    if state in {"SUPPLIED_UNOBSERVED", "OBSERVED"} and not str(delivery.get("repository", "")).strip():
        errors.append("a supplied theme must record theme_delivery.repository")
    if state == "OBSERVED" and not str(delivery.get("starting_commit", "")).strip():
        errors.append("an observed theme must record theme_delivery.starting_commit")
    return errors


def fail_closed_errors(data: dict[str, Any]) -> list[str]:
    """Nothing theme-specific may be asserted before the theme is observed."""
    errors: list[str] = []
    delivery = data.get("theme_delivery", {})
    if delivery.get("state") in OBSERVED_STATES:
        return errors

    if str(delivery.get("theme_slug", "")).strip():
        errors.append("theme_delivery.theme_slug must stay empty until the supplied theme is OBSERVED")
    if delivery.get("theme_family") not in {"UNKNOWN", "UNDETERMINED"}:
        errors.append("theme_delivery.theme_family must stay UNKNOWN/UNDETERMINED until the theme is OBSERVED")

    for index, entry in enumerate(data.get("template_coverage", [])):
        if str(entry.get("target_path", "")).strip():
            errors.append(
                f"template_coverage[{index}].target_path must stay empty until the theme is OBSERVED "
                f"(surface {entry.get('surface')})"
            )
        if entry.get("ownership") != "UNDETERMINED":
            errors.append(
                f"template_coverage[{index}].ownership must stay UNDETERMINED until the theme is OBSERVED "
                f"(surface {entry.get('surface')})"
            )

    for index, entry in enumerate(data.get("content_decisions", [])):
        if entry.get("implementation_unit") != "UNDETERMINED":
            errors.append(
                f"content_decisions[{index}].implementation_unit must stay UNDETERMINED until the theme "
                f"is OBSERVED (section {entry.get('section_id')})"
            )

    if data.get("forms", {}).get("state") == "SELECTED":
        errors.append("forms.state must not be SELECTED before the supplied theme is OBSERVED")
    for key in ("cpt", "taxonomies"):
        if data.get(key, {}).get("state") == "DEFINED":
            errors.append(f"{key}.state must not be DEFINED before the supplied theme is OBSERVED")

    if data.get("freeze", {}).get("ready") is True:
        errors.append("freeze.ready must be false until the supplied theme is OBSERVED")
    return errors


def evidence_backed_none_errors(data: dict[str, Any]) -> list[str]:
    """UNDETERMINED must not be laundered into NONE."""
    errors: list[str] = []
    for key in ("cpt", "taxonomies", "forms"):
        block = data.get(key, {})
        if block.get("state") == "NONE" and not block.get("evidence"):
            errors.append(f"{key}.state NONE requires investigation evidence; use UNDETERMINED instead")
    for index, entry in enumerate(data.get("theme_delivery", {}).get("observation", [])):
        if entry.get("status") == "NONE" and not entry.get("evidence"):
            errors.append(
                f"theme_delivery.observation[{index}] ({entry.get('id')}) NONE requires evidence; "
                "use UNDETERMINED instead"
            )
    return errors


def registration_errors(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    for key in ("cpt", "taxonomies"):
        block = data.get(key, {})
        state = block.get("state")
        entries = block.get("entries", [])
        if state != "DEFINED" and entries:
            errors.append(f"{key}.entries must be empty while state is {state}")
        if state == "DEFINED" and not entries:
            errors.append(f"{key}.state DEFINED requires at least one entry")
        if state == "DEFINED" and not block.get("evidence"):
            errors.append(f"{key}.state DEFINED requires evidence")

    forms = data.get("forms", {})
    selected = str(forms.get("selected_plugin", "")).strip()
    if forms.get("state") == "SELECTED":
        if not selected:
            errors.append("forms.state SELECTED requires forms.selected_plugin")
        if not forms.get("evidence"):
            errors.append("forms.state SELECTED requires evidence")
    elif selected:
        errors.append(f"forms.selected_plugin must stay empty while state is {forms.get('state')}")
    return errors


def coverage_errors(data: dict[str, Any], record_path: Path) -> list[str]:
    errors: list[str] = []

    surfaces = {entry.get("surface") for entry in data.get("template_coverage", [])}
    missing = [surface for surface in REQUIRED_SURFACES if surface not in surfaces]
    if missing:
        errors.append(
            "template_coverage must decide about every WordPress surface; missing: " + ", ".join(missing)
        )

    evidence_value = str(data.get("project", {}).get("section_evidence_path", ""))
    try:
        evidence_path = repo_path(evidence_value)
    except ValueError as exc:
        return errors + [str(exc)]
    if not evidence_path.is_file():
        return errors + [f"project.section_evidence_path does not exist: {evidence_value}"]

    expected, parse_errors = reference_sections(evidence_path)
    if parse_errors:
        return errors + parse_errors

    actual = [str(entry.get("section_id", "")) for entry in data.get("content_decisions", [])]
    duplicates = sorted({value for value in actual if actual.count(value) > 1})
    if duplicates:
        errors.append("content_decisions has duplicate section_id: " + ", ".join(duplicates))

    missing_sections = [value for value in expected if value not in actual]
    if missing_sections:
        errors.append(
            f"content_decisions must cover every section observed in {evidence_value}; missing: "
            + ", ".join(missing_sections)
        )
    extra = [value for value in dict.fromkeys(actual) if value not in expected]
    if extra:
        errors.append(
            f"content_decisions contains sections absent from {evidence_value}; invented: "
            + ", ".join(extra)
        )
    return errors


def editor_capability_errors(data: dict[str, Any]) -> list[str]:
    """Repeater-shaped ownership needs a stated editor capability, not visual repetition."""
    errors: list[str] = []
    for index, entry in enumerate(data.get("content_decisions", [])):
        capability = entry.get("editor_capability", {})
        if entry.get("content_ownership") in {"ACF_FIELD", "ACF_BLOCK"}:
            if capability.get("add_remove") == "UNKNOWN" and capability.get("reorder") == "UNKNOWN":
                errors.append(
                    f"content_decisions[{index}] ({entry.get('section_id')}) claims CMS ownership without any "
                    "observed editor capability"
                )
            if not capability.get("evidence"):
                errors.append(
                    f"content_decisions[{index}] ({entry.get('section_id')}) CMS ownership requires "
                    "editor_capability.evidence"
                )
    return errors


def freeze_errors(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    freeze = data.get("freeze", {})
    if not freeze.get("ready"):
        if data.get("status") == "FROZEN":
            errors.append("status FROZEN requires freeze.ready true")
        return errors

    if data.get("status") != "FROZEN":
        errors.append("freeze.ready true requires status FROZEN")
    if not str(freeze.get("frozen_at", "")).strip():
        errors.append("freeze.ready true requires freeze.frozen_at")

    open_unknowns = [
        entry.get("id") for entry in data.get("unknowns", []) if entry.get("state") != "RESOLVED"
    ]
    if open_unknowns:
        errors.append("freeze.ready true requires every unknown resolved; open: " + ", ".join(open_unknowns))

    for index, entry in enumerate(data.get("template_coverage", [])):
        if entry.get("ownership") == "UNDETERMINED":
            errors.append(f"freeze.ready true requires template_coverage[{index}].ownership resolved")
    for index, entry in enumerate(data.get("content_decisions", [])):
        for field in ("reuse", "content_ownership", "implementation_unit"):
            if entry.get(field) == "UNDETERMINED":
                errors.append(f"freeze.ready true requires content_decisions[{index}].{field} resolved")
    return errors


def unknown_presence_errors(data: dict[str, Any]) -> list[str]:
    if data.get("status") == "FROZEN":
        return []
    if data.get("unknowns"):
        return []
    return ["a non-FROZEN intake record must keep its open unknowns explicit"]


def validate_record(path: Path, schema: dict[str, Any]) -> list[str]:
    try:
        raw = path.read_text(encoding="utf-8")
        data = load_yaml(path)
    except Exception as exc:
        return [str(exc)]

    errors = schema_errors(data, schema)
    if errors:
        return errors

    errors.extend(hygiene_errors(raw))
    errors.extend(state_machine_errors(data))
    errors.extend(fail_closed_errors(data))
    errors.extend(evidence_backed_none_errors(data))
    errors.extend(registration_errors(data))
    errors.extend(coverage_errors(data, path))
    errors.extend(editor_capability_errors(data))
    errors.extend(unknown_presence_errors(data))
    errors.extend(freeze_errors(data))
    return errors


def candidate_paths() -> list[Path]:
    found: list[Path] = []
    for base in (ROOT / "experiments", ROOT / "references", ROOT / "contracts"):
        if not base.exists():
            continue
        found.extend(sorted(base.rglob(RECORD_NAME)))
    return list(dict.fromkeys(found))


def display_path(path: Path) -> str:
    try:
        return path.resolve().relative_to(ROOT.resolve()).as_posix()
    except ValueError:
        return str(path)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Validate WordPress supplied-theme intake records before any theme structure is bound"
    )
    parser.add_argument(
        "paths",
        nargs="*",
        type=Path,
        help=f"intake record paths; when omitted, validate every repository {RECORD_NAME}",
    )
    args = parser.parse_args(argv)

    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    targets = [path.resolve() for path in args.paths] if args.paths else candidate_paths()
    if not targets:
        print(f"SKIP no {RECORD_NAME} record found")
        return 0

    failures = 0
    for path in targets:
        label = display_path(path)
        if not path.is_file():
            print(f"FAIL {label}")
            print("  - record does not exist")
            failures += 1
            continue
        errors = validate_record(path, schema)
        if errors:
            failures += 1
            print(f"FAIL {label}")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"PASS {label}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
