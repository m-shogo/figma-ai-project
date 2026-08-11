#!/usr/bin/env python3
from __future__ import annotations

import argparse
import copy
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
TARGETS_PATH = ROOT / "config" / "implementation-targets.yaml"
TEMPLATE_PATH = ROOT / "templates" / "implementation-profile.yaml"


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"top-level YAML must be an object: {path}")
    return value


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def normalize_bool_choice(value: str) -> bool | None:
    normalized = value.strip().upper()
    if normalized == "ENABLED":
        return True
    if normalized == "DISABLED":
        return False
    if normalized in {"", "AUTO_EXISTING", "UNCHANGED"}:
        return None
    raise ValueError("--acf must be ENABLED, DISABLED, or AUTO_EXISTING")


def selector_option_ids(config: dict[str, Any]) -> set[str]:
    options = config.get("selector", {}).get("options", [])
    return {
        str(item.get("id", "")).strip()
        for item in options
        if isinstance(item, dict) and str(item.get("id", "")).strip()
    }


def allowed_variants(config: dict[str, Any], family: str) -> set[str]:
    values = config.get("conditional_selectors", {}).get(family, {}).get("options", [])
    return {str(value).strip() for value in values if str(value).strip()}


def managed_check_ids(config: dict[str, Any]) -> set[str]:
    ids: set[str] = set(str(value) for value in config.get("common_checklist", []))
    for group in (
        config.get("family_checklists", {}),
        config.get("variant_checklists", {}),
        config.get("conditional_checklists", {}),
    ):
        if not isinstance(group, dict):
            continue
        for values in group.values():
            if isinstance(values, list):
                ids.update(str(value) for value in values)
    return ids


def required_check_ids_for_selection(
    config: dict[str, Any],
    *,
    family: str,
    variant: str,
    acf_enabled: bool,
) -> list[str]:
    ids: list[str] = [str(value) for value in config.get("common_checklist", [])]
    if family != "AUTO_EXISTING":
        ids.extend(str(value) for value in config.get("family_checklists", {}).get(family, []))
    if variant and variant != "AUTO_EXISTING":
        ids.extend(str(value) for value in config.get("variant_checklists", {}).get(variant, []))
    if family == "WORDPRESS" and acf_enabled:
        ids.extend(str(value) for value in config.get("conditional_checklists", {}).get("WORDPRESS_ACF", []))
    return list(dict.fromkeys(ids))


def validate_selection(config: dict[str, Any], *, family: str, variant: str, acf_choice: bool | None) -> None:
    family = family.strip().upper()
    if family not in selector_option_ids(config):
        raise ValueError(f"unsupported implementation family: {family}")

    allowed = allowed_variants(config, family)
    if allowed:
        if not variant:
            if "AUTO_EXISTING" not in allowed:
                raise ValueError(f"{family} requires --variant from: {', '.join(sorted(allowed))}")
        elif variant not in allowed:
            raise ValueError(f"unsupported {family} variant {variant}; expected one of: {', '.join(sorted(allowed))}")
    elif variant:
        raise ValueError(f"{family} does not accept --variant")

    if acf_choice is not None and family != "WORDPRESS":
        raise ValueError("--acf can only be configured for WORDPRESS")


def initialize_profile(profile_id: str, *, now: str | None = None) -> dict[str, Any]:
    profile_id = profile_id.strip()
    if not profile_id:
        raise ValueError("--profile-id is required when creating a new implementation profile")
    profile = load_yaml(TEMPLATE_PATH)
    timestamp = now or utc_now()
    profile["profile_id"] = profile_id
    profile["status"] = "DRAFT"
    profile["created_at"] = timestamp
    profile["updated_at"] = timestamp
    return profile


def load_or_initialize_profile(path: Path, profile_id: str, *, now: str | None = None) -> tuple[dict[str, Any], bool]:
    if path.is_file():
        profile = load_yaml(path)
        if profile_id and profile.get("profile_id") != profile_id:
            raise ValueError("--profile-id does not match the existing implementation profile")
        return profile, False
    return initialize_profile(profile_id, now=now), True


