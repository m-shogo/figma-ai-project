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
        self.assertIn("glob( $theme_root . '/assets/css/*.css' )", source)

    def test_capture_script_generates_both_acceptance_widths(self) -> None:
        source = (PREVIEW / "capture.sh").read_text(encoding="utf-8")
        self.assertIn('--viewport-size="1380,900"', source)
        self.assertIn('--viewport-size="375,844"', source)
        self.assertIn("ref001-pc-1380.png", source)
        self.assertIn("ref001-sp-375.png", source)
        self.assertIn("--full-page", source)

    def test_generated_captures_are_not_committed(self) -> None:
        ignore = (PREVIEW / ".gitignore").read_text(encoding="utf-8")
        self.assertIn("captures/", ignore)


if __name__ == "__main__":
    unittest.main()
