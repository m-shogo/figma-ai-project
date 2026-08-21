from __future__ import annotations

from pathlib import Path
import unittest

import yaml


ROOT = Path(__file__).resolve().parents[1]
POLICY = ROOT / "config" / "frontend-raster-asset-export-policy.yaml"
DOC = ROOT / "docs" / "image-gradient-visual-tolerance.md"


class FrontendRasterAssetExportPolicyTests(unittest.TestCase):
    def setUp(self) -> None:
        self.policy = yaml.safe_load(POLICY.read_text(encoding="utf-8"))
        self.doc = DOC.read_text(encoding="utf-8")

    def test_owner_fixed_export_values(self) -> None:
        self.assertEqual("OWNER_FIXED", self.policy["authority"])
        self.assertEqual("ACTIVE", self.policy["status"])
        self.assertEqual(3, self.policy["responsive_exports"]["sp"]["scale"])
        self.assertEqual("WEBP", self.policy["responsive_exports"]["sp"]["format"])
        self.assertEqual(2, self.policy["responsive_exports"]["pc"]["scale"])
        self.assertEqual("WEBP", self.policy["responsive_exports"]["pc"]["format"])

    def test_vector_and_art_direction_contract(self) -> None:
        vector = self.policy["vector_policy"]
        art = self.policy["art_direction"]
        quality = self.policy["quality"]
        self.assertTrue(vector["prefer_svg_when_source_is_vector"])
        self.assertFalse(vector["raster_rule_applies_to_svg"])
        self.assertTrue(art["separate_pc_sp_asset_when_crop_or_composition_differs"])
        self.assertTrue(art["do_not_force_single_asset_when_visual_source_differs"])
        self.assertTrue(quality["do_not_count_upscaled_low_resolution_source_as_compliant"])
        self.assertEqual("SOURCE_RESOLUTION_INSUFFICIENT", quality["insufficient_source_state"])

    def test_canonical_doc_states_same_fixed_rule(self) -> None:
        self.assertIn("SP raster → 表示サイズ基準 @3x → WebP", self.doc)
        self.assertIn("PC raster → 表示サイズ基準 @2x → WebP", self.doc)
        self.assertIn("config/frontend-raster-asset-export-policy.yaml", self.doc)
        self.assertIn("SOURCE_RESOLUTION_INSUFFICIENT", self.doc)


if __name__ == "__main__":
    unittest.main()
