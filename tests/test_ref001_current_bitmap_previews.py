from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
THEME = ROOT / "experiments" / "ref001-wordpress-acf" / "fixture-theme"
CSS = THEME / "assets" / "css"


class Ref001CurrentBitmapPreviewTests(unittest.TestCase):
    def test_current_missing_acf_media_has_visual_fallbacks(self) -> None:
        files = [
            CSS / "ref001-visual-media.css",
            CSS / "ref001-visual-media-education.css",
            CSS / "ref001-visual-media-cta-messages.css",
            CSS / "ref001-visual-media-voice.css",
        ]
        combined = "\n".join(path.read_text(encoding="utf-8") for path in files)

        for field in (
            "mv_left_person_image",
            "mv_right_person_image",
            "reason_1_image",
            "reason_2_image",
            "reason_3_image",
            "education_1_image",
            "education_2_image",
            "education_3_image",
            "education_4_image",
        ):
            self.assertIn(f'data-missing-acf="{field}"', combined)

        for image_hash in (
            "7a0569464ece1a5ffe4e6c5a1e50fb4b5efaac0c",
            "33aab97f8b6328f273150c0578bc5b6230d0c5e2",
            "8c372ab3f8d02f36020b3b7c1bd719545105ff26",
            "12c4c3b3e824e6f191ac8a273fdfadb64912383b",
            "0cd34d406c04a31f4a32bc2628d184f80db47fad",
        ):
            self.assertIn(image_hash, combined)

        self.assertIn('.ref001-cta__background[data-asset-status="deferred"]', combined)

    def test_preview_media_is_embedded_and_non_expiring(self) -> None:
        combined = "\n".join(
            path.read_text(encoding="utf-8")
            for path in (
                CSS / "ref001-visual-media.css",
                CSS / "ref001-visual-media-education.css",
                CSS / "ref001-visual-media-cta-messages.css",
                CSS / "ref001-visual-media-voice.css",
            )
        )
        self.assertGreaterEqual(combined.count("data:image/jpeg;base64,"), 15)
        self.assertNotIn("figma.com/api/mcp/asset", combined)
        self.assertNotIn("http://", combined)
        self.assertNotIn("https://", combined)

    def test_visual_media_layers_load_after_geometry_and_section_css(self) -> None:
        functions = (THEME / "functions.php").read_text(encoding="utf-8")
        footer = functions.index("'footer'        => 'ref001-footer.css'")
        visual = functions.index("'visual-media' => 'ref001-visual-media.css'")
        education = functions.index("'visual-media-education' => 'ref001-visual-media-education.css'")
        middle = functions.index("'visual-media-cta-messages' => 'ref001-visual-media-cta-messages.css'")
        voice = functions.index("'visual-media-voice' => 'ref001-visual-media-voice.css'")
        self.assertLess(footer, visual)
        self.assertLess(visual, education)
        self.assertLess(education, middle)
        self.assertLess(middle, voice)


if __name__ == "__main__":
    unittest.main()
