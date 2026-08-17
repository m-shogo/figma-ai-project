#!/usr/bin/env python3
from __future__ import annotations

import copy
import unittest

import intake
import profile_ops
import risk_registry


class SystemicTests(unittest.TestCase):
    def profile(self):
        return intake.load_json(intake.ROOT / "profile.example.json")

    def test_form_without_backend_is_blocking(self):
        result = risk_registry.scan(self.profile(), {"forms": {"present": True}})
        self.assertIn("form-backend-undetermined", result["blocking"])

    def test_tracking_without_privacy_contract_is_blocking(self):
        result = risk_registry.scan(self.profile(), {"analytics": {"tracking": True}})
        self.assertIn("tracking-privacy-undetermined", result["blocking"])

    def test_figma_reference_revision_is_reviewed(self):
        result = risk_registry.scan(self.profile(), {})
        self.assertIn("figma-reference-not-pinned", result["review"])

    def test_sensitive_keys_are_redacted(self):
        clean, findings = profile_ops.redact({"answers": {}, "licenseKey": "secret-value", "nested": {"api_token": "x"}})
        self.assertEqual(clean["licenseKey"], "<redacted>")
        self.assertIn("licenseKey", findings)
        self.assertIn("nested.api_token", findings)

    def test_three_way_merge_accepts_independent_changes(self):
        base = self.profile(); left = copy.deepcopy(base); right = copy.deepcopy(base)
        left["answers"]["responsive.intermediate"]["value"] = "project-breakpoint-contract"
        right["answers"]["interaction.slider"]["value"] = "no-slider"
        result = profile_ops.merge_profiles(base, left, right)
        self.assertTrue(result["pass"])
        self.assertEqual(result["merged"]["answers"]["responsive.intermediate"]["value"], "project-breakpoint-contract")
        self.assertEqual(result["merged"]["answers"]["interaction.slider"]["value"], "no-slider")

    def test_three_way_merge_refuses_same_decision_conflict(self):
        base = self.profile(); left = copy.deepcopy(base); right = copy.deepcopy(base)
        left["answers"]["responsive.intermediate"]["value"] = "project-breakpoint-contract"
        right["answers"]["responsive.intermediate"]["value"] = "explicit-design-needed"
        result = profile_ops.merge_profiles(base, left, right)
        self.assertFalse(result["pass"])
        self.assertEqual(result["conflicts"][0]["path"], "answers.responsive.intermediate")

    def test_unknown_schema_version_requires_migration(self):
        profile = self.profile(); profile["version"] = 999
        self.assertFalse(profile_ops.compatibility(profile)["supported"])


if __name__ == "__main__":
    unittest.main()
