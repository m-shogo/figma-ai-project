from __future__ import annotations

import base64
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
THEME = ROOT / "experiments" / "ref001-wordpress-acf" / "fixture-theme"
PREVIEW = ROOT / "experiments" / "ref001-wordpress-acf" / "visual-preview"
TEMPLATE = THEME / "template-parts" / "ref001" / "messages.php"
CSS = THEME / "assets" / "css" / "ref001-messages.css"
FIXTURE_ROOT = THEME / "assets" / "images" / "visual-qa" / "messages"
FIXTURE_PARTS = tuple(FIXTURE_ROOT / f"messages-mask-group.part{index:02d}.b64" for index in range(1, 8))


def split_responsive_css(css: str) -> tuple[str, str]:
    marker = "@media (max-width: 767px)"
    assert marker in css, "Messages CSS must use the owner-resolved 768px breakpoint contract"
    desktop, mobile = css.split(marker, 1)
    return desktop, mobile


class Ref001MessagesInternalVisualRepairTests(unittest.TestCase):
    def test_final_mask_group_is_the_visual_qa_authority(self) -> None:
        template = TEMPLATE.read_text(encoding="utf-8")
        self.assertIn("messages-mask-group.part01.b64", template)
        self.assertIn("messages-mask-group.part07.b64", template)
        self.assertIn('data-figma-composite-node="21378:7760"', template)
        self.assertIn("background-image:url(data:image/jpeg;base64,", template)
        self.assertIn('data-figma-image-hash="0cd34d406c04a31f4a32bc2628d184f80db47fad"', template)

    def test_messages_fixture_matches_verified_figma_export_bytes(self) -> None:
        parts = ["".join(path.read_text(encoding="utf-8").split()) for path in FIXTURE_PARTS]
        self.assertEqual([len(part) for part in parts], [2400, 2400, 2400, 2400, 2400, 2400, 1040])
        encoded = "".join(parts)
        self.assertEqual(len(encoded), 15440)
        self.assertEqual(sum(map(ord, encoded)), 1332210)
        decoded = base64.b64decode(encoded, validate=True)
        self.assertEqual(len(decoded), 11579)
        self.assertEqual(decoded[:2], bytes((255, 216)))
        self.assertEqual(decoded[-2:], bytes((255, 217)))

    def test_sp_title_preserves_type_scale_without_forcing_static_wrap(self) -> None:
        css = CSS.read_text(encoding="utf-8")
        _, mobile = split_responsive_css(css)
        self.assertNotIn("@media (max-width: 600px)", css)
        self.assertIn(".ref001-messages__header h2", mobile)
        self.assertIn("font-size: 24px", mobile)
        self.assertIn("font-size: 32px", mobile)
        header_rule = mobile.split(".ref001-messages__header h2", 1)[1].split("}", 1)[0]
        self.assertNotIn("white-space: nowrap", header_rule)

    def test_sp_headline_uses_three_supplied_black_bars_without_fixed_viewport_overflow(self) -> None:
        template = TEMPLATE.read_text(encoding="utf-8")
        self.assertIn("ref001-messages__headline-line--pc", template)
        self.assertIn("ref001-messages__headline-line--second", template)
        self.assertIn("ref001-messages__headline-line--third", template)
        self.assertIn("今はIT企業のマーケターとして", template)
        self.assertIn("挑戦の毎日です！", template)

        css = CSS.read_text(encoding="utf-8")
        _, mobile = split_responsive_css(css)
        self.assertIn("gap: 8px", mobile)
        self.assertIn("padding: 7px 16px", mobile)
        self.assertIn("width: min(308px, calc(100% - 32px))", mobile)
        self.assertIn("width: min(176px, calc(100% - 32px))", mobile)
        self.assertIn(".ref001-messages__headline-line--pc {\n\t\tdisplay: none", mobile)
        self.assertIn(".ref001-messages__headline-line--sp {\n\t\tdisplay: inline-block", mobile)

    def test_sp_profile_uses_supplied_relative_y(self) -> None:
        css = CSS.read_text(encoding="utf-8")
        _, mobile = split_responsive_css(css)
        self.assertIn(".ref001-messages__profile {\n\t\ttop: 423px", mobile)

    def test_375_endpoint_records_exact_image_slot_while_mobile_remains_fluid(self) -> None:
        css = CSS.read_text(encoding="utf-8")
        _, mobile = split_responsive_css(css)
        self.assertIn("width: min(343px, calc(100% - 32px))", mobile)
        self.assertIn("@media (width: 375px)", mobile)
        self.assertIn("width: 343px", mobile)

    def test_browser_gate_scopes_student_voice_and_checks_messages_pixels(self) -> None:
        source = (PREVIEW / "asset-check.mjs").read_text(encoding="utf-8")
        self.assertIn(".ref001-student-voice [data-figma-composite-node]", source)
        self.assertIn("readMultipartFixture", source)
        self.assertIn("partLengths: [2400, 2400, 2400, 2400, 2400, 2400, 1040]", source)
        self.assertIn(".ref001-messages__image[data-figma-composite-node]", source)
        self.assertIn("asset.naturalWidth < 80", source)
        self.assertIn("asset.naturalHeight < 50", source)
        self.assertIn("Messages composite decode/pixel failures", source)

    def test_fixture_cache_version_moves_forward(self) -> None:
        functions = (THEME / "functions.php").read_text(encoding="utf-8")
        self.assertIn("$version = '0.10.4';", functions)


if __name__ == "__main__":
    unittest.main()