def materialize_checklist(
    profile: dict[str, Any],
    config: dict[str, Any],
    *,
    required_ids: list[str],
    selection_label: str,
) -> list[dict[str, Any]]:
    existing_rows = profile.get("checklist", [])
    existing_by_id: dict[str, dict[str, Any]] = {}
    custom_rows: list[dict[str, Any]] = []
    managed = managed_check_ids(config)

    if isinstance(existing_rows, list):
        for row in existing_rows:
            if not isinstance(row, dict):
                continue
            check_id = str(row.get("id", "")).strip()
            if not check_id:
                continue
            if check_id in managed:
                existing_by_id[check_id] = copy.deepcopy(row)
            else:
                custom_rows.append(copy.deepcopy(row))

    rows: list[dict[str, Any]] = []
    for check_id in required_ids:
        if check_id in existing_by_id:
            rows.append(existing_by_id[check_id])
            continue
        rows.append(
            {
                "id": check_id,
                "status": "TODO",
                "evidence": [],
                "notes": [f"Auto-materialized for {selection_label}."],
            }
        )
    rows.extend(custom_rows)
    return rows


def configure_acf_delivery(profile: dict[str, Any], enabled: bool) -> None:
    platform = profile.setdefault("platform", {})
    wordpress = platform.setdefault("wordpress", {})
    acf = wordpress.setdefault("acf", {})
    delivery = profile.setdefault("delivery_requirements", {}).setdefault("acf", {})
    export_json = delivery.setdefault("export_json", {})
    local_json = delivery.setdefault("local_json", {})

    acf["enabled"] = enabled
    if enabled:
        acf["stable_keys_required"] = True
        delivery["required"] = True
        export_json["required"] = True
        export_json["format"] = "ACF_EXPORT_ARRAY"
        if not str(export_json.get("target_repo_path", "")).strip():
            export_json["target_repo_path"] = "acf-export.json"
        export_json["evidence_copy_required"] = True
        delivery["import_or_sync_smoke_required"] = True
        if not delivery.get("accepted_methods"):
            delivery["accepted_methods"] = ["ADMIN_UI"]
        local_json.setdefault("required", False)
        local_json.setdefault("target_repo_dir", "")
    else:
        delivery["required"] = False
        export_json["required"] = False
        export_json["format"] = "ACF_EXPORT_ARRAY"
        export_json["target_repo_path"] = ""
        export_json["evidence_copy_required"] = True
        local_json["required"] = False
        local_json["target_repo_dir"] = ""
        delivery["import_or_sync_smoke_required"] = False
        delivery["accepted_methods"] = []


def configure_profile(
    profile: dict[str, Any],
    config: dict[str, Any],
    *,
    family: str,
    variant: str = "",
    acf_choice: bool | None = None,
    selected_by: str = "OWNER",
    now: str | None = None,
) -> dict[str, Any]:
    if profile.get("status") == "FROZEN" or profile.get("freeze", {}).get("ready") is True:
        raise ValueError("refuse to reconfigure a FROZEN implementation profile")

    family = family.strip().upper()
    variant = variant.strip().upper()
    if not variant:
        allowed = allowed_variants(config, family)
        if "AUTO_EXISTING" in allowed:
            variant = "AUTO_EXISTING"

    validate_selection(config, family=family, variant=variant, acf_choice=acf_choice)

    updated = copy.deepcopy(profile)
    selection = updated.setdefault("selection", {})
    selection["mode"] = "AUTO_EXISTING" if family == "AUTO_EXISTING" else "EXPLICIT"
    selection["family"] = family
    selection["variant"] = "" if family == "AUTO_EXISTING" else variant
    selection["selected_by"] = selected_by
    selection.setdefault("notes", [])

    platform = updated.setdefault("platform", {})
    wordpress = platform.setdefault("wordpress", {})
    js_framework = platform.setdefault("js_framework", {})
    php_template = platform.setdefault("php_template", {})

    if family == "WORDPRESS":
        wordpress["enabled"] = True
        if variant in {"CLASSIC", "BLOCK", "HYBRID"}:
            wordpress["theme_type"] = variant
        elif variant == "AUTO_EXISTING" and not str(wordpress.get("theme_type", "")).strip():
            wordpress["theme_type"] = "UNKNOWN"
    elif wordpress.get("acf", {}).get("enabled") is True or updated.get("delivery_requirements", {}).get("acf", {}).get("required") is True:
        configure_acf_delivery(updated, False)

    if family == "JS_FRAMEWORK" and variant not in {"", "AUTO_EXISTING"}:
        js_framework["framework"] = variant
    if family == "PHP_TEMPLATE" and variant:
        php_template["engine"] = variant

    current_acf_enabled = wordpress.get("acf", {}).get("enabled") is True
    if acf_choice is not None:
        configure_acf_delivery(updated, acf_choice)
        current_acf_enabled = acf_choice
    elif family != "WORDPRESS":
        current_acf_enabled = False

    required_ids = required_check_ids_for_selection(
        config,
        family=family,
        variant=variant,
        acf_enabled=current_acf_enabled,
    )
    label = family if not variant else f"{family}/{variant}"
    if current_acf_enabled:
        label += "+ACF"
    updated["checklist"] = materialize_checklist(
        updated,
        config,
        required_ids=required_ids,
        selection_label=label,
    )

    updated.setdefault("delivery_requirements", {}).setdefault("source_code_required", True)
    updated["updated_at"] = now or utc_now()
    return updated


