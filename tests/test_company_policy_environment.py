from __future__ import annotations

import copy
import unittest
from pathlib import Path

import yaml

from scripts.validate_company_policy import schema_errors, semantic_policy_errors

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "templates" / "company-policy.yaml"


def load_template() -> dict:
    return yaml.safe_load(TEMPLATE.read_text(encoding="utf-8"))


def required_profile(profile_id: str = "ios-safari") -> dict:
    return {
        "id": profile_id,
        "role": "REQUIRED",
        "device_class": "MOBILE",
        "os": "iOS",
        "os_version": "",
        "browser": "Safari",
        "browser_version": "",
        "engine": "WebKit",
        "webview": False,
        "viewport": {
            "width_css_px": 390,
            "height_css_px": 844,
            "orientation": "BOTH",
            "dpr": 3,
        },
        "input": {
            "primary_hover": "NONE",
            "any_hover": "NONE",
            "primary_pointer": "COARSE",
            "any_pointer": "COARSE",
            "touch": True,
        },
        "environment": {
            "safe_area": "REQUIRED",
            "dynamic_viewport": "REQUIRED",
            "virtual_keyboard": "TEST",
            "color_gamut": "P3",
            "forced_colors": "NOT_REQUIRED",
        },
        "qa": {
            "real_device": "PREFERRED",
            "emulation": "SUPPLEMENTARY",
            "visual": True,
            "interaction": True,
            "keyboard": False,
        },
        "overrides": {
            "reset_profile": "BASE_PLUS_ENVIRONMENT",
            "smooth_scroll": "INHERIT",
            "hover_profile": "TOUCH_FIRST",
            "touch_profile": "BROWSER_NATIVE",
            "viewport_profile": "DYNAMIC_SAFE_AREA",
            "scroll_lock_profile": "MOBILE_OVERLAY",
            "animation_profile": "INHERIT",
            "image_profile": "INHERIT",
        },
        "notes": [],
    }


def active_policy() -> dict:
    policy = load_template()
    policy["status"] = "ACTIVE"
    policy["company"] = "Example"
    policy["project_scope"] = "web"
    policy["browser_support"]["browserslist"] = ["defaults"]
    policy["browser_support"]["environment_profiles"] = [required_profile()]
    policy["visual_tolerance"]["canonical_environment_profile"] = "ios-safari"
    return policy


class CompanyEnvironmentPolicyTests(unittest.TestCase):
    def test_draft_template_is_valid(self) -> None:
        policy = load_template()
        self.assertEqual([], schema_errors(policy))
        self.assertEqual([], semantic_policy_errors(policy))

    def test_active_policy_requires_required_environment(self) -> None:
        policy = active_policy()
        policy["browser_support"]["environment_profiles"] = []
        policy["visual_tolerance"]["canonical_environment_profile"] = ""
        errors = semantic_policy_errors(policy)
        self.assertTrue(any("at least one REQUIRED environment profile" in error for error in errors))

    def test_active_policy_with_required_environment_passes(self) -> None:
        policy = active_policy()
        self.assertEqual([], schema_errors(policy))
        self.assertEqual([], semantic_policy_errors(policy))

    def test_duplicate_environment_ids_are_rejected(self) -> None:
        policy = active_policy()
        policy["browser_support"]["environment_profiles"].append(copy.deepcopy(required_profile()))
        errors = semantic_policy_errors(policy)
        self.assertTrue(any("ids must be unique" in error for error in errors))

    def test_width_only_runtime_classification_is_rejected(self) -> None:
        policy = active_policy()
        policy["browser_support"]["runtime_detection"]["width_only_device_classification_forbidden"] = False
        errors = semantic_policy_errors(policy)
        self.assertTrue(any("width-only device classification" in error for error in errors))

    def test_hover_must_use_capability_queries(self) -> None:
        policy = active_policy()
        policy["responsive"]["input_capability_queries"]["hover_pointer_required"] = False
        errors = semantic_policy_errors(policy)
        self.assertTrue(any("hover/pointer capability queries" in error for error in errors))

    def test_cover_requires_safe_area_policy(self) -> None:
        policy = active_policy()
        policy["responsive"]["viewport_meta"]["viewport_fit"] = "COVER"
        policy["responsive"]["safe_area"]["policy"] = "NONE"
        errors = semantic_policy_errors(policy)
        self.assertTrue(any("safe-area policy" in error for error in errors))

    def test_smooth_scroll_must_respect_reduced_motion(self) -> None:
        policy = active_policy()
        policy["interaction"]["smooth_scroll"]["respect_reduced_motion"] = False
        errors = semantic_policy_errors(policy)
        self.assertTrue(any("prefers-reduced-motion" in error for error in errors))

    def test_unconditional_focus_style_removal_is_rejected(self) -> None:
        policy = active_policy()
        policy["css"]["foundation_layers"]["focus_styles_may_be_removed"] = True
        errors = semantic_policy_errors(policy)
        self.assertTrue(any("focus styles" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
