#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("top-level YAML value must be an object")
    return value


def candidate_contracts() -> list[Path]:
    found: list[Path] = [ROOT / "templates" / "shared-contract.yaml"]
    for base in (ROOT / "contracts", ROOT / "experiments", ROOT / "references"):
        if not base.exists():
            continue
        for path in sorted(base.rglob("*.yaml")):
            if path.name == "shared-contract.yaml" or path.name.endswith("shared-contract.yaml"):
                found.append(path)
    return list(dict.fromkeys(found))


def require_evidence(errors: list[str], label: str, state: str, evidence: Any, none_value: str = "NONE") -> None:
    if state in {"UNKNOWN", none_value}:
        return
    if not isinstance(evidence, list) or not evidence:
        errors.append(f"figma_profile.{label}={state} requires non-empty evidence")


def validate_contract(path: Path) -> list[str]:
    data = load_yaml(path)
    errors: list[str] = []
    profile = data.get("figma_profile", {})
    freeze = data.get("freeze", {})
    frozen = data.get("status") == "FROZEN" or freeze.get("ready") is True

    if not profile:
        return ["shared contract requires figma_profile"]

    components = profile.get("components", {})
    variables = profile.get("variables", {})
    auto_layout = profile.get("auto_layout", {})
    naming = profile.get("semantic_naming", {})
    code_connect = profile.get("code_connect", {})
    annotations = profile.get("annotations", {})
    assets = profile.get("assets", {})

    require_evidence(errors, "components.level", str(components.get("level", "UNKNOWN")), components.get("evidence"))
    require_evidence(errors, "variables.level", str(variables.get("level", "UNKNOWN")), variables.get("evidence"))
    require_evidence(errors, "auto_layout.coverage", str(auto_layout.get("coverage", "UNKNOWN")), auto_layout.get("evidence"))
    require_evidence(errors, "semantic_naming.quality", str(naming.get("quality", "UNKNOWN")), naming.get("evidence"), none_value="__NO_NONE__")
    require_evidence(errors, "code_connect.level", str(code_connect.get("level", "UNKNOWN")), code_connect.get("evidence"))
    require_evidence(errors, "annotations.level", str(annotations.get("level", "UNKNOWN")), annotations.get("evidence"))
    require_evidence(errors, "assets.level", str(assets.get("level", "UNKNOWN")), assets.get("evidence"))

    coverage = str(auto_layout.get("coverage", "UNKNOWN"))
    generation = str(auto_layout.get("generation", "UNKNOWN"))
    if coverage == "NONE" and generation != "NONE":
        errors.append("figma_profile.auto_layout.generation must be NONE when coverage=NONE")
    if coverage != "NONE" and coverage != "UNKNOWN" and generation == "NONE":
        errors.append("figma_profile.auto_layout.generation cannot be NONE when Auto Layout is observed")
    if generation not in {"NONE", "UNKNOWN"} and not auto_layout.get("evidence"):
        errors.append(f"figma_profile.auto_layout.generation={generation} requires evidence")

    cc_level = str(code_connect.get("level", "UNKNOWN"))
    mapped = code_connect.get("mapped_components", [])
    if cc_level == "NONE" and mapped:
        errors.append("figma_profile.code_connect.mapped_components must be empty when level=NONE")
    if cc_level in {"PARTIAL", "STRONG"} and not mapped:
        errors.append(f"figma_profile.code_connect.level={cc_level} requires mapped_components")

    if frozen:
        if not profile.get("captured_at"):
            errors.append("frozen shared contract requires figma_profile.captured_at")
        if not profile.get("source_nodes"):
            errors.append("frozen shared contract requires figma_profile.source_nodes")

        required_non_unknown = {
            "components.level": components.get("level"),
            "variables.level": variables.get("level"),
            "auto_layout.coverage": auto_layout.get("coverage"),
            "auto_layout.generation": auto_layout.get("generation"),
            "semantic_naming.quality": naming.get("quality"),
            "code_connect.level": code_connect.get("level"),
            "annotations.level": annotations.get("level"),
            "assets.level": assets.get("level"),
        }
        for label, value in required_non_unknown.items():
            if value in {None, "", "UNKNOWN"}:
                errors.append(
                    f"frozen shared contract cannot keep figma_profile.{label}=UNKNOWN; "
                    "record NONE when inspected and absent"
                )

        if not profile.get("strategy_decisions"):
            errors.append(
                "frozen shared contract requires at least one figma_profile.strategy_decisions entry "
                "explaining how the observed profile affects implementation"
            )

    return errors


def main() -> int:
    failures = 0
    for path in candidate_contracts():
        try:
            errors = validate_contract(path)
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
