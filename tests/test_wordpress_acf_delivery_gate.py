from __future__ import annotations

import unittest

from scripts.validate_wordpress_acf_delivery import (
    REQUIRED_ARTIFACT_CLASSES,
    REQUIRED_FRESH_STEPS,
    SCHEMA_PATH,
    completed_run_delivery_errors,
    load_json,
    profile_delivery_errors,
)


class WordPressAcfDeliveryGateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.schema = load_json(SCHEMA_PATH)

    def profile(self) -> dict:
        return {
            "schema_version": 6,
            "status": "FROZEN",
            "effective": {"family": "WORDPRESS"},
            "platform": {"wordpress": {"acf": {"enabled": True}}},
            "delivery_requirements": {
                "source_code_required": True,
                "package": {
                    "required": True,
                    "artifact_classes": sorted(REQUIRED_ARTIFACT_CLASSES),
                    "install_doc": {"required": True, "target_repo_path": "docs/INSTALL.md"},
                    "acf_field_map": {"required": True, "target_repo_path": "docs/ACF-FIELD-MAP.md"},
                    "exclude_acf_pro_plugin": True,
                    "exclude_license_secret": True,
                    "exclude_database": True,
                },
                "acf": {
                    "required": True,
                    "export_json": {"required": True},
                    "import_or_sync_smoke_required": True,
                    "accepted_methods": ["WP_CLI_IMPORT"],
                    "admin_e2e_required": True,
                },
                "fresh_install": {
                    "required": True,
                    "database_copy_allowed": False,
                    "source_acf_db_state_reuse_allowed": False,
                    "browser_driver": "PLAYWRIGHT",
                    "required_steps": sorted(REQUIRED_FRESH_STEPS),
                },
            },
        }

    def test_profile_gate_accepts_complete_v6_contract(self) -> None:
        self.assertEqual([], profile_delivery_errors(self.profile(), self.schema))

    def test_profile_gate_rejects_db_reuse_and_missing_step(self) -> None:
        profile = self.profile()
        fresh = profile["delivery_requirements"]["fresh_install"]
        fresh["database_copy_allowed"] = True
        fresh["required_steps"].remove("ACF_JSON_IMPORT")
        errors = profile_delivery_errors(profile, self.schema)
        self.assertTrue(any("False was expected" in error for error in errors))
        self.assertTrue(any("ACF_JSON_IMPORT" in error for error in errors))

    def test_legacy_profile_is_grandfathered_as_evidence(self) -> None:
        profile = self.profile()
        profile["schema_version"] = 5
        profile["delivery_requirements"] = {}
        self.assertEqual([], profile_delivery_errors(profile, self.schema))

    def test_complete_run_requires_admin_and_fresh_reconstruction_evidence(self) -> None:
        run = {"status": "COMPLETE", "deliverables": {}}
        errors = completed_run_delivery_errors(run, self.profile(), self.schema)
        self.assertTrue(errors)

    def test_complete_run_accepts_explicit_no_db_reuse_evidence(self) -> None:
        run = {
            "status": "COMPLETE",
            "deliverables": {
                "package": {
                    "required": True,
                    "artifacts": {
                        "theme_code": "templates",
                        "assets": "references",
                        "install_doc": "README.md",
                        "acf_field_map": "docs/wordpress-acf-policy.md",
                    },
                    "excluded": {
                        "acf_pro_plugin": True,
                        "license_secret": True,
                        "database": True,
                    },
                },
                "acf": {
                    "admin_e2e": {
                        "required": True,
                        "status": "PASS",
                        "evidence": ["browser edit/save/reload/frontend roundtrip"],
                    }
                },
                "fresh_install": {
                    "required": True,
                    "status": "PASS",
                    "source_database_copied": False,
                    "source_acf_db_state_reused": False,
                    "steps": {step: "PASS" for step in REQUIRED_FRESH_STEPS},
                    "evidence": ["fresh WordPress project rebuilt from delivery artifacts"],
                },
            },
        }
        self.assertEqual([], completed_run_delivery_errors(run, self.profile(), self.schema))


if __name__ == "__main__":
    unittest.main()
