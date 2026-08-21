#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

import yaml
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schemas" / "wordpress-acf-delivery.schema.json"
TEMPLATE_PATH = ROOT / "templates" / "implementation-profile.yaml"
DELIVERY_SCHEMA_VERSION = 6
REQUIRED_ARTIFACT_CLASSES = {
    "THEME_CODE",
    "ASSETS",
    "ACF_EXPORT_JSON",
    "INSTALL_DOC",
    "ACF_FIELD_MAP",
}
REQUIRED_FRESH_STEPS = {
    "THEME_CODE_INSTALL",
    "ACF_JSON_IMPORT",
    "PAGE_TEMPLATE_ASSIGNMENT",
    "FIXTURE_INPUT",
    "FRONTEND_RENDER",
    "PLAYWRIGHT",
}


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"top-level YAML must be an object: {path}")
    return value


def load_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"top-level JSON must be an object: {path}")
    return value


def repo_path(value: str) -> Path:
    path = (ROOT / value).resolve()
    if path != ROOT and ROOT not in path.parents:
        raise ValueError(f"path escapes repository root: {value}")
    return path


def implementation_profile_paths() -> list[Path]:
    found: list[Path] = []
    for base in (ROOT / "implementation-profiles", ROOT / "experiments"):
        if not base.exists():
            continue
        found.extend(sorted(base.rglob("implementation-profile.yaml")))
        found.extend(sorted(base.rglob("*.implementation-profile.yaml")))
    return list(dict.fromkeys(found))


def candidate_runs() -> list[Path]:
    found: list[Path] = []
    for base in (ROOT / "experiments", ROOT / "references", ROOT / "contracts"):
        if not base.exists():
            continue
        for path in sorted(base.rglob("*.yaml")):
            if path.name == "run.yaml" or path.name.endswith("run.yaml"):
                found.append(path)
    return list(dict.fromkeys(found))


def is_wordpress_acf(profile: dict[str, Any]) -> bool:
    return (
        profile.get("effective", {}).get("family") == "WORDPRESS"
        and profile.get("platform", {}).get("wordpress", {}).get("acf", {}).get("enabled") is True
    )


def requires_delivery_v6(profile: dict[str, Any]) -> bool:
    return (
        profile.get("status") == "FROZEN"
        and int(profile.get("schema_version", 0) or 0) >= DELIVERY_SCHEMA_VERSION
        and is_wordpress_acf(profile)
    )


def template_contract_errors(template: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if int(template.get("schema_version", 0) or 0) < DELIVERY_SCHEMA_VERSION:
        errors.append(f"template schema_version must be >= {DELIVERY_SCHEMA_VERSION}")
    delivery = template.get("delivery_requirements", {})
    package = delivery.get("package", {})
    fresh = delivery.get("fresh_install", {})
    acf = delivery.get("acf", {})
    if not isinstance(package, dict) or "required" not in package:
        errors.append("template must declare delivery_requirements.package")
    if not isinstance(fresh, dict) or "required" not in fresh:
        errors.append("template must declare delivery_requirements.fresh_install")
    if not isinstance(acf, dict) or "admin_e2e_required" not in acf:
        errors.append("template ACF delivery must declare admin_e2e_required")
    if isinstance(package, dict):
        for key in ("exclude_acf_pro_plugin", "exclude_license_secret", "exclude_database"):
            if package.get(key) is not True:
                errors.append(f"template delivery package {key} must default to true")
    if isinstance(fresh, dict):
        if fresh.get("database_copy_allowed") is not False:
            errors.append("template fresh_install.database_copy_allowed must default to false")
        if fresh.get("source_acf_db_state_reuse_allowed") is not False:
            errors.append("template fresh_install.source_acf_db_state_reuse_allowed must default to false")
    return errors


def profile_delivery_errors(profile: dict[str, Any], schema: dict[str, Any]) -> list[str]:
    if not requires_delivery_v6(profile):
        return []
    delivery = profile.get("delivery_requirements", {})
    validator = Draft202012Validator(schema["$defs"]["profileRequirement"])
    errors = [error.message for error in validator.iter_errors(delivery)]

    package = delivery.get("package", {})
    classes = {str(value) for value in package.get("artifact_classes", [])}
    missing_classes = sorted(REQUIRED_ARTIFACT_CLASSES - classes)
    if missing_classes:
        errors.append("delivery package missing artifact classes: " + ", ".join(missing_classes))

    fresh = delivery.get("fresh_install", {})
    steps = {str(value) for value in fresh.get("required_steps", [])}
    missing_steps = sorted(REQUIRED_FRESH_STEPS - steps)
    if missing_steps:
        errors.append("fresh install missing required steps: " + ", ".join(missing_steps))
    return errors


def completed_run_delivery_errors(
    run: dict[str, Any],
    profile: dict[str, Any],
    schema: dict[str, Any],
) -> list[str]:
    if run.get("status") != "COMPLETE" or not requires_delivery_v6(profile):
        return []
    delivery = run.get("deliverables", {})
    validator = Draft202012Validator(schema["$defs"]["runEvidence"])
    errors = [error.message for error in validator.iter_errors(delivery)]
    package = delivery.get("package", {})
    artifacts = package.get("artifacts", {}) if isinstance(package, dict) else {}
    for key in ("theme_code", "assets", "install_doc", "acf_field_map"):
        raw = str(artifacts.get(key, "")).strip() if isinstance(artifacts, dict) else ""
        if not raw:
            continue
        try:
            path = repo_path(raw)
        except ValueError as exc:
            errors.append(str(exc))
            continue
        if not path.exists():
            errors.append(f"delivery artifact path does not exist for {key}: {raw}")
    return errors


def run_profile(run: dict[str, Any]) -> tuple[dict[str, Any] | None, str | None]:
    raw = str(run.get("coordination", {}).get("implementation_profile_path", "")).strip()
    if not raw:
        return None, None
    try:
        path = repo_path(raw)
    except ValueError as exc:
        return None, str(exc)
    if not path.is_file():
        return None, f"Implementation Profile does not exist: {raw}"
    return load_yaml(path), None


def main() -> int:
    schema = load_json(SCHEMA_PATH)
    failures = 0

    template_errors = template_contract_errors(load_yaml(TEMPLATE_PATH))
    if template_errors:
        failures += 1
        print("FAIL templates/implementation-profile.yaml WordPress ACF delivery defaults")
        for error in template_errors:
            print(f"  - {error}")
    else:
        print("PASS templates/implementation-profile.yaml WordPress ACF delivery defaults")

    for path in implementation_profile_paths():
        profile = load_yaml(path)
        errors = profile_delivery_errors(profile, schema)
        rel = path.relative_to(ROOT)
        if errors:
            failures += 1
            print(f"FAIL {rel} fresh-delivery-contract")
            for error in errors:
                print(f"  - {error}")
        elif requires_delivery_v6(profile):
            print(f"PASS {rel} fresh-delivery-contract")

    for path in candidate_runs():
        run = load_yaml(path)
        profile, profile_error = run_profile(run)
        rel = path.relative_to(ROOT)
        if profile_error:
            if run.get("status") == "COMPLETE":
                failures += 1
                print(f"FAIL {rel} fresh-delivery-evidence")
                print(f"  - {profile_error}")
            continue
        if profile is None or not requires_delivery_v6(profile) or run.get("status") != "COMPLETE":
            continue
        errors = completed_run_delivery_errors(run, profile, schema)
        if errors:
            failures += 1
            print(f"FAIL {rel} fresh-delivery-evidence")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"PASS {rel} fresh-delivery-evidence")

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
