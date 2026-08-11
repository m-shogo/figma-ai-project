from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from plan_figma_variable_mode_remediation import build_remediation_plan  # noqa: E402

PC_MODE = "3:0"
SP_MODE = "4003:0"
COLLECTION_ID = "VariableCollectionId:64:671"


def record_with(root: dict) -> dict:
    return {
        "reference_id": "REF-TEST",
        "same_page_responsive": True,
        "responsive_collection": {
            "id": COLLECTION_ID,
            "modes": {
                "desktop": {"id": PC_MODE, "name": "PC"},
                "mobile": {"id": SP_MODE, "name": "SP"},
            },
        },
        "page": {"node_id": "1:1", "explicit_mode_id": SP_MODE},
        "roots": [root],
    }


class FigmaVariableModeRemediationPlanTests(unittest.TestCase):
    def test_real_pc_failure_produces_safe_root_pin_action(self) -> None:
        plan = build_remediation_plan(record_with({
            "node_id": "21378:7456",
            "name": "Top@2x",
            "role": "desktop-page",
            "expected_viewport": "desktop",
            "width": 1380,
            "explicit_mode_id": None,
            "resolved_mode_id": SP_MODE,
            "descendants": [],
        }))

        self.assertTrue(plan["safe_to_auto_apply"])
        self.assertEqual(len(plan["actions"]), 1)
        action = plan["actions"][0]
        self.assertEqual(action["action"], "SET_EXPLICIT_VARIABLE_MODE")
        self.assertEqual(action["node_id"], "21378:7456")
        self.assertEqual(action["collection_id"], COLLECTION_ID)
        self.assertEqual(action["mode_id"], PC_MODE)
        self.assertIn("RESPONSIVE_ROOT_MODE_NOT_PINNED", action["reason_codes"])
        self.assertIn("ROOT_RESOLVED_MODE_MISMATCH", action["reason_codes"])

    def test_wrong_explicit_mode_with_authoritative_mapping_is_fixable(self) -> None:
        plan = build_remediation_plan(record_with({
            "node_id": "2:1",
            "name": "Top",
            "expected_viewport": "desktop",
            "width": 1380,
            "explicit_mode_id": SP_MODE,
            "resolved_mode_id": SP_MODE,
            "descendants": [],
        }))

        self.assertTrue(plan["safe_to_auto_apply"])
        self.assertEqual(plan["actions"][0]["mode_id"], PC_MODE)
        self.assertIn("ROOT_EXPLICIT_MODE_MISMATCH", plan["actions"][0]["reason_codes"])

    def test_width_only_evidence_never_produces_auto_fix(self) -> None:
        plan = build_remediation_plan(record_with({
            "node_id": "3:1",
            "name": "Frame 123",
            "width": 1380,
            "explicit_mode_id": SP_MODE,
            "resolved_mode_id": SP_MODE,
            "descendants": [],
        }))

        self.assertFalse(plan["safe_to_auto_apply"])
        self.assertEqual(plan["actions"], [])

    def test_conflicting_name_and_geometry_never_produces_auto_fix(self) -> None:
        plan = build_remediation_plan(record_with({
            "node_id": "4:1",
            "name": "Checkout Mobile",
            "width": 1380,
            "explicit_mode_id": SP_MODE,
            "resolved_mode_id": SP_MODE,
            "descendants": [],
        }))

        self.assertFalse(plan["safe_to_auto_apply"])
        self.assertEqual(plan["actions"], [])

    def test_already_correct_root_produces_no_action(self) -> None:
        plan = build_remediation_plan(record_with({
            "node_id": "5:1",
            "name": "Top@2x",
            "expected_viewport": "desktop",
            "width": 1380,
            "explicit_mode_id": PC_MODE,
            "resolved_mode_id": PC_MODE,
            "descendants": [],
        }))

        self.assertFalse(plan["safe_to_auto_apply"])
        self.assertEqual(plan["actions"], [])
        self.assertEqual(plan["audit_summary"]["errors"], 0)

    def test_descendant_only_mismatch_requires_inspection_not_blind_root_rewrite(self) -> None:
        plan = build_remediation_plan(record_with({
            "node_id": "6:1",
            "name": "Top@2x",
            "expected_viewport": "desktop",
            "width": 1380,
            "explicit_mode_id": PC_MODE,
            "resolved_mode_id": PC_MODE,
            "descendants": [
                {
                    "node_id": "6:2",
                    "name": "mask",
                    "width": 375,
                    "bound_to_responsive_collection": True,
                    "resolved_mode_id": SP_MODE,
                }
            ],
        }))

        self.assertFalse(plan["safe_to_auto_apply"])
        self.assertEqual(plan["actions"], [])
        self.assertEqual(plan["blocked"][0]["reason"], "DESCENDANT_OVERRIDE_OR_NESTED_MODE_REQUIRES_INSPECTION")


if __name__ == "__main__":
    unittest.main()
