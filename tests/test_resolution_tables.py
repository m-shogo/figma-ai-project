from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from validate_resolution_tables import validate_contract  # noqa: E402


def base_contract() -> dict:
    return {
        "status": "FROZEN",
        "freeze": {"ready": True},
        "figma_profile": {
            "components": {"level": "PARTIAL"},
            "variables": {"level": "PARTIAL"},
            "code_connect": {"level": "PARTIAL"},
        },
        "component_resolution": [
            {
                "id": "button",
                "figma_component": "Button",
                "figma_node_id": "1:2",
                "resolution": "REUSE_CODE_CONNECT",
                "code_path": "src/components/Button",
                "prop_mapping": {},
                "consumers": ["S01", "S02"],
                "evidence": ["verified Code Connect mapping"],
                "notes": [],
            }
        ],
        "token_resolution": [
            {
                "id": "text-primary",
                "figma_variable": "Text/Primary",
                "figma_collection": "Semantic",
                "resolution": "MAP_VARIABLE_TO_EXISTING",
                "code_token": "--color-text-primary",
                "mode_mapping": {},
                "consumers": ["S01", "S02"],
                "evidence": ["semantic role matches target token"],
                "notes": [],
            }
        ],
    }


def validate(data: dict) -> list[str]:
    with tempfile.NamedTemporaryFile("w", suffix=".yaml", encoding="utf-8", delete=False) as handle:
        yaml.safe_dump(data, handle, sort_keys=False, allow_unicode=True)
        path = Path(handle.name)
    try:
        return validate_contract(path)
    finally:
        path.unlink(missing_ok=True)


class ResolutionTableTests(unittest.TestCase):
    def test_valid_frozen_resolution_tables_pass(self) -> None:
        self.assertEqual(validate(base_contract()), [])

    def test_observed_components_require_resolution_when_frozen(self) -> None:
        data = base_contract()
        data["component_resolution"] = []
        errors = validate(data)
        self.assertTrue(any("requires component_resolution" in error for error in errors), errors)

    def test_none_components_reject_fake_figma_mapping(self) -> None:
        data = base_contract()
        data["figma_profile"]["components"]["level"] = "NONE"
        errors = validate(data)
        self.assertTrue(any("requires empty component_resolution" in error for error in errors), errors)

    def test_unresolved_component_rejected_when_frozen(self) -> None:
        data = base_contract()
        data["component_resolution"][0]["resolution"] = "UNRESOLVED"
        errors = validate(data)
        self.assertTrue(any("cannot remain UNRESOLVED" in error for error in errors), errors)

    def test_code_connect_resolution_requires_observed_mapping_capability(self) -> None:
        data = base_contract()
        data["figma_profile"]["code_connect"]["level"] = "NONE"
        errors = validate(data)
        self.assertTrue(any("REUSE_CODE_CONNECT" in error for error in errors), errors)

    def test_observed_variables_require_token_resolution_when_frozen(self) -> None:
        data = base_contract()
        data["token_resolution"] = []
        errors = validate(data)
        self.assertTrue(any("requires token_resolution" in error for error in errors), errors)

    def test_mode_mapping_resolution_requires_mapping(self) -> None:
        data = base_contract()
        entry = data["token_resolution"][0]
        entry["resolution"] = "PRESERVE_MODE_MAPPING"
        entry["mode_mapping"] = {}
        errors = validate(data)
        self.assertTrue(any("requires mode_mapping" in error for error in errors), errors)

    def test_draft_can_keep_resolution_unresolved(self) -> None:
        data = base_contract()
        data["status"] = "DRAFT"
        data["freeze"] = {"ready": False}
        data["component_resolution"][0]["resolution"] = "UNRESOLVED"
        data["component_resolution"][0]["code_path"] = ""
        data["component_resolution"][0]["evidence"] = []
        data["token_resolution"][0]["resolution"] = "UNRESOLVED"
        data["token_resolution"][0]["code_token"] = ""
        data["token_resolution"][0]["evidence"] = []
        self.assertEqual(validate(data), [])


if __name__ == "__main__":
    unittest.main()
