from __future__ import annotations

import sys
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from resolve_responsive_counterparts import resolve  # noqa: E402


FIXTURE = ROOT / "tests" / "fixtures" / "ref002-responsive-frame-inventory.yaml"


def load_fixture() -> dict:
    value = yaml.safe_load(FIXTURE.read_text(encoding="utf-8"))
    assert isinstance(value, dict)
    return value


def by_pc(result: dict, node_id: str) -> dict:
    return next(item for item in result["matches"] if item["pc_node_id"] == node_id)


class ResponsiveCounterpartResolverTests(unittest.TestCase):
    def test_device_suffix_exact_name_can_be_high_confidence(self) -> None:
        result = resolve(load_fixture())
        join = by_pc(result, "380:417")
        self.assertEqual(join["sp_node_id"], "560:188")
        self.assertEqual(join["confidence"], "HIGH")
        self.assertEqual(join["decision"], "AUTO_CANDIDATE")
        self.assertIn("canonical_name_exact", join["evidence"])
        self.assertFalse(join["collision"])

    def test_generic_sp_name_can_still_match_semantically(self) -> None:
        result = resolve(load_fixture())
        parts = by_pc(result, "1163:4245")
        self.assertEqual(parts["sp_node_id"], "1399:19144")
        self.assertIn(parts["confidence"], {"MEDIUM", "HIGH"})
        self.assertIn("page_family_hint_exact", parts["evidence"])
        self.assertTrue(any(item.startswith("semantic_") for item in parts["evidence"]))

    def test_two_strong_news_variants_are_not_silently_auto_accepted(self) -> None:
        result = resolve(load_fixture())
        news = by_pc(result, "413:2191")
        self.assertEqual(news["sp_node_id"], "560:2524")
        self.assertGreaterEqual(news["second_score"], 0.60)
        self.assertEqual(news["confidence"], "MEDIUM")
        self.assertEqual(news["decision"], "INSPECT_STRUCTURE")
        self.assertTrue(any(item["sp_node_id"] == "1399:14225" for item in news["alternatives"]))

    def test_sparse_top_fingerprint_escalates_to_agent_not_human_first(self) -> None:
        result = resolve(load_fixture())
        top = by_pc(result, "839:4676")
        self.assertNotEqual(top["confidence"], "HIGH")
        self.assertIn(top["decision"], {"INSPECT_STRUCTURE", "INSPECT_VISUAL"})
        self.assertIn("only when structure plus visual inspection", result["policy"]["human_review"])

    def test_missing_device_side_is_rejected(self) -> None:
        with self.assertRaisesRegex(ValueError, "at least one PC and one SP"):
            resolve({"reference_id": "REF-X", "frames": [{"page_role": "PC", "node_id": "1:1"}]})

    def test_duplicate_generic_candidates_require_agent_inspection(self) -> None:
        data = {
            "reference_id": "REF-X",
            "frames": [
                {
                    "page_role": "PC",
                    "node_id": "1:1",
                    "name": "page",
                    "order": 0,
                    "width": 1380,
                    "height": 2000,
                    "semantic_tokens": ["会社概要", "沿革"],
                },
                {
                    "page_role": "SP",
                    "node_id": "2:1",
                    "name": "page_sp",
                    "order": 0,
                    "width": 375,
                    "height": 2200,
                    "semantic_tokens": ["会社概要", "沿革"],
                },
                {
                    "page_role": "SP",
                    "node_id": "2:2",
                    "name": "page_mobile",
                    "order": 1,
                    "width": 375,
                    "height": 2200,
                    "semantic_tokens": ["会社概要", "沿革"],
                },
            ],
        }
        match = resolve(data)["matches"][0]
        self.assertNotEqual(match["confidence"], "HIGH")
        self.assertIn(match["decision"], {"INSPECT_STRUCTURE", "INSPECT_VISUAL"})

    def test_candidate_collision_blocks_automatic_acceptance(self) -> None:
        data = {
            "reference_id": "COLLISION",
            "frames": [
                {
                    "page_role": "PC",
                    "node_id": "pc:1",
                    "name": "feature",
                    "order": 0,
                    "height": 1000,
                    "semantic_tokens": ["feature", "shared"],
                },
                {
                    "page_role": "PC",
                    "node_id": "pc:2",
                    "name": "feature",
                    "order": 1,
                    "height": 1000,
                    "semantic_tokens": ["feature", "shared"],
                },
                {
                    "page_role": "SP",
                    "node_id": "sp:1",
                    "name": "feature_sp",
                    "order": 0,
                    "height": 1000,
                    "semantic_tokens": ["feature", "shared"],
                },
            ],
        }
        result = resolve(data)
        self.assertEqual(len(result["matches"]), 2)
        for match in result["matches"]:
            self.assertTrue(match["collision"])
            self.assertNotEqual(match["decision"], "AUTO_CANDIDATE")
            self.assertIn("candidate_collision", match["evidence"])


if __name__ == "__main__":
    unittest.main()
