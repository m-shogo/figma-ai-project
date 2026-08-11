#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path
from typing import Any

import yaml
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schemas" / "implementation-profile.schema.json"
TARGETS_PATH = ROOT / "config" / "implementation-targets.yaml"
VALID_FAMILIES = {"STATIC_WEB", "PHP_TEMPLATE", "WORDPRESS", "JS_FRAMEWORK", "OTHER"}
JS_VARIANTS = {"REACT", "NEXT", "VUE", "NUXT", "SVELTE", "SVELTEKIT", "ASTRO", "OTHER"}
PHP_VARIANTS = {"PLAIN_PHP", "BLADE", "TWIG", "OTHER"}
WORDPRESS_VARIANTS = {"CLASSIC", "BLOCK", "HYBRID"}


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


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def repo_path(value: str) -> Path:
    path = (ROOT / value).resolve()
    if path != ROOT and ROOT not in path.parents:
        raise ValueError(f"path escapes repository root: {value}")
    return path


def selector_errors(config: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    selector = config.get("selector", {})
    options = selector.get("options", [])
    ids = [str(item.get("id", "")) for item in options if isinstance(item, dict)]
    if selector.get("initial_control") != "RADIO":
        errors.append("implementation target initial_control must be RADIO")
    if len(ids) != len(set(ids)):
        errors.append("implementation target selector ids must be unique")
    required = {"AUTO_EXISTING", *VALID_FAMILIES}
    missing = sorted(required - set(ids))
    if missing:
        errors.append("implementation target selector missing: " + ", ".join(missing))
    if selector.get("default") != "AUTO_EXISTING":
        errors.append("implementation target default must remain AUTO_EXISTING")
    return errors


def required_check_ids(profile: dict[str, Any], config: dict[str, Any]) -> list[str]:
    family = str(profile.get("effective", {}).get("family", ""))
    variant = str(profile.get("effective", {}).get("variant", ""))
    ids: list[str] = []
    ids.extend(str(value) for value in config.get("common_checklist", []))
    ids.extend(str(value) for value in config.get("family_checklists", {}).get(family, []))
    ids.extend(str(value) for value in config.get("variant_checklists", {}).get(variant, []))
    if family == "WORDPRESS" and profile.get("platform", {}).get("wordpress", {}).get("acf", {}).get("enabled") is True:
        ids.extend(str(value) for value in config.get("conditional_checklists", {}).get("WORDPRESS_ACF", []))
    return list(dict.fromkeys(ids))


def nonempty(value: Any) -> bool:
    return bool(str(value or "").strip())


def semantic_errors(profile: dict[str, Any], config: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    frozen = profile.get("freeze", {}).get("ready") is True
    if frozen and profile.get("status") != "FROZEN":
        errors.append("freeze.ready=true requires status=FROZEN")
    if profile.get("status") == "FROZEN" and not frozen:
        errors.append("status=FROZEN requires freeze.ready=true")
    if not frozen:
        return errors

    repository = profile.get("repository", {})
    if repository.get("inspected") is not True:
        errors.append("FROZEN implementation profile requires repository.inspected=true")
    for field in ("repository", "starting_commit", "target_route_or_template"):
        if not nonempty(repository.get(field)):
            errors.append(f"FROZEN implementation profile requires repository.{field}")
    if not repository.get("evidence_paths"):
        errors.append("FROZEN implementation profile requires repository.evidence_paths")

    resolution = profile.get("resolution", {})
    if resolution.get("confidence") == "NONE":
        errors.append("FROZEN implementation profile requires non-NONE detection confidence")
    if not resolution.get("evidence"):
        errors.append("FROZEN implementation profile requires resolution evidence")
    conflicts = list(resolution.get("conflicts", [])) + list(profile.get("conflicts", []))
    if conflicts and resolution.get("conflict_resolution") in {"", "NONE", None}:
        errors.append("implementation target conflicts require explicit conflict_resolution before freeze")

    effective = profile.get("effective", {})
    family = str(effective.get("family", "")).strip()
    variant = str(effective.get("variant", "")).strip()
    if family not in VALID_FAMILIES:
        errors.append("FROZEN effective.family must resolve to a supported implementation family")
    for field in ("language_runtime", "styling_architecture", "component_system", "image_pipeline", "test_harness", "rendering_mode"):
        if not nonempty(effective.get(field)):
            errors.append(f"FROZEN implementation profile requires effective.{field}")

    selection = profile.get("selection", {})
    selected_family = str(selection.get("family", ""))
    if selection.get("mode") == "EXPLICIT" and selected_family not in {family, "AUTO_EXISTING"}:
        if resolution.get("conflict_resolution") not in {"COMPANY_OVERRIDE", "REPOSITORY_OVERRIDE", "OWNER_APPROVED"}:
            errors.append("explicit selected family differs from effective family without approved resolution")

    checklist_rows = profile.get("checklist", [])
    checklist: dict[str, dict[str, Any]] = {}
    duplicates: set[str] = set()
    for row in checklist_rows:
        if not isinstance(row, dict):
            continue
        check_id = str(row.get("id", "")).strip()
        if check_id in checklist:
            duplicates.add(check_id)
        checklist[check_id] = row
    if duplicates:
        errors.append("duplicate implementation checklist ids: " + ", ".join(sorted(duplicates)))
    for check_id in required_check_ids(profile, config):
        row = checklist.get(check_id)
        if row is None:
            errors.append(f"missing required implementation checklist item: {check_id}")
        elif row.get("status") != "PASS":
            errors.append(f"implementation checklist item must PASS before freeze: {check_id}")

    if profile.get("unknowns"):
        errors.append("FROZEN implementation profile cannot retain unknowns")

    platform = profile.get("platform", {})
    if family == "STATIC_WEB":
        block = platform.get("static_web", {})
        for field in ("html_strategy", "script_strategy", "output_contract"):
            if not nonempty(block.get(field)):
                errors.append(f"STATIC_WEB requires platform.static_web.{field}")
    elif family == "PHP_TEMPLATE":
        block = platform.get("php_template", {})
        if block.get("engine") not in PHP_VARIANTS:
            errors.append("PHP_TEMPLATE requires a resolved engine")
        for field in ("escaping_strategy", "route_data_contract", "partial_strategy"):
            if not nonempty(block.get(field)):
                errors.append(f"PHP_TEMPLATE requires platform.php_template.{field}")
    elif family == "JS_FRAMEWORK":
        block = platform.get("js_framework", {})
        if block.get("framework") not in JS_VARIANTS:
            errors.append("JS_FRAMEWORK requires a resolved framework")
        if variant and variant != block.get("framework"):
            errors.append("effective.variant must match platform.js_framework.framework")
        for field in ("version", "router_mode", "rendering_mode", "server_client_boundary", "data_fetch_cache", "image_policy"):
            if not nonempty(block.get(field)):
                errors.append(f"JS_FRAMEWORK requires platform.js_framework.{field}")
    elif family == "WORDPRESS":
        wp = platform.get("wordpress", {})
        if wp.get("enabled") is not True:
            errors.append("WORDPRESS effective family requires platform.wordpress.enabled=true")
        if wp.get("theme_type") not in WORDPRESS_VARIANTS:
            errors.append("WORDPRESS requires resolved theme_type CLASSIC/BLOCK/HYBRID")
        if variant and variant != wp.get("theme_type"):
            errors.append("effective.variant must match platform.wordpress.theme_type")
        for field in ("wordpress_version", "php_version", "template_unit", "editor_model", "asset_enqueue", "image_helpers"):
            if not nonempty(wp.get(field)):
                errors.append(f"WORDPRESS requires platform.wordpress.{field}")

        acf = wp.get("acf", {})
        delivery = profile.get("delivery_requirements", {}).get("acf", {})
        if acf.get("enabled") is True:
            for field in ("version", "architecture", "field_group_ownership", "image_return_format", "local_json_policy"):
                if not nonempty(acf.get(field)):
                    errors.append(f"ACF-enabled profile requires platform.wordpress.acf.{field}")
            if acf.get("stable_keys_required") is not True:
                errors.append("ACF-enabled profile requires stable_keys_required=true")
            if delivery.get("required") is not True:
                errors.append("ACF-enabled profile requires delivery_requirements.acf.required=true")
            export_json = delivery.get("export_json", {})
            if export_json.get("required") is not True:
                errors.append("ACF-enabled profile requires importable ACF export JSON")
            if export_json.get("format") != "ACF_EXPORT_ARRAY":
                errors.append("ACF export deliverable must use ACF_EXPORT_ARRAY")
            target_path = str(export_json.get("target_repo_path", ""))
            if not target_path.endswith(".json"):
                errors.append("ACF export target_repo_path must be a .json file")
            if export_json.get("evidence_copy_required") is not True:
                errors.append("ACF export JSON requires an evidence copy for experiment audit")
            if delivery.get("import_or_sync_smoke_required") is not True:
                errors.append("ACF-enabled profile requires import/sync smoke evidence")
            if not delivery.get("accepted_methods"):
                errors.append("ACF-enabled profile requires at least one accepted import/sync method")
            local_policy = str(acf.get("local_json_policy", ""))
            local_json = delivery.get("local_json", {})
            if local_policy == "REQUIRED":
                if local_json.get("required") is not True or not nonempty(local_json.get("target_repo_dir")):
                    errors.append("ACF local_json_policy=REQUIRED requires a target Local JSON directory")
        elif delivery.get("required") is True:
            errors.append("delivery_requirements.acf.required cannot be true when ACF is disabled")

    return errors


def profile_paths() -> list[Path]:
    paths = [ROOT / "templates" / "implementation-profile.yaml"]
    for base in (ROOT / "implementation-profiles", ROOT / "experiments"):
        if not base.exists():
            continue
        paths.extend(sorted(base.rglob("implementation-profile.yaml")))
        paths.extend(sorted(base.rglob("*.implementation-profile.yaml")))
    return list(dict.fromkeys(paths))


def contract_binding_errors(config: dict[str, Any]) -> list[tuple[Path, list[str]]]:
    results: list[tuple[Path, list[str]]] = []
    candidates = [ROOT / "templates" / "shared-contract.yaml"]
    contracts = ROOT / "contracts"
    if contracts.exists():
        candidates.extend(sorted(contracts.rglob("shared-contract.yaml")))
    for path in list(dict.fromkeys(candidates)):
        data = load_yaml(path)
        if data.get("freeze", {}).get("ready") is not True:
            results.append((path, []))
            continue
        errors: list[str] = []
        binding = data.get("implementation_profile", {})
        if not isinstance(binding, dict) or binding.get("status") != "BOUND":
            errors.append("FROZEN Shared Contract requires implementation_profile.status=BOUND")
            results.append((path, errors))
            continue
        raw_path = str(binding.get("path", "")).strip()
        expected_hash = str(binding.get("sha256", "")).strip()
        expected_id = str(binding.get("profile_id", "")).strip()
        if not raw_path or not expected_hash or not expected_id:
            errors.append("BOUND implementation_profile requires path/profile_id/sha256")
            results.append((path, errors))
            continue
        try:
            linked_path = repo_path(raw_path)
        except ValueError as exc:
            errors.append(str(exc))
            results.append((path, errors))
            continue
        if not linked_path.is_file():
            errors.append(f"linked Implementation Profile does not exist: {raw_path}")
        else:
            linked = load_yaml(linked_path)
            if file_sha256(linked_path) != expected_hash:
                errors.append("Shared Contract Implementation Profile hash is stale")
            if linked.get("profile_id") != expected_id:
                errors.append("Shared Contract Implementation Profile id mismatch")
            errors.extend(semantic_errors(linked, config))
            if linked.get("status") != "FROZEN" or linked.get("freeze", {}).get("ready") is not True:
                errors.append("BOUND Implementation Profile must be FROZEN")
        results.append((path, errors))
    return results


def main() -> int:
    schema = load_json(SCHEMA_PATH)
    config = load_yaml(TARGETS_PATH)
    failures = 0

    config_errors = selector_errors(config)
    if config_errors:
        failures += 1
        print("FAIL config/implementation-targets.yaml")
        for error in config_errors:
            print(f"  - {error}")
    else:
        print("PASS config/implementation-targets.yaml")

    validator = Draft202012Validator(schema)
    for path in profile_paths():
        data = load_yaml(path)
        errors = [error.message for error in validator.iter_errors(data)]
        errors.extend(semantic_errors(data, config))
        rel = path.relative_to(ROOT)
        if errors:
            failures += 1
            print(f"FAIL {rel}")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"PASS {rel}")

    for path, errors in contract_binding_errors(config):
        rel = path.relative_to(ROOT)
        if errors:
            failures += 1
            print(f"FAIL {rel} implementation-profile-binding")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"PASS {rel} implementation-profile-binding")

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
