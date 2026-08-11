from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "experiments" / "ref001-wordpress-acf" / "fixture-theme"


class Ref001VisualPreviewTests(unittest.TestCase):
    def test_preview_styles_are_enqueued(self) -> None:
        functions = (FIXTURE / "functions.php").read_text(encoding="utf-8")
        self.assertIn("assets/css/ref001-content-previews.css", functions)
        self.assertIn("assets/css/ref001-visual-previews.css", functions)

    def test_acf_image_sections_have_visual_fallbacks(self) -> None:
        content = (FIXTURE / "assets" / "css" / "ref001-content-previews.css").read_text(encoding="utf-8")
        visual = (FIXTURE / "assets" / "css" / "ref001-visual-previews.css").read_text(encoding="utf-8")

        for field in (
            "mv_left_person_image",
            "mv_right_person_image",
        ):
            self.assertIn(f'data-missing-acf="{field}"', visual)

        for field in (
            "reason_1_image",
            "reason_2_image",
            "reason_3_image",
            "education_1_image",
            "education_2_image",
            "education_3_image",
            "education_4_image",
        ):
            self.assertIn(f'data-missing-acf="{field}"', content)

    def test_deferred_middle_media_hashes_have_previews(self) -> None:
        visual = (FIXTURE / "assets" / "css" / "ref001-visual-previews.css").read_text(encoding="utf-8")
        for image_hash in (
            "3d75f87093b94f5fc4cf170e2cab4cf708ed2199",
            "86846cd3209d3cfcb073f990a3086a88561c4e5f",
            "9207ec420db4bcf2c13978db88b841ef289470cd",
            "a83f6b8117ecb473654e6bc2c49fd647c6906353",
            "7a511d1d21dc3433d66e4d82fd4ec5c0d664324f",
            "0cd34d406c04a31f4a32bc2628d184f80db47fad",
        ):
            self.assertIn(image_hash, visual)

    def test_previews_are_embedded_and_non_expiring(self) -> None:
        combined = "\n".join(
            (FIXTURE / "assets" / "css" / name).read_text(encoding="utf-8")
            for name in ("ref001-content-previews.css", "ref001-visual-previews.css")
        )
        self.assertIn("data:image/jpeg;base64,", combined)
        self.assertNotIn("figma.com/api/mcp/asset", combined)
        self.assertNotIn("truncated for brevity", combined)


if __name__ == "__main__":
    unittest.main()
