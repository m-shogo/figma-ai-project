from __future__ import annotations

import copy
import json
import unittest
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schemas" / "run.schema.json"
TEMPLATE_PATH = ROOT / "templates" / "run-record.yaml"


class RunSchemaRuntimeContractTest(unittest.TestCase):
    def setUp(self) -> None:
        self.schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
        self.template = yaml.safe_load(TEMPLATE_PATH.read_text(encoding="utf-8"))
        self.validator = Draft202012Validator(self.schema)

    def errors_after(self, mutate) -> list[str]:
        data = copy.deepcopy(self.template)
        mutate(data)
        return [error.message for error in self.validator.iter_errors(data)]

    def test_current_template_is_schema_valid(self) -> None:
        self.assertEqual([], list(self.validator.iter_errors(self.template)))

    def test_product_viewport_source_is_environment_contract(self) -> None:
        errors = self.errors_after(
            lambda data: data["runtime_contract"].__setitem__(
                "product_viewport_source", "FIXED_GLOBAL_DEFAULT"
            )
        )
        self.assertTrue(any("EFFECTIVE_ENVIRONMENT_CONTRACT" in error for error in errors))

    def test_resolved_product_minimum_can_be_null(self) -> None:
        self.assertIsNone(self.template["runtime_contract"]["product_min_viewport_css_px"])
        self.assertEqual([], list(self.validator.iter_errors(self.template)))

    def test_unresolved_viewport_fallback_stays_candidate(self) -> None:
        errors = self.errors_after(
            lambda data: data["runtime_contract"].__setitem__(
                "unresolved_product_viewport_fallback_status", "ACTIVE"
            )
        )
        self.assertTrue(any("CANDIDATE" in error for error in errors))

    def test_accessibility_reflow_probe_stays_320(self) -> None:
        errors = self.errors_after(
            lambda data: data["runtime_contract"].__setitem__(
                "accessibility_reflow_probe_css_px", 360
            )
        )
        self.assertTrue(any("320" in error for error in errors))

    def test_knowledge_context_mode_is_validated(self) -> None:
        errors = self.errors_after(
            lambda data: data["knowledge_context"].__setitem__("mode", "EVERYTHING")
        )
        self.assertTrue(any("PRODUCTION_APPLICABLE" in error for error in errors))

    def test_optional_capabilities_reject_unknown_values(self) -> None:
        errors = self.errors_after(
            lambda data: data["runtime_contract"].__setitem__(
                "optional_capabilities", ["UNKNOWN_CAPABILITY"]
            )
        )
        self.assertTrue(any("UNKNOWN_CAPABILITY" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
