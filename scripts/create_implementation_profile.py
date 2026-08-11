#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import tempfile
from copy import deepcopy
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "templates" / "implementation-profile.yaml"
TARGETS = ROOT / "config" / "implementation-targets.yaml"


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"top-level YAML must be an object: {path}")
    return value


def selector_family_ids(config: dict[str, Any] | None = None) -> list[str]:
    registry = config if config is not None else load_yaml(TARGETS)
    options = registry.get("selector", {}).get("options", [])
    ids = [str(item.get("id", "")).strip() for item in options if isinstance(item, dict)]
    ids = [family_id for family_id in ids if family_id]
    if not ids:
        raise ValueError("implementation target registry defines no selector options")
    if len(ids) != len(set(ids)):
        raise ValueError("implementation target registry contains duplicate selector ids")
    return ids


def atomic_write(path: Path, value: dict[str, Any], *, force: bool) -> None:
    if path.exists() and not force:
        raise ValueError(f"output already exists: {path}; pass --force to replace")
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            yaml.safe_dump(value, handle, sort_keys=False, allow_unicode=True)
        os.replace(temp_name, path)
    except Exception:
        try:
            os.unlink(temp_name)
        except FileNotFoundError:
            pass
        raise


def checklist_ids(config: dict[str, Any], family: str, variant: str, acf: bool) -> list[str]:
    ids = [str(value) for value in config.get("common_checklist", [])]
    if family != "AUTO_EXISTING":
        ids.extend(str(value) for value in config.get("family_checklists", {}).get(family, []))
    if variant:
        ids.extend(str(value) for value in config.get("variant_checklists", {}).get(variant, []))
    if family == "WORDPRESS" and acf:
        ids.extend(str(value) for value in config.get("conditional_checklists", {}).get("WORDPRESS_ACF", []))
    return list(dict.fromkeys(ids))


def build_profile(*, profile_id: str, family: str, variant: str, acf: bool, selected_by: str) -> dict[str, Any]:
    template = deepcopy(load_yaml(TEMPLATE))
    config = load_yaml(TARGETS)
    valid_families = set(selector_family_ids(config))
    if family not in valid_families:
        raise ValueError(f"unsupported implementation family: {family}")
    conditional = config.get("conditional_selectors", {}).get(family, {}).get("options", [])
    if variant and variant not in conditional:
        raise ValueError(f"unsupported variant {variant!r} for family {family}")
    if acf and family != "WORDPRESS":
        raise ValueError("--acf is valid only with --family WORDPRESS")

    template["profile_id"] = profile_id
    template["selection"] = {
        "mode": "AUTO_EXISTING" if family == "AUTO_EXISTING" else "EXPLICIT",
        "family": family,
        "variant": variant,
        "selected_by": selected_by,
        "notes": [],
    }
    template["checklist"] = [
        {"id": check_id, "status": "TODO", "evidence": [], "notes": []}
        for check_id in checklist_ids(config, family, variant, acf)
    ]

    if family == "WORDPRESS":
        template["platform"]["wordpress"]["enabled"] = True
        if variant in {"CLASSIC", "BLOCK", "HYBRID"}:
            template["platform"]["wordpress"]["theme_type"] = variant
        if acf:
            template["platform"]["wordpress"]["acf"]["enabled"] = True
            template["delivery_requirements"]["acf"] = {
                "required": True,
                "export_json": {
                    "required": True,
                    "format": "ACF_EXPORT_ARRAY",
                    "target_repo_path": "acf-export.json",
                    "evidence_copy_required": True,
                },
                "local_json": {"required": False, "target_repo_dir": "acf-json"},
                "import_or_sync_smoke_required": True,
                "accepted_methods": ["ADMIN_UI", "WP_CLI_IMPORT", "LOCAL_JSON_SYNC", "WP_CLI_SYNC"],
            }
    elif family == "PHP_TEMPLATE" and variant:
        template["platform"]["php_template"]["engine"] = variant
    elif family == "JS_FRAMEWORK" and variant and variant != "AUTO_EXISTING":
        template["platform"]["js_framework"]["framework"] = variant

    return template


def main() -> int:
    config = load_yaml(TARGETS)
    family_choices = selector_family_ids(config)
    default_family = str(config.get("selector", {}).get("default", "AUTO_EXISTING"))
    if default_family not in family_choices:
        raise ValueError(f"selector default is not a registered implementation family: {default_family}")

    parser = argparse.ArgumentParser(description="Create a DRAFT Implementation Profile from the canonical target selector")
    parser.add_argument("output", type=Path)
    parser.add_argument("--profile-id", required=True)
    parser.add_argument("--family", default=default_family, choices=family_choices)
    parser.add_argument("--variant", default="")
    parser.add_argument("--acf", action="store_true")
    parser.add_argument("--selected-by", default="owner-or-agent")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    output = args.output if args.output.is_absolute() else ROOT / args.output
    profile = build_profile(
        profile_id=args.profile_id,
        family=args.family,
        variant=args.variant,
        acf=args.acf,
        selected_by=args.selected_by,
    )
    atomic_write(output, profile, force=args.force)
    print(f"CREATED {output.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
