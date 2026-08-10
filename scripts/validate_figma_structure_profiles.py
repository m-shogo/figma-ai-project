#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

import yaml
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schemas" / "figma-structure-profile.schema.json"
CONFIDENT = {"MEDIUM", "HIGH"}
MODES = {"STRUCTURE_FIRST", "HYBRID", "VISUAL_FIRST", "CODEBASE_FIRST"}
SIGNAL_NAMES = (
    "components",
    "variables",
    "auto_layout",
    "semantic_naming",
    "code_connect",
    "assets",
    "responsive_mapping",
)


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("top-level YAML value must be an object")
    return value


def load_schema() -> dict[str, Any]:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def fmt_path(parts: list[Any]) -> str:
    if not parts:
        return "<root>"
    out = ""
    for part in parts:
        out += f"[{part}]" if isinstance(part, int) else (("." if out else "") + str(part))
    return out


def schema_errors(data: dict[str, Any], schema: dict[str, Any]) -> list[str]:
    validator = Draft202012Validator(schema)
    errors = sorted(validator.iter_errors(data), key=lambda error: list(error.absolute_path))
    return [f"{fmt_path(list(error.absolute_path))}: {error.message}" for error in errors]


def evidence_present(signal: dict[str, Any]) -> bool:
    evidence = signal.get("evidence", [])
    return isinstance(evidence, list) and bool(evidence)


