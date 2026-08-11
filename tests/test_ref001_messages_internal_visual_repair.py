from __future__ import annotations

import base64
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
THEME = ROOT / "experiments" / "ref001-wordpress-acf" / "fixture-theme"
PREVIEW = ROOT / "experiments" / "ref001-wordpress-acf" / "visual-preview"
TEMPLATE = THEME / "template-parts" / "ref001" / "messages.php"
CSS = THEME / "assets" / "css" / "ref001-messages.css"
FIXTURE = THEME / "assets" / "images" / "visual-qa" / "messages" / "messages-mask-group.b64"


class Ref001MessagesInternalVisualRepairTests(unittest.TestCase):
    def test_final_mask_group_is_the_visual_qa_authority(self) -> None:
        template = TEMPLATE.read_text(encoding="utf-8")
        self.assertIn("messages-mask-group.b64", template)
        self.assertIn('data-figma-composite-node="21378:7760"', template)
        self.assertIn("background-image:url(data:image/jpeg;base64,", template)
        self.assertIn('data-figma-image-hash="0cd34d406c04a31f4a32bc2628d184f80db47fad"', template)

    def test_messages_fixture_matches_verified_figma_export_bytes(self) -> None:
        encoded = "".join(FIXTURE.read_text(encoding="utf-8").split())
        self.assertEqual(len(encoded), 15440)
        self.assertEqual(sum(map(ord, encoded)), 1332210)
        decoded = base64.b64decode(encoded, validate=True)
        self.assertEqual(len(decoded), 11579)
        self.assertEqual(decoded[:2], bytes((255, 216)))
        self.assertEqual(decoded[-2:], bytes((255, 217)))

    def test_sp_title_stays_on_the_supplied_single_line(self) -> None:
        css = CSS.read_text(encoding="utf-8")
        media = css.split("@media (max-width: 600px)", 1)[1]
        self.assertIn(".ref001-messages__header h2", media)
        self.assertIn("white-space: nowrap", media)
        self.assertIn("font-size: 24px", media)
        self.assertIn("font-size: 32px", media)

    def test_sp_headline_uses_three_supplied_black_bars(self) -> None:
        template = TEMPLATE.read_text(encoding="utf-8")
        self.assertIn("ref001-messages__headline-line--pc", template)
        self.assertIn("ref001-messages__headline-line--second", template)
        self.assertIn("ref001-messages__headline-line--third", template)
        self.assertIn("今はIT企業のマーケターとして", template)
        self.assertIn("挑戦の毎日です！", template)

        css = CSS.read_text(encoding="utf-8")
        media = css.split("@media (max-width: 600px)", 1)[1]
        self.assertIn("gap: 8px", media)
        self.assertIn("padding: 7px 16px", media)
        self.assertIn("width: 308px", media)
        self.assertIn("width: 176px", media)
        self.assertIn(".ref001-messages__headline-line--pc {\n\t\tdisplay: none", media)
        self.assertIn(".ref001-messages__headline-line--sp {\n\t\tdisplay: inline-block", media)

    def test_sp_profile_uses_supplied_relative_y(self) -> None:
        css = CSS.read_text(encoding="utf-8")
        media = css.split("@media (max-width: 600px)", 1)[1]
        self.assertIn(".ref001-messages__profile {\n\t\ttop: 423px", media)

    def test_browser_gate_scopes_student_voice_and_checks_messages_pixels(self) -> None:
        source = (PREVIEW / "asset-check.mjs").read_text(encoding="utf-8")
        self.assertIn(".ref001-student-voice [data-figma-composite-node]", source)
        self.assertIn("messages-mask-group", source)
        self.assertIn(".ref001-messages__image[data-figma-composite-node]", source)
        self.assertIn("asset.naturalWidth < 80", source)
        self.assertIn("asset.naturalHeight < 50", source)
        self.assertIn("Messages composite decode/pixel failures", source)

    def test_fixture_cache_version_moves_forward(self) -> None:
        functions = (THEME / "functions.php").read_text(encoding="utf-8")
        self.assertIn("$version = '0.10.4';", functions)


if __name__ == "__main__":
    unittest.main()