def render_yaml(profile: dict[str, Any]) -> str:
    return yaml.safe_dump(profile, sort_keys=False, allow_unicode=True, width=120)


def show_options(config: dict[str, Any]) -> None:
    selector = config.get("selector", {})
    print(f"Initial control: {selector.get('initial_control', '')}")
    print(f"Default: {selector.get('default', '')}")
    for item in selector.get("options", []):
        if not isinstance(item, dict):
            continue
        print(f"- {item.get('id')}: {item.get('label')} — {item.get('description')}")
    for family, block in config.get("conditional_selectors", {}).items():
        print(f"{family} ({block.get('control', '')}): {', '.join(str(v) for v in block.get('options', []))}")
    for feature, block in config.get("conditional_feature_selectors", {}).items():
        options = block.get("options", [])
        ids = [str(item.get("id")) if isinstance(item, dict) else str(item) for item in options]
        print(f"{feature} ({block.get('control', '')}): {', '.join(ids)}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Materialize implementation-target selection into a DRAFT Implementation Profile without inventing repository evidence"
    )
    parser.add_argument("profile", type=Path, nargs="?")
    parser.add_argument("--profile-id", default="", help="required when creating a new profile path")
    parser.add_argument("--family", default="")
    parser.add_argument("--variant", default="")
    parser.add_argument("--acf", default="AUTO_EXISTING", help="ENABLED | DISABLED | AUTO_EXISTING")
    parser.add_argument("--selected-by", default="OWNER")
    parser.add_argument("--apply", action="store_true", help="write/create the configured profile; default is dry-run YAML to stdout")
    parser.add_argument("--show-options", action="store_true", help="show the radio-selector options and exit")
    args = parser.parse_args()

    config = load_yaml(TARGETS_PATH)
    if args.show_options:
        show_options(config)
        return 0

    if args.profile is None:
        parser.error("profile is required unless --show-options is used")
    if not args.family:
        parser.error("--family is required")

    path = args.profile if args.profile.is_absolute() else ROOT / args.profile
    profile, created = load_or_initialize_profile(path, args.profile_id)
    acf_choice = normalize_bool_choice(args.acf)
    updated = configure_profile(
        profile,
        config,
        family=args.family,
        variant=args.variant,
        acf_choice=acf_choice,
        selected_by=args.selected_by,
    )
    rendered = render_yaml(updated)

    if args.apply:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(rendered, encoding="utf-8")
        action = "CREATED" if created else "UPDATED"
        print(f"{action} {path.resolve().relative_to(ROOT.resolve()).as_posix()}")
    else:
        print(rendered, end="")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except ValueError as exc:
        print(f"ERROR {exc}", file=sys.stderr)
        raise SystemExit(2)
