from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "experiments" / "ref001-wordpress-acf" / "fixture-theme"


class Ref001VisualMiddleTests(unittest.TestCase):
    def test_full_visual_sequence_is_connected_in_figma_order(self) -> None:
        template = (FIXTURE / "page-templates" / "template-ref001.php").read_text(encoding="utf-8")
        sequence = [
            "main-visual",
            "reason",
            "education",
            "cta",
            "student-voice",
            "messages",
            "cta",
            "courses",
            "links",
            "cta-value",
        ]
        cursor = 0
        for name in sequence:
            token = f"get_template_part( 'template-parts/ref001/{name}' )"
            found = template.find(token, cursor)
            self.assertGreaterEqual(found, 0, f"missing/out-of-order visual section: {name}")
            cursor = found + len(token)

    def test_visual_styles_are_enqueued(self) -> None:
        functions = (FIXTURE / "functions.php").read_text(encoding="utf-8")
        for stylesheet in (
            "ref001-header.css",
            "ref001-mv-visual.css",
            "ref001-middle.css",
            "ref001-messages.css",
        ):
            self.assertIn(f"assets/css/{stylesheet}", functions)

    def test_mv_has_non_expiring_fallbacks_before_acf_media_entry(self) -> None:
        css = (FIXTURE / "assets" / "css" / "ref001-mv-visual.css").read_text(encoding="utf-8")
        self.assertIn('data-missing-acf="mv_left_person_image"', css)
        self.assertIn('data-missing-acf="mv_right_person_image"', css)
        self.assertIn("data:image/jpeg;base64,", css)
        self.assertNotIn("figma.com/api/mcp/asset", css)

    def test_header_is_visual_but_destinations_remain_deferred(self) -> None:
        header = (FIXTURE / "header.php").read_text(encoding="utf-8")
        self.assertIn('data-global-ownership-status="deferred"', header)
        self.assertIn("資料請求", header)
        self.assertIn("オープンキャンパス", header)
        self.assertNotIn("href=", header)

    def test_student_voice_preserves_one_open_two_collapsed_without_js(self) -> None:
        source = (FIXTURE / "template-parts" / "ref001" / "student-voice.php").read_text(encoding="utf-8")
        self.assertEqual(1, source.count("'open' => true"))
        self.assertEqual(2, source.count("'open' => false"))
        for token in ("addEventListener(", "aria-expanded=", "data-accordion=", "new Accordion("):
            self.assertNotIn(token, source)

    def test_messages_preserves_only_static_one_of_four_state(self) -> None:
        source = (FIXTURE / "template-parts" / "ref001" / "messages.php").read_text(encoding="utf-8")
        self.assertIn('aria-label="1 / 4"', source)
        self.assertIn('data-interaction-status="deferred"', source)
        for token in ("new Swiper(", "new Splide(", "slick(", "data-swiper", "addEventListener("):
            self.assertNotIn(token, source)

    def test_embedded_visual_assets_are_complete(self) -> None:
        for path in (
            FIXTURE / "template-parts" / "ref001" / "cta.php",
            FIXTURE / "template-parts" / "ref001" / "student-voice.php",
            FIXTURE / "template-parts" / "ref001" / "messages.php",
        ):
            source = path.read_text(encoding="utf-8")
            self.assertNotIn("truncated for brevity", source)
            self.assertNotIn("figma.com/api/mcp/asset", source)


if __name__ == "__main__":
    unittest.main()
