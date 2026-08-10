#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

import yaml
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
POLICY_SCHEMA = ROOT / "schemas" / "company-policy.schema.json"
EXPECTED_PRECEDENCE = [
    "COMPANY_POLICY",
    "EXISTING_CODEBASE",
    "FIGMA_IMPLEMENTATION_EVIDENCE",
    "AGENT_INFERENCE",
]


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("top-level YAML value must be an object")
    return value


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def schema_errors(data: dict[str, Any]) -> list[str]:
    schema = json.loads(POLICY_SCHEMA.read_text(encoding="utf-8"))
    validator = Draft202012Validator(schema)
    return [
        error.message
        for error in sorted(validator.iter_errors(data), key=lambda e: list(e.path))
    ]


def accessibility_errors(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    accessibility = data.get("accessibility", {})
    standard = str(accessibility.get("standard", ""))
    conformance = str(accessibility.get("conformance", ""))

    if data.get("status") != "ACTIVE":
        return errors

    if accessibility.get("semantic_html_required") is not True:
        errors.append("ACTIVE Company Policy requires semantic_html_required=true")
    if accessibility.get("keyboard_all_interactive") is not True:
        errors.append("ACTIVE Company Policy requires keyboard operation for all interactive controls")
    if accessibility.get("focus_visible_required") is not True:
        errors.append("ACTIVE Company Policy requires visible keyboard focus")
    if accessibility.get("focus_not_obscured_required") is not True:
        errors.append("ACTIVE Company Policy requires focus not obscured by author-created content")
    if accessibility.get("zoom_must_not_be_disabled") is not True:
        errors.append("ACTIVE Company Policy must not disable browser zoom")
    if accessibility.get("accessible_name_required") is not True:
        errors.append("ACTIVE Company Policy requires accessible names for interactive controls")

    if standard == "WCAG_2_2" and conformance in {"AA", "AAA"}:
        if float(accessibility.get("target_size_min_css_px", 0) or 0) < 24:
            errors.append("WCAG 2.2 AA/AAA policy requires target_size_min_css_px >= 24")
        if float(accessibility.get("resize_text_percent", 0) or 0) < 200:
            errors.append("WCAG 2.2 AA/AAA policy requires resize_text_percent >= 200")
        if accessibility.get("reflow_400_percent_required") is not True:
            errors.append("WCAG 2.2 AA/AAA policy requires 400% reflow verification")

    if standard == "WCAG_2_2" and conformance == "AAA":
        if float(accessibility.get("target_size_min_css_px", 0) or 0) < 44:
            errors.append("WCAG 2.2 AAA policy requires target_size_min_css_px >= 44")

    return errors


def environment_errors(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    browser = data.get("browser_support", {})
    profiles = browser.get("environment_profiles", [])
    if not isinstance(profiles, list):
        return ["browser_support.environment_profiles must be an array"]

    ids = [
        str(item.get("id", "")).strip()
        for item in profiles
        if isinstance(item, dict)
    ]
    if len(ids) != len(set(ids)):
        errors.append("environment profile ids must be unique")

    runtime = browser.get("runtime_detection", {})
    if runtime.get("feature_detection_required") is not True:
        errors.append("runtime detection must require feature detection")
    if runtime.get("width_only_device_classification_forbidden") is not True:
        errors.append("width-only device classification must be forbidden")

    required_profiles = [
        item
        for item in profiles
        if isinstance(item, dict) and item.get("role") == "REQUIRED"
    ]
    if data.get("status") == "ACTIVE" and not required_profiles:
        errors.append("ACTIVE Company Policy requires at least one REQUIRED environment profile")

    required_ids = {str(item.get("id", "")).strip() for item in required_profiles}
    canonical = str(
        data.get("visual_tolerance", {}).get("canonical_environment_profile", "")
    ).strip()
    if data.get("status") == "ACTIVE":
        if not canonical:
            errors.append(
                "ACTIVE Company Policy requires visual_tolerance.canonical_environment_profile"
            )
        elif canonical not in required_ids:
            errors.append(
                "canonical_environment_profile must reference a REQUIRED environment profile"
            )

    responsive = data.get("responsive", {})
    input_queries = responsive.get("input_capability_queries", {})
    if input_queries.get("hover_pointer_required") is not True:
        errors.append("responsive policy must require hover/pointer capability queries")
    if input_queries.get("width_only_hover_inference_forbidden") is not True:
        errors.append("responsive policy must forbid inferring hover from viewport width")

    viewport_meta = responsive.get("viewport_meta", {})
    safe_area = responsive.get("safe_area", {})
    if viewport_meta.get("viewport_fit") == "COVER" and safe_area.get("policy") == "NONE":
        errors.append("viewport-fit=cover requires a safe-area policy")

    css = data.get("css", {})
    layers = css.get("foundation_layers", {})
    if layers:
        if layers.get("reset_required") is not True or layers.get("base_required") is not True:
            errors.append("Foundation must include shared reset and base layers")
        if layers.get("environment_required") is not True:
            errors.append("Foundation must include an environment adaptation layer")
        if layers.get("focus_styles_may_be_removed") is True:
            errors.append("Company Policy must not allow unconditional removal of focus styles")

    interaction = data.get("interaction", {})
    smooth = interaction.get("smooth_scroll", {})
    if (
        smooth.get("required_for_anchor_navigation") is True
        and smooth.get("respect_reduced_motion") is not True
    ):
        errors.append("required smooth scrolling must respect prefers-reduced-motion")
    touch = interaction.get("touch", {})
    if touch.get("browser_gestures_preserved_by_default") is not True:
        errors.append("browser touch gestures must be preserved by default")
    if touch.get("touch_action_none_requires_evidence") is not True:
        errors.append("touch-action:none must require evidence")

    return errors


def semantic_policy_errors(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    precedence = data.get("precedence", {}).get("implementation_constraints", [])
    if precedence != EXPECTED_PRECEDENCE:
        errors.append(
            "implementation precedence must be COMPANY_POLICY > EXISTING_CODEBASE > FIGMA_IMPLEMENTATION_EVIDENCE > AGENT_INFERENCE"
        )

    if data.get("status") == "ACTIVE":
        browser = data.get("browser_support", {})
        if not (
            browser.get("browserslist")
            or browser.get("explicit_minimums")
            or browser.get("test_matrix")
        ):
            errors.append("ACTIVE Company Policy requires an explicit browser support contract")
        update = data.get("update_policy", {})
        if update.get("significant_run_preflight") is not True:
            errors.append("ACTIVE Company Policy requires significant_run_preflight=true")

    errors.extend(environment_errors(data))
    errors.extend(accessibility_errors(data))
    return errors


def candidate_policies() -> list[Path]:
    found = [ROOT / "templates" / "company-policy.yaml"]
    for base in (ROOT / "policies", ROOT / "contracts", ROOT / "experiments"):
        if not base.exists():
            continue
        for path in sorted(base.rglob("*.yaml")):
            if path.name == "company-policy.yaml" or path.name.endswith(
                "company-policy.yaml"
            ):
                found.append(path)
    return list(dict.fromkeys(found))


def candidate_shared_contracts() -> list[Path]:
    found = [ROOT / "templates" / "shared-contract.yaml"]
    for base in (ROOT / "contracts", ROOT / "experiments"):
        if not base.exists():
            continue
        for path in sorted(base.rglob("*.yaml")):
            if path.name == "shared-contract.yaml" or path.name.endswith(
                "shared-contract.yaml"
            ):
                found.append(path)
    return list(dict.fromkeys(found))


def validate_frozen_contract(path: Path, data: dict[str, Any]) -> list[str]:
    if data.get("status") != "FROZEN":
        return []
    errors: list[str] = []
    binding = data.get("company_policy", {})
    if (
        binding.get("status") != "BOUND"
        or binding.get("precedence_verified") is not True
    ):
        errors.append(
            "FROZEN Shared Contract requires BOUND Company Policy with precedence_verified=true"
        )
        return errors

    raw_path = str(binding.get("path", "")).strip()
    expected_hash = str(binding.get("sha256", "")).strip()
    if not raw_path or not expected_hash:
        errors.append("FROZEN Shared Contract requires Company Policy path and sha256")
        return errors

    policy_path = (ROOT / raw_path).resolve()
    if ROOT != policy_path and ROOT not in policy_path.parents:
        errors.append("Company Policy path escapes repository root")
        return errors
    if not policy_path.is_file():
        errors.append(f"Company Policy file does not exist: {raw_path}")
        return errors
    if sha256(policy_path) != expected_hash:
        errors.append("Company Policy sha256 mismatch")
        return errors

    policy = load_yaml(policy_path)
    if policy.get("status") != "ACTIVE":
        errors.append("FROZEN Shared Contract must bind an ACTIVE Company Policy")
    if str(policy.get("policy_id", "")) != str(binding.get("policy_id", "")):
        errors.append("Shared Contract company policy_id does not match linked policy")
    errors.extend(
        f"linked Company Policy: {error}" for error in semantic_policy_errors(policy)
    )
    return errors


def main() -> int:
    failures = 0
    for path in candidate_policies():
        try:
            data = load_yaml(path)
            errors = [*schema_errors(data), *semantic_policy_errors(data)]
        except Exception as exc:
            errors = [str(exc)]
        rel = path.relative_to(ROOT)
        if errors:
            failures += 1
            print(f"FAIL {rel}")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"PASS {rel}")

    for path in candidate_shared_contracts():
        try:
            errors = validate_frozen_contract(path, load_yaml(path))
        except Exception as exc:
            errors = [str(exc)]
        rel = path.relative_to(ROOT)
        if errors:
            failures += 1
            print(f"FAIL {rel} company-policy-lineage")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"PASS {rel} company-policy-lineage")

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