def semantic_errors(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    sections = data.get("sections", [])
    ids = [str(section.get("section_id", "")) for section in sections]
    if len(ids) != len(set(ids)):
        errors.append("section_id values must be unique")

    page = data.get("page", {})
    if isinstance(page, dict) and page.get("auto_layout_generation") == "UNDETERMINED":
        if not page.get("notes"):
            errors.append("page auto_layout_generation=UNDETERMINED requires notes/evidence")

    for index, section in enumerate(sections):
        section_id = str(section.get("section_id", f"index-{index}"))
        prefix = f"sections[{index}] {section_id}"
        node_ids = section.get("figma_node_ids", [])
        if not node_ids:
            errors.append(f"{prefix}: figma_node_ids must not be empty")

        signals = section.get("signals", {})
        for name in SIGNAL_NAMES:
            signal = signals.get(name, {})
            state = str(signal.get("state", "UNKNOWN"))
            confidence = str(signal.get("confidence", "NONE"))
            evidence = signal.get("evidence", [])

            # UNKNOWN is valid while profiling is incomplete. Any other state
            # represents an inspection result and must retain evidence.
            if state in {"NONE", "OBSERVED", "UNDETERMINED"} and (
                not isinstance(evidence, list) or not evidence
            ):
                errors.append(f"{prefix}: {name} state {state} requires non-empty evidence")
            if state in {"OBSERVED", "UNDETERMINED"} and confidence == "NONE":
                errors.append(
                    f"{prefix}: {name} state {state} requires LOW/MEDIUM/HIGH confidence"
                )
            if confidence in CONFIDENT and (not isinstance(evidence, list) or not evidence):
                errors.append(
                    f"{prefix}: {name} confidence {confidence} requires non-empty evidence"
                )

        components = signals.get("components", {})
        if components.get("state") == "NONE" and components.get("instance_count") not in {None, 0}:
            errors.append(
                f"{prefix}: components state NONE conflicts with instance_count {components.get('instance_count')}"
            )

        variables = signals.get("variables", {})
        if variables.get("state") == "NONE":
            coverage = variables.get("bound_property_coverage")
            if coverage not in {None, 0, 0.0}:
                errors.append(
                    f"{prefix}: variables state NONE conflicts with bound_property_coverage {coverage}"
                )
            if variables.get("modes_observed"):
                errors.append(f"{prefix}: variables state NONE cannot have modes_observed")

        auto_layout = signals.get("auto_layout", {})
        auto_state = str(auto_layout.get("state", "UNKNOWN"))
        generation = str(auto_layout.get("generation", "UNKNOWN"))
        auto_coverage = auto_layout.get("container_coverage")
        if auto_state == "NONE":
            if generation != "NONE":
                errors.append(f"{prefix}: auto_layout state NONE requires generation NONE")
            if auto_coverage not in {None, 0, 0.0}:
                errors.append(
                    f"{prefix}: auto_layout state NONE conflicts with container_coverage {auto_coverage}"
                )
        if auto_state == "OBSERVED" and generation == "NONE":
            errors.append(f"{prefix}: auto_layout state OBSERVED cannot use generation NONE")
        if generation == "UNDETERMINED" and not evidence_present(auto_layout):
            errors.append(f"{prefix}: auto_layout generation UNDETERMINED requires evidence")

        code_connect = signals.get("code_connect", {})
        mapped_coverage = code_connect.get("mapped_component_coverage")
        code_connect_state = str(code_connect.get("state", "UNKNOWN"))
        code_connect_confidence = str(code_connect.get("confidence", "NONE"))
        if code_connect_state == "NONE" and mapped_coverage not in {None, 0, 0.0}:
            errors.append(
                f"{prefix}: code_connect state NONE conflicts with mapped_component_coverage {mapped_coverage}"
            )
        if code_connect_state == "OBSERVED" and mapped_coverage in {None, 0, 0.0}:
            errors.append(
                f"{prefix}: code_connect state OBSERVED requires mapped_component_coverage > 0"
            )
        if mapped_coverage is not None and mapped_coverage > 0 and code_connect_confidence == "NONE":
            errors.append(
                f"{prefix}: code_connect mapped_component_coverage > 0 cannot use confidence NONE"
            )

        assets = signals.get("assets", {})
        if assets.get("state") == "NONE" and assets.get("exact_sources_available"):
            errors.append(f"{prefix}: assets state NONE cannot have exact_sources_available")

        mode = str(section.get("recommended_translation_mode", "UNKNOWN"))
        reasoning = section.get("mode_reasoning_evidence", [])
        trusted = section.get("trusted_structure", [])
        untrusted = section.get("untrusted_or_missing_structure", [])
        codebase_reuse = section.get("codebase_reuse_priority", [])

        if mode in MODES and (not isinstance(reasoning, list) or not reasoning):
            errors.append(f"{prefix}: translation mode {mode} requires mode_reasoning_evidence")

        if mode == "STRUCTURE_FIRST":
            if auto_state != "OBSERVED" or str(auto_layout.get("confidence", "NONE")) not in CONFIDENT:
                errors.append(
                    f"{prefix}: STRUCTURE_FIRST requires observed Auto Layout with MEDIUM/HIGH confidence"
                )
            if not trusted:
                errors.append(f"{prefix}: STRUCTURE_FIRST requires trusted_structure evidence")
        elif mode == "VISUAL_FIRST" and not untrusted:
            errors.append(f"{prefix}: VISUAL_FIRST requires untrusted_or_missing_structure evidence")
        elif mode == "CODEBASE_FIRST" and not codebase_reuse:
            errors.append(f"{prefix}: CODEBASE_FIRST requires codebase_reuse_priority")
        elif mode == "HYBRID" and not trusted:
            errors.append(f"{prefix}: HYBRID requires at least one trusted_structure item")

        # UNKNOWN mode is intentionally allowed while profiling is incomplete.
        # Active section workers resolve it via validate_figma_structure_profile.py.

    return errors


def candidate_profiles() -> list[Path]:
    found: list[Path] = [ROOT / "templates" / "figma-structure-profile.yaml"]
    for base in (ROOT / "references", ROOT / "experiments", ROOT / "contracts"):
        if not base.exists():
            continue
        for path in sorted(base.rglob("*.yaml")):
            if path.name == "figma-structure-profile.yaml" or path.name.endswith("structure-profile.yaml"):
                found.append(path)
    return list(dict.fromkeys(found))


def validate_profile(path: Path, schema: dict[str, Any]) -> list[str]:
    data = load_yaml(path)
    return [*schema_errors(data, schema), *semantic_errors(data)]


def main() -> int:
    schema = load_schema()
    failures = 0
    for path in candidate_profiles():
        try:
            errors = validate_profile(path, schema)
        except Exception as exc:
            errors = [str(exc)]

        relative = path.relative_to(ROOT)
        if errors:
            failures += 1
            print(f"FAIL {relative}")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"PASS {relative}")

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
