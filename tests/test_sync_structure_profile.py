from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from sync_structure_profile import sync  # noqa: E402


def manifest(nodes: tuple[str, str] = ("pc:1", "sp:1")) -> dict:
    return {
        "reference_id": "REF-1",
        "sections": [
            {
                "section_id": "S01",
                "figma": {
                    "pc_node_id": nodes[0],
                    "sp_node_id": nodes[1],
                    "other_node_ids": [],
                },
            }
        ],
    }


def empty_profile() -> dict:
    return {"reference_id": "REF-1", "sections": []}


class SyncStructureProfileTests(unittest.TestCase):
    def test_adds_unknown_skeleton_without_inventing_evidence(self) -> None:
        profile, changes = sync(manifest(), empty_profile())
        self.assertEqual(changes, ["ADD S01"])
        section = profile["sections"][0]
        self.assertEqual(section["figma_node_ids"], ["pc:1", "sp:1"])
        self.assertEqual(section["recommended_translation_mode"], "UNKNOWN")
        for signal in section["signals"].values():
            self.assertEqual(signal["state"], "UNKNOWN")
            self.assertEqual(signal["confidence"], "NONE")
            self.assertEqual(signal["evidence"], [])

    def test_no_change_when_nodes_already_match(self) -> None:
        profile, _ = sync(manifest(), empty_profile())
        updated, changes = sync(manifest(), profile)
        self.assertEqual(changes, [])
        self.assertEqual(updated["sections"][0]["figma_node_ids"], ["pc:1", "sp:1"])

    def test_unprofiled_node_change_can_update_skeleton(self) -> None:
        profile, _ = sync(manifest(), empty_profile())
        updated, changes = sync(manifest(("pc:2", "sp:2")), profile)
        self.assertEqual(changes, ["UPDATE_NODES S01"])
        self.assertEqual(updated["sections"][0]["figma_node_ids"], ["pc:2", "sp:2"])

    def test_profiled_node_change_requires_new_revision_review(self) -> None:
        profile, _ = sync(manifest(), empty_profile())
        section = profile["sections"][0]
        section["signals"]["components"].update(
            {
                "state": "OBSERVED",
                "confidence": "HIGH",
                "evidence": ["component inventory"],
            }
        )
        with self.assertRaisesRegex(ValueError, "changed after structure evidence"):
            sync(manifest(("pc:2", "sp:2")), profile)

    def test_profile_reference_mismatch_is_rejected(self) -> None:
        profile = empty_profile()
        profile["reference_id"] = "REF-OTHER"
        with self.assertRaisesRegex(ValueError, "reference_id does not match"):
            sync(manifest(), profile)

    def test_orphan_profile_section_is_flagged_not_deleted(self) -> None:
        profile = {
            "reference_id": "REF-1",
            "sections": [
                {
                    "section_id": "OLD",
                    "figma_node_ids": ["old:1"],
                    "signals": {},
                    "mode_reasoning_evidence": [],
                    "trusted_structure": [],
                    "untrusted_or_missing_structure": [],
                }
            ],
        }
        updated, changes = sync(manifest(), profile)
        self.assertIn("ADD S01", changes)
        self.assertIn("ORPHAN_REVIEW OLD", changes)
        self.assertTrue(any(item["section_id"] == "OLD" for item in updated["sections"]))


if __name__ == "__main__":
    unittest.main()
