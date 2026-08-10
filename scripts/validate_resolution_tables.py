#!/usr/bin/env python3
from __future__ import annotations

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


def duplicate_ids(entries: list[Any]) -> set[str]:
    seen: set[str] = set()
    duplicates: set[str] = set()
    for item in entries:
        if not isinstance(item, dict):
            continue
        value = str(item.get("id", "")).strip()
        if not value:
            continue
        if value in seen:
            duplicates.add(value)
        seen.add(value)
    return duplicates


def validate_contract(path: Path) -> list[str]:
    data = load_yaml(path)
    errors: list[str] = []
    frozen = data.get("status") == "FROZEN" or data.get("freeze", {}).get("ready") is True
    profile = data.get("figma_profile", {})
    component_level = str(profile.get("components", {}).get("level", "UNKNOWN"))
    variable_level = str(profile.get("variables", {}).get("level", "UNKNOWN"))
    code_connect_level = str(profile.get("code_connect", {}).get("level", "UNKNOWN"))
    components = data.get("component_resolution", [])
    tokens = data.get("token_resolution", [])

    if not isinstance(components, list):
        return ["component_resolution must be an array"]
    if not isinstance(tokens, list):
        return ["token_resolution must be an array"]

    for value in sorted(duplicate_ids(components)):
        errors.append(f"duplicate component_resolution id: {value}")
    for value in sorted(duplicate_ids(tokens)):
        errors.append(f"duplicate token_resolution id: {value}")

    if component_level == "NONE" and components:
        errors.append(
            "figma_profile.components.level=NONE requires empty component_resolution; "
            "existing code components belong in codebase inventory, not fake Figma mappings"
        )
    if variable_level == "NONE" and tokens:
        errors.append(
            "figma_profile.variables.level=NONE requires empty token_resolution; "
            "existing code tokens are still allowed but are not Figma-variable mappings"
        )

    if frozen and component_level in {"SPARSE", "PARTIAL", "SYSTEMATIC"} and not components:
        errors.append(
            f"frozen contract with Figma Components level={component_level} requires component_resolution"
        )
    if frozen and variable_level in {"SPARSE", "PARTIAL", "SYSTEMATIC"} and not tokens:
        errors.append(
            f"frozen contract with Figma Variables level={variable_level} requires token_resolution"
        )

    for index, item in enumerate(components):
        if not isinstance(item, dict):
            errors.append(f"component_resolution[{index}] must be an object")
            continue
        resolution = str(item.get("resolution", "UNRESOLVED"))
        if resolution == "REUSE_CODE_CONNECT" and code_connect_level not in {"PARTIAL", "STRONG"}:
            errors.append(
                f"component_resolution[{index}] uses REUSE_CODE_CONNECT but profile code_connect={code_connect_level}"
            )
        if resolution in {
            "REUSE_EXISTING",
            "REUSE_CODE_CONNECT",
            "EXTEND_EXISTING",
            "CREATE_SHARED",
            "IMPLEMENT_SECTION_LOCAL",
        } and not str(item.get("code_path", "")).strip():
            errors.append(f"component_resolution[{index}] {resolution} requires code_path")
        if frozen:
            if resolution == "UNRESOLVED":
                errors.append(f"frozen component_resolution[{index}] cannot remain UNRESOLVED")
            if not item.get("evidence"):
                errors.append(f"frozen component_resolution[{index}] requires evidence")

    for index, item in enumerate(tokens):
        if not isinstance(item, dict):
            errors.append(f"token_resolution[{index}] must be an object")
            continue
        resolution = str(item.get("resolution", "UNRESOLVED"))
        if resolution in {
            "REUSE_EXISTING_TOKEN",
            "MAP_VARIABLE_TO_EXISTING",
            "CREATE_SHARED_TOKEN",
            "PRESERVE_MODE_MAPPING",
        } and not str(item.get("code_token", "")).strip():
            errors.append(f"token_resolution[{index}] {resolution} requires code_token")
        if resolution == "PRESERVE_MODE_MAPPING" and not item.get("mode_mapping"):
            errors.append(f"token_resolution[{index}] PRESERVE_MODE_MAPPING requires mode_mapping")
        if frozen:
            if resolution == "UNRESOLVED":
                errors.append(f"frozen token_resolution[{index}] cannot remain UNRESOLVED")
            if not item.get("evidence"):
                errors.append(f"frozen token_resolution[{index}] requires evidence")

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
