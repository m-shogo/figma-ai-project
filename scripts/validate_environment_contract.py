#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

import yaml
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = ROOT / "schemas" / "environment-contract.schema.json"


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("top-level YAML value must be an object")
    return value


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def schema_errors(data: dict[str, Any]) -> list[str]:
    schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
    validator = Draft202012Validator(schema)
    return [error.message for error in sorted(validator.iter_errors(data), key=lambda e: list(e.path))]


def resolve_repo_path(value: str) -> Path:
    path = (ROOT / value).resolve()
    if ROOT != path and ROOT not in path.parents:
        raise ValueError(f"path escapes repository root: {value}")
    return path


def semantic_errors(contract: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    env = contract.get("environment_contract", {})
    errors.extend(schema_errors(env))

    required = [str(value).strip() for value in env.get("required_profiles", [])]
    if len(required) != len(set(required)):
        errors.append("environment_contract.required_profiles must be unique")

    override_ids = [
        str(item.get("profile_id", "")).strip()
        for item in env.get("effective_overrides", [])
        if isinstance(item, dict)
    ]
    if len(override_ids) != len(set(override_ids)):
        errors.append("environment_contract effective override profile ids must be unique")

    if contract.get("status") != "FROZEN":
        return errors

    if env.get("status") != "RESOLVED":
        errors.append("FROZEN Shared Contract requires environment_contract.status=RESOLVED")

    company_binding = contract.get("company_policy", {})
    raw_path = str(company_binding.get("path", "")).strip()
    expected_hash = str(company_binding.get("sha256", "")).strip()
    if not raw_path or not expected_hash:
        errors.append("FROZEN environment contract requires bound Company Policy path/hash")
        return errors

    policy_path = resolve_repo_path(raw_path)
    if not policy_path.is_file():
        errors.append(f"Company Policy does not exist: {raw_path}")
        return errors
    if sha256(policy_path) != expected_hash:
        errors.append("Company Policy hash drifted before environment resolution validation")
        return errors

    policy = load_yaml(policy_path)
    profiles = policy.get("browser_support", {}).get("environment_profiles", [])
    policy_required = {
        str(item.get("id", "")).strip()
        for item in profiles
        if isinstance(item, dict) and item.get("role") == "REQUIRED"
    }

    if set(required) != policy_required:
        errors.append(
            "environment_contract.required_profiles must exactly match REQUIRED Company Policy environment profiles"
        )

    canonical = str(env.get("canonical_profile", "")).strip()
    policy_canonical = str(policy.get("visual_tolerance", {}).get("canonical_environment_profile", "")).strip()
    if canonical != policy_canonical:
        errors.append("environment_contract canonical_profile must match Company Policy canonical environment")
    if canonical and canonical not in policy_required:
        errors.append("environment_contract canonical_profile must be REQUIRED")

    if set(override_ids) != policy_required:
        errors.append("environment_contract must contain one explicit effective override record per REQUIRED profile")

    runtime = env.get("runtime_detection", {})
    policy_runtime = policy.get("browser_support", {}).get("runtime_detection", {})
    if runtime.get("feature_detection_required") is not True:
        errors.append("resolved environment contract requires feature_detection_required=true")
    if str(runtime.get("strategy", "")) != str(policy_runtime.get("default", "")):
        errors.append("environment_contract runtime detection strategy must match Company Policy")
    if str(runtime.get("ua_sniffing_policy", "")) != str(policy_runtime.get("ua_sniffing", "")):
        errors.append("environment_contract UA sniffing policy must match Company Policy")

    policy_full_reset = policy.get("css", {}).get("foundation_layers", {}).get("device_specific_full_reset")
    if env.get("foundation", {}).get("device_specific_full_reset") is True and policy_full_reset is not True:
        errors.append("device-specific full reset is not allowed by Company Policy")

    qa = env.get("qa", {})
    if qa.get("full_page_capture") != "ALL_REQUIRED":
        errors.append("FROZEN production environment contract requires Full Page capture for ALL_REQUIRED profiles")
    if qa.get("interaction_qa") != "ALL_RELEVANT_REQUIRED":
        errors.append("FROZEN production environment contract requires interaction QA for all relevant REQUIRED profiles")

    return errors


def candidate_contracts() -> list[Path]:
    found = [ROOT / "templates" / "shared-contract.yaml"]
    for base in (ROOT / "contracts", ROOT / "experiments"):
        if not base.exists():
            continue
        for path in sorted(base.rglob("*.yaml")):
            if path.name == "shared-contract.yaml" or path.name.endswith("shared-contract.yaml"):
                found.append(path)
    return list(dict.fromkeys(found))


def main() -> int:
    failures = 0
    for path in candidate_contracts():
        try:
            errors = semantic_errors(load_yaml(path))
        except Exception as exc:
            errors = [str(exc)]
        rel = path.relative_to(ROOT)
        if errors:
            failures += 1
            print(f"FAIL {rel} environment-contract")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"PASS {rel} environment-contract")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
