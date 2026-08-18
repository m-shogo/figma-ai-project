from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import validate_acf_export as validator  # noqa: E402


def valid_export() -> list[dict]:
    return [
        {
            "key": "group_hero123",
            "title": "Hero",
            "fields": [
                {
                    "key": "field_heading123",
                    "label": "Heading",
                    "name": "heading",
                    "type": "text",
                },
                {
                    "key": "field_cards123",
                    "label": "Cards",
                    "name": "cards",
                    "type": "repeater",
                    "sub_fields": [
                        {
                            "key": "field_card_title123",
                            "label": "Card title",
                            "name": "title",
                            "type": "text",
                        }
                    ],
                },
            ],
            "location": [[{"param": "page_template", "operator": "==", "value": "page-demo.php"}]],
            "active": True,
        }
    ]


class AcfExportValidationTests(unittest.TestCase):
    def test_valid_export_array_passes(self) -> None:
        self.assertEqual([], validator.validate_export(valid_export()))

    def test_duplicate_field_keys_are_rejected(self) -> None:
        data = valid_export()
        data[0]["fields"].append(
            {
                "key": "field_heading123",
                "label": "Duplicate",
                "name": "duplicate",
                "type": "text",
            }
        )
        errors = validator.validate_export(data)
        self.assertTrue(any("duplicate ACF field key" in error for error in errors))

    def test_missing_location_is_rejected(self) -> None:
        data = valid_export()
        data[0]["location"] = []
        errors = validator.validate_export(data)
        self.assertTrue(any("location" in error for error in errors))

    def test_delivery_contract_requires_array_not_single_object(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory).resolve() / "acf-export.json"
            path.write_text(json.dumps(valid_export()[0]), encoding="utf-8")
            errors = validator.validate_path(path)
            self.assertTrue(any("top-level JSON array" in error for error in errors))

    def test_candidate_paths_discovers_canonical_exports(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            canonical = root / "experiments" / "exp-1" / "artifacts" / "acf-export.json"
            canonical.parent.mkdir(parents=True)
            canonical.write_text(json.dumps(valid_export()), encoding="utf-8")
            unrelated = root / "experiments" / "exp-1" / "artifacts" / "capture.json"
            unrelated.write_text("{}", encoding="utf-8")

            with patch.object(validator, "ROOT", root):
                self.assertEqual([canonical], validator.candidate_paths())

    def test_candidate_paths_supports_named_acf_export_evidence(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            named = root / "references" / "ref-1" / "first-pass.acf-export.json"
            named.parent.mkdir(parents=True)
            named.write_text(json.dumps(valid_export()), encoding="utf-8")

            with patch.object(validator, "ROOT", root):
                self.assertEqual([named], validator.candidate_paths())


if __name__ == "__main__":
    unittest.main()
