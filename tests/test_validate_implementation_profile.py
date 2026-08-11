from __future__ import annotations

import copy
import sys
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import validate_implementation_profile as validator  # noqa: E402

CONFIG = yaml.safe_load((ROOT / "config" / "implementation-targets.yaml").read_text(encoding="utf-8"))


def base_profile(family: str, variant: str = "") -> dict:
    profile = {
        "schema_version": 1,
        "profile_id": "IMPL-1",
        "status": "FROZEN",
        "selection": {"mode": "AUTO_EXISTING", "family": "AUTO_EXISTING", "variant": "", "selected_by": "test", "notes": []},
        "repository": {
            "repository": "m-shogo/example",
            "starting_commit": "abc123",
            "target_route_or_template": "/demo",
            "inspected": True,
            "evidence_paths": ["package.json"],
        },
        "resolution": {
            "detected_family": family,
            "detected_variant": variant,
            "confidence": "HIGH",
            "evidence": ["repo evidence"],
            "conflicts": [],
            "conflict_resolution": "MATCHED",
        },
        "effective": {
            "family": family,
            "variant": variant,
            "language_runtime": "resolved runtime",
            "package_manager": "resolved",
            "build_tool": "resolved",
            "styling_architecture": "existing",
            "component_system": "existing",
            "routing": "resolved",
            "data_source": "resolved",
            "image_pipeline": "resolved",
            "form_handling": "resolved",
            "i18n": "resolved",
            "test_harness": "resolved",
            "rendering_mode": "resolved",
            "notes": [],
        },
        "platform": {
            "static_web": {},
            "php_template": {},
            "wordpress": {"enabled": False, "acf": {"enabled": False}},
            "js_framework": {},
        },
        "delivery_requirements": {
            "source_code_required": True,
            "acf": {
                "required": False,
                "export_json": {"required": False, "format": "ACF_EXPORT_ARRAY", "target_repo_path": "", "evidence_copy_required": True},
                "local_json": {"required": False, "target_repo_dir": ""},
                "import_or_sync_smoke_required": False,
                "accepted_methods": [],
            },
        },
        "checklist": [],
        "unknowns": [],
        "conflicts": [],
        "freeze": {"ready": True, "frozen_at": "2026-08-11T09:00:00+09:00", "notes": []},
    }
    return profile


def complete_checklist(profile: dict) -> None:
    profile["checklist"] = [
        {"id": check_id, "status": "PASS", "evidence": ["test"], "notes": []}
        for check_id in validator.required_check_ids(profile, CONFIG)
    ]


def valid_static() -> dict:
    profile = base_profile("STATIC_WEB")
    profile["platform"]["static_web"] = {
        "html_strategy": "SEMANTIC_HTML",
        "script_strategy": "VANILLA_JS",
        "partial_strategy": "NONE",
        "output_contract": "static output",
    }
    complete_checklist(profile)
    return profile


def valid_wordpress_acf() -> dict:
    profile = base_profile("WORDPRESS", "CLASSIC")
    profile["platform"]["wordpress"] = {
        "enabled": True,
        "wordpress_version": "current project",
        "php_version": "8.x",
        "theme_type": "CLASSIC",
        "template_unit": "TEMPLATE_PART",
        "editor_model": "classic editor + ACF",
        "asset_enqueue": "wp_enqueue_*",
        "image_helpers": "wp_get_attachment_image",
        "theme_json": "not used",
        "block_json": "not used",
        "cpt_taxonomy": "existing only",
        "acf": {
            "enabled": True,
            "version": "6.x",
            "pro": True,
            "architecture": "TEMPLATE_FIELDS",
            "field_group_ownership": "theme",
            "image_return_format": "ID",
            "local_json_policy": "REQUIRED",
            "local_json_dir": "acf-json",
            "stable_keys_required": True,
            "notes": [],
        },
    }
    profile["delivery_requirements"]["acf"] = {
        "required": True,
        "export_json": {
            "required": True,
            "format": "ACF_EXPORT_ARRAY",
            "target_repo_path": "acf-export.json",
            "evidence_copy_required": True,
        },
        "local_json": {"required": True, "target_repo_dir": "acf-json"},
        "import_or_sync_smoke_required": True,
        "accepted_methods": ["ADMIN_UI", "WP_CLI_IMPORT", "LOCAL_JSON_SYNC"],
    }
    complete_checklist(profile)
    return profile


class ImplementationProfileTests(unittest.TestCase):
    def test_static_profile_can_freeze_when_all_checks_pass(self) -> None:
        self.assertEqual([], validator.semantic_errors(valid_static(), CONFIG))

    def test_missing_required_check_blocks_freeze(self) -> None:
        profile = valid_static()
        profile["checklist"] = profile["checklist"][1:]
        errors = validator.semantic_errors(profile, CONFIG)
        self.assertTrue(any("missing required implementation checklist" in error for error in errors))

    def test_explicit_target_mismatch_requires_resolution(self) -> None:
        profile = valid_static()
        profile["selection"]["mode"] = "EXPLICIT"
        profile["selection"]["family"] = "WORDPRESS"
        profile["resolution"]["conflict_resolution"] = "MATCHED"
        errors = validator.semantic_errors(profile, CONFIG)
        self.assertTrue(any("explicit selected family differs" in error for error in errors))

    def test_wordpress_acf_requires_importable_json_delivery(self) -> None:
        profile = valid_wordpress_acf()
        broken = copy.deepcopy(profile)
        broken["delivery_requirements"]["acf"]["export_json"]["required"] = False
        errors = validator.semantic_errors(broken, CONFIG)
        self.assertTrue(any("importable ACF export JSON" in error for error in errors))

    def test_wordpress_acf_profile_passes_with_json_and_smoke_contract(self) -> None:
        self.assertEqual([], validator.semantic_errors(valid_wordpress_acf(), CONFIG))


if __name__ == "__main__":
    unittest.main()
