from __future__ import annotations

from pathlib import Path
import unittest

import yaml


ROOT = Path(__file__).resolve().parents[1]
POLICY = ROOT / "config" / "frontend-raster-asset-export-policy.yaml"
DOC = ROOT / "docs" / "image-gradient-visual-tolerance.md"
AGENTS = ROOT / "AGENTS.md"


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

    def test_delivery_format_is_webp_and_outlined_svg(self) -> None:
        delivery = self.policy["delivery_format"]
        vector = self.policy["vector_policy"]
        self.assertEqual("WEBP", delivery["photographic_raster"])
        self.assertTrue(delivery["do_not_keep_jpeg_or_png_photos"])
        self.assertEqual("OUTLINED_SVG", delivery["vector_logo_icon"])
        self.assertTrue(delivery["do_not_hotlink_ephemeral_figma_urls"])
        self.assertIn("theme", delivery["applies_to"])
        self.assertIn("landing_page", delivery["applies_to"])
        self.assertIn("html_site", delivery["applies_to"])
        self.assertTrue(vector["outline_text_and_strokes_to_paths"])
        self.assertTrue(vector["do_not_autotrace_raster_logo_to_svg"])
        self.assertEqual("WEBP", vector["raster_only_logo_format"])
        self.assertIn("写真・ラスター fill → WebP", self.doc)
        self.assertIn("文字・stroke を path にした SVG", self.doc)
        self.assertIn("ラスターしか無い logo", self.doc)
        agents = AGENTS.read_text(encoding="utf-8")
        self.assertIn("写真・ラスター fill → WebP", agents)
        self.assertIn("文字・stroke を path にした SVG", agents)
        self.assertIn("config/frontend-raster-asset-export-policy.yaml", agents)


if __name__ == "__main__":
    unittest.main()
