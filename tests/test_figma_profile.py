from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from validate_figma_profile import validate_contract  # noqa: E402


def base_contract() -> dict:
    return {
        "schema_version": 3,
        "contract_id": "CONTRACT-1",
        "reference_id": "REF-1",
        "status": "FROZEN",
        "figma_profile": {
            "captured_at": "2026-08-10T19:00:00+09:00",
            "source_nodes": ["1:2", "1:3"],
            "components": {"level": "PARTIAL", "evidence": ["component inventory"]},
            "variables": {
                "level": "SYSTEMATIC",
                "modes_observed": ["Default"],
                "aliases_observed": True,
                "evidence": ["variable inventory"],
            },
            "auto_layout": {
                "coverage": "HIGH",
                "generation": "UPDATED_2026",
                "grid_observed": True,
                "evidence": ["layout metadata"],
            },
            "semantic_naming": {"quality": "HIGH", "evidence": ["top-level names"]},
            "code_connect": {
                "level": "PARTIAL",
                "mapped_components": ["Button"],
                "evidence": ["Code Connect mapping"],
            },
            "annotations": {"level": "PARTIAL", "evidence": ["annotation inventory"]},
            "assets": {"level": "STRONG", "evidence": ["asset inventory"]},
            "strategy_decisions": ["Reuse mapped Button and preserve variable aliases"],
        },
        "freeze": {"ready": True},
    }


def validate(data: dict) -> list[str]:
    with tempfile.NamedTemporaryFile("w", suffix=".yaml", encoding="utf-8", delete=False) as handle:
        yaml.safe_dump(data, handle, sort_keys=False, allow_unicode=True)
        path = Path(handle.name)
    try:
        return validate_contract(path)
    finally:
        path.unlink(missing_ok=True)


class FigmaProfileTests(unittest.TestCase):
    def test_complete_frozen_profile_passes(self) -> None:
        self.assertEqual(validate(base_contract()), [])

    def test_unknown_is_rejected_when_frozen(self) -> None:
        data = base_contract()
        data["figma_profile"]["variables"]["level"] = "UNKNOWN"
        errors = validate(data)
        self.assertTrue(any("variables.level=UNKNOWN" in error for error in errors), errors)

    def test_none_is_distinct_from_unknown(self) -> None:
        data = base_contract()
        data["figma_profile"]["code_connect"] = {
            "level": "NONE",
            "mapped_components": [],
            "evidence": [],
        }
        self.assertEqual(validate(data), [])

    def test_observed_code_connect_requires_mapped_components(self) -> None:
        data = base_contract()
        data["figma_profile"]["code_connect"]["mapped_components"] = []
        errors = validate(data)
        self.assertTrue(any("requires mapped_components" in error for error in errors), errors)

    def test_auto_layout_none_requires_generation_none(self) -> None:
        data = base_contract()
        data["figma_profile"]["auto_layout"]["coverage"] = "NONE"
        data["figma_profile"]["auto_layout"]["generation"] = "UPDATED_2026"
        errors = validate(data)
        self.assertTrue(any("generation must be NONE" in error for error in errors), errors)

    def test_strategy_decision_required_for_frozen_contract(self) -> None:
        data = base_contract()
        data["figma_profile"]["strategy_decisions"] = []
        errors = validate(data)
        self.assertTrue(any("strategy_decisions" in error for error in errors), errors)

    def test_draft_can_keep_unknowns(self) -> None:
        data = base_contract()
        data["status"] = "DRAFT"
        data["freeze"] = {"ready": False}
        for key in ("components", "variables", "code_connect", "annotations", "assets"):
            data["figma_profile"][key]["level"] = "UNKNOWN"
        data["figma_profile"]["auto_layout"]["coverage"] = "UNKNOWN"
        data["figma_profile"]["auto_layout"]["generation"] = "UNKNOWN"
        data["figma_profile"]["semantic_naming"]["quality"] = "UNKNOWN"
        data["figma_profile"]["captured_at"] = ""
        data["figma_profile"]["source_nodes"] = []
        data["figma_profile"]["strategy_decisions"] = []
        self.assertEqual(validate(data), [])


if __name__ == "__main__":
    unittest.main()
