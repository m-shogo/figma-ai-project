from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PREVIEW = ROOT / "experiments" / "ref001-wordpress-acf" / "visual-preview"


class Ref001VisualPreviewHarnessTests(unittest.TestCase):
    def test_preview_is_outside_fixture_theme_and_dev_server_only(self) -> None:
        source = (PREVIEW / "index.php").read_text(encoding="utf-8")
        self.assertIn("PHP_SAPI !== 'cli-server'", source)
        self.assertIn("REF001_VISUAL_PREVIEW", source)
        self.assertIn("fixture-theme", source)

    def test_preview_forces_empty_acf_and_wordpress_media(self) -> None:
        source = (PREVIEW / "index.php").read_text(encoding="utf-8")
        self.assertIn("function get_field() { return null; }", source)
        self.assertIn("function wp_get_attachment_image() { return ''; }", source)

    def test_preview_reuses_real_page_template_and_template_parts(self) -> None:
        source = (PREVIEW / "index.php").read_text(encoding="utf-8")
        self.assertIn("page-templates/template-ref001.php", source)
        self.assertIn("function get_template_part", source)
        self.assertIn("ref001_learning_enqueue_assets();", source)

    def test_preview_uses_real_wordpress_enqueue_order(self) -> None:
        source = (PREVIEW / "index.php").read_text(encoding="utf-8")
        self.assertIn("function wp_enqueue_style", source)
        self.assertIn("$ref001_preview_styles[ $handle ]", source)
        self.assertIn("data-ref001-style", source)
        self.assertNotIn("glob( $theme_root . '/assets/css/*.css' )", source)
        self.assertNotIn("sort( $styles )", source)

    def test_preview_theme_assets_use_absolute_document_root_urls(self) -> None:
        source = (PREVIEW / "index.php").read_text(encoding="utf-8")
        self.assertIn("return '/fixture-theme/'", source)
        self.assertNotIn("return '../fixture-theme/'", source)

    def test_capture_generates_both_acceptance_widths_after_scrolling_assets(self) -> None:
        shell = (PREVIEW / "capture.sh").read_text(encoding="utf-8")
        source = (PREVIEW / "capture.mjs").read_text(encoding="utf-8")
        self.assertIn("capture.mjs", shell)
        self.assertIn("width: 1380", source)
        self.assertIn("height: 900", source)
        self.assertIn("width: 375", source)
        self.assertIn("height: 844", source)
        self.assertIn("ref001-pc-1380.png", source)
        self.assertIn("ref001-sp-375.png", source)
        self.assertIn("window.scrollTo", source)
        self.assertIn("image.decode", source)
        self.assertIn("fullPage: true", source)

    def test_course_asset_check_requires_all_seven_pictograms_to_decode(self) -> None:
        source = (PREVIEW / "asset-check.mjs").read_text(encoding="utf-8")
        shell = (PREVIEW / "asset-check.sh").read_text(encoding="utf-8")
        self.assertIn(".ref001-course-card__icon img", source)
        self.assertIn("scrollIntoViewIfNeeded", source)
        self.assertIn("naturalWidth", source)
        self.assertIn("status !== 200", source)
        self.assertIn("courseResults.length !== 7", source)
        self.assertIn("asset-check.mjs", shell)

    def test_generated_captures_are_not_committed(self) -> None:
        ignore = (PREVIEW / ".gitignore").read_text(encoding="utf-8")
        self.assertIn("captures/", ignore)


if __name__ == "__main__":
    unittest.main()
