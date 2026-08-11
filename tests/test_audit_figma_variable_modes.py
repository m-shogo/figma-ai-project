from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from audit_figma_variable_modes import audit_record  # noqa: E402


COLLECTION_ID = "VariableCollectionId:64:671"
PC_MODE = "3:0"
SP_MODE = "4003:0"


def base_record() -> dict:
    return {
        "schema_version": 1,
        "reference_id": "REF-TEST",
        "same_page_responsive": True,
        "responsive_collection": {
            "id": COLLECTION_ID,
            "name": "template",
            "modes": {
                "desktop": {"id": PC_MODE, "name": "PC"},
                "mobile": {"id": SP_MODE, "name": "SP"},
            },
        },
        "page": {"node_id": "1:1", "explicit_mode_id": SP_MODE},
        "roots": [],
    }


def codes(record: dict) -> list[str]:
    return [item["code"] for item in audit_record(record)]


class FigmaVariableModeAuditTests(unittest.TestCase):
    def test_real_cta_failure_detects_root_and_variable_bound_descendant_mismatch(self) -> None:
        record = base_record()
        record["roots"] = [
            {
                "node_id": "21378:7456",
                "name": "Top@2x",
                "role": "desktop-page",
                "width": 1380,
                "expected_viewport": "desktop",
                "explicit_mode_id": None,
                "resolved_mode_id": SP_MODE,
                "descendants": [
                    {
                        "node_id": "I21378:7867;21035:66",
                        "name": "mask",
                        "width": 375,
                        "bound_to_responsive_collection": True,
                        "resolved_mode_id": SP_MODE,
                    }
                ],
            },
            {
                "node_id": "21376:4401",
                "name": "Top_sp@2x",
                "role": "mobile-page",
                "width": 375,
                "expected_viewport": "mobile",
                "explicit_mode_id": SP_MODE,
                "resolved_mode_id": SP_MODE,
                "descendants": [],
            },
        ]

        result = codes(record)
        self.assertIn("RESPONSIVE_ROOT_MODE_NOT_PINNED", result)
        self.assertIn("ROOT_RESOLVED_MODE_MISMATCH", result)
        self.assertIn("DESCENDANT_MODE_MISMATCH", result)

    def test_fixed_same_page_pc_sp_roots_pass_even_when_page_mode_is_sp(self) -> None:
        record = base_record()
        record["roots"] = [
            {
                "node_id": "21384:8173",
                "name": "Top@2x",
                "role": "desktop-page",
                "width": 1380,
                "expected_viewport": "desktop",
                "explicit_mode_id": PC_MODE,
                "resolved_mode_id": PC_MODE,
                "descendants": [
                    {
                        "node_id": "I21378:7867;21035:66",
                        "name": "mask",
                        "width": 1380,
                        "bound_to_responsive_collection": True,
                        "resolved_mode_id": PC_MODE,
                    }
                ],
            },
            {
                "node_id": "21376:4401",
                "name": "Top_sp@2x",
                "role": "mobile-page",
                "width": 375,
                "expected_viewport": "mobile",
                "explicit_mode_id": SP_MODE,
                "resolved_mode_id": SP_MODE,
                "descendants": [],
            },
        ]

        findings = audit_record(record)
        errors = [item for item in findings if item["severity"] == "ERROR"]
        self.assertEqual(errors, [])
        self.assertIn("PAGE_MODE_SHADOWED_BY_ROOT_PINS", [item["code"] for item in findings])

    def test_width_only_is_warning_and_never_authorizes_automatic_mode_change(self) -> None:
        record = base_record()
        record["same_page_responsive"] = False
        record["roots"] = [
            {
                "node_id": "2:1",
                "name": "Frame 12",
                "width": 1380,
                "explicit_mode_id": SP_MODE,
                "resolved_mode_id": SP_MODE,
                "descendants": [],
            }
        ]

        findings = audit_record(record)
        self.assertEqual([item["code"] for item in findings], ["LOW_CONFIDENCE_VIEWPORT"])
        self.assertEqual([item for item in findings if item["severity"] == "ERROR"], [])

    def test_name_and_geometry_conflict_is_ambiguous(self) -> None:
        record = base_record()
        record["same_page_responsive"] = False
        record["roots"] = [
            {
                "node_id": "3:1",
                "name": "Checkout / Mobile",
                "width": 1440,
                "explicit_mode_id": SP_MODE,
                "resolved_mode_id": SP_MODE,
                "descendants": [],
            }
        ]

        self.assertEqual(codes(record), ["AMBIGUOUS_VIEWPORT"])

    def test_arbitrary_375px_child_is_not_pollution_without_variable_binding(self) -> None:
        record = base_record()
        record["roots"] = [
            {
                "node_id": "4:1",
                "name": "Desktop / Detail",
                "width": 1380,
                "expected_viewport": "desktop",
                "explicit_mode_id": PC_MODE,
                "resolved_mode_id": PC_MODE,
                "descendants": [
                    {
                        "node_id": "4:2",
                        "name": "Article card",
                        "width": 375,
                        "bound_to_responsive_collection": False,
                        "resolved_mode_id": SP_MODE,
                    }
                ],
            },
            {
                "node_id": "4:3",
                "name": "Mobile / Detail",
                "width": 375,
                "expected_viewport": "mobile",
                "explicit_mode_id": SP_MODE,
                "resolved_mode_id": SP_MODE,
                "descendants": [],
            },
        ]

        self.assertNotIn("DESCENDANT_MODE_MISMATCH", codes(record))

    def test_same_page_responsive_roots_must_pin_modes_explicitly(self) -> None:
        record = base_record()
        record["roots"] = [
            {
                "node_id": "5:1",
                "name": "Desktop / Top",
                "width": 1380,
                "expected_viewport": "desktop",
                "explicit_mode_id": None,
                "resolved_mode_id": PC_MODE,
                "descendants": [],
            },
            {
                "node_id": "5:2",
                "name": "Mobile / Top",
                "width": 375,
                "expected_viewport": "mobile",
                "explicit_mode_id": SP_MODE,
                "resolved_mode_id": SP_MODE,
                "descendants": [],
            },
        ]

        self.assertIn("RESPONSIVE_ROOT_MODE_NOT_PINNED", codes(record))


if __name__ == "__main__":
    unittest.main()
