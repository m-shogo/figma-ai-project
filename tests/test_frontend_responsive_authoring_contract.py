from __future__ import annotations

import copy
import unittest
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[1]
POLICY_PATH = ROOT / "config" / "frontend-implementation-policy.yaml"


class FrontendResponsiveAuthoringContractTest(unittest.TestCase):
    def setUp(self) -> None:
        self.policy = yaml.safe_load(POLICY_PATH.read_text(encoding="utf-8"))

    def test_current_contract_is_mobile_first(self) -> None:
        responsive = self.policy["responsive"]
        self.assertEqual("MOBILE_FIRST", responsive["authoring_default"])
        self.assertIs(True, responsive["base_declarations_target_smallest_supported_layout"])
        self.assertIs(True, responsive["larger_layout_overrides_use_min_width_by_default"])

    def test_media_queries_stay_with_their_owner_by_default(self) -> None:
        responsive = self.policy["responsive"]
        nesting = self.policy["nesting"]
        self.assertIs(True, responsive["media_queries_colocated_with_owner_by_default"])
        self.assertIs(False, responsive["breakpoint_bucket_stylesheets_by_default"])
        self.assertIs(True, nesting["contextual_at_rules_colocated_with_owner_by_default"])
        self.assertIs(False, nesting["separate_breakpoint_buckets_by_default"])

    def test_mobile_first_authoring_is_not_a_fixed_breakpoint_value(self) -> None:
        responsive = self.policy["responsive"]
        self.assertEqual("EFFECTIVE_ENVIRONMENT_CONTRACT", responsive["product_viewport_source"])
        self.assertEqual("CANDIDATE", responsive["unresolved_product_viewport_fallback_status"])

    def test_authoring_stack_support_is_explicit(self) -> None:
        nesting = self.policy["nesting"]
        self.assertIs(True, nesting["owner_colocation_requires_supported_authoring_stack"])

    def test_company_or_explicit_project_rule_can_override_when_required(self) -> None:
        responsive = self.policy["responsive"]
        self.assertIs(True, responsive["company_or_explicit_project_authoring_rule_can_override"])


if __name__ == "__main__":
    unittest.main()
