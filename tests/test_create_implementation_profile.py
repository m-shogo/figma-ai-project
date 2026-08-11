from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from create_implementation_profile import build_profile, load_yaml, selector_family_ids, TARGETS  # noqa: E402


class CreateImplementationProfileTests(unittest.TestCase):
    def test_selector_families_come_from_canonical_registry(self) -> None:
        config = load_yaml(TARGETS)
        expected = [item["id"] for item in config["selector"]["options"]]
        self.assertEqual(selector_family_ids(config), expected)
        self.assertIn(config["selector"]["default"], expected)

    def test_duplicate_selector_ids_are_rejected(self) -> None:
        with self.assertRaisesRegex(ValueError, "duplicate selector ids"):
            selector_family_ids(
                {
                    "selector": {
                        "options": [
                            {"id": "STATIC_WEB"},
                            {"id": "STATIC_WEB"},
                        ]
                    }
                }
            )

    def test_wordpress_acf_selection_preloads_delivery_contract(self) -> None:
        profile = build_profile(
            profile_id="IMPL-WP",
            family="WORDPRESS",
            variant="CLASSIC",
            acf=True,
            selected_by="test",
        )
        self.assertTrue(profile["platform"]["wordpress"]["acf"]["enabled"])
        self.assertTrue(profile["delivery_requirements"]["acf"]["export_json"]["required"])
        self.assertEqual(profile["delivery_requirements"]["acf"]["export_json"]["target_repo_path"], "acf-export.json")
        checklist = {row["id"] for row in profile["checklist"]}
        self.assertIn("ACF_EXPORT_JSON_REQUIREMENT", checklist)
        self.assertIn("WORDPRESS_THEME_TYPE", checklist)

    def test_next_selection_only_gets_relevant_variant_checks(self) -> None:
        profile = build_profile(
            profile_id="IMPL-NEXT",
            family="JS_FRAMEWORK",
            variant="NEXT",
            acf=False,
            selected_by="test",
        )
        checklist = {row["id"] for row in profile["checklist"]}
        self.assertIn("FRAMEWORK_AND_VERSION", checklist)
        self.assertIn("NEXT_SERVER_CLIENT_COMPONENTS", checklist)
        self.assertNotIn("ACF_EXPORT_JSON_REQUIREMENT", checklist)

    def test_acf_flag_is_rejected_outside_wordpress(self) -> None:
        with self.assertRaisesRegex(ValueError, "only with --family WORDPRESS"):
            build_profile(
                profile_id="IMPL-BAD",
                family="STATIC_WEB",
                variant="",
                acf=True,
                selected_by="test",
            )


if __name__ == "__main__":
    unittest.main()
