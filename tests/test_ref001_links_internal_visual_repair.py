from __future__ import annotations

import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
THEME = ROOT / "experiments" / "ref001-wordpress-acf" / "fixture-theme"
TEMPLATE = THEME / "template-parts" / "ref001" / "links.php"
CSS = THEME / "assets" / "css" / "ref001-links.css"


def split_responsive_css(css: str) -> tuple[str, str]:
    marker = "@media (max-width: 767px)"
    assert marker in css, "Links CSS must use the owner-resolved 768px breakpoint contract"
    desktop, mobile = css.split(marker, 1)
    return desktop, mobile


class Ref001LinksInternalVisualRepairTests(unittest.TestCase):
    def test_numbers_card_uses_structured_lines_not_literal_backslash_n(self) -> None:
        template = TEMPLATE.read_text(encoding="utf-8")
        self.assertNotIn("数字で見る\\n千葉経済大学", template)
        self.assertIn("'label_top' => '数字で見る'", template)
        self.assertIn("'label_main' => '千葉経済大学'", template)
        self.assertIn('class="ref001-links__numbers-top"', template)
        self.assertIn('class="ref001-links__numbers-main"', template)
        self.assertNotIn("nl2br", template)

    def test_numbers_card_preserves_endpoint_specific_type_scale(self) -> None:
        css = CSS.read_text(encoding="utf-8")
        desktop, mobile = split_responsive_css(css)
        self.assertNotIn("@media (max-width: 600px)", css)
        self.assertRegex(desktop, r"\.ref001-links__numbers-top\s*\{[^}]*font-size:\s*18px")
        self.assertRegex(desktop, r"\.ref001-links__numbers-main\s*\{[^}]*font-size:\s*22px")
        self.assertRegex(mobile, r"\.ref001-links__numbers-top\s*\{[^}]*font-size:\s*13px")
        self.assertRegex(mobile, r"\.ref001-links__numbers-main\s*\{[^}]*font-size:\s*16px")

    def test_instagram_title_is_one_line_pc_and_two_lines_sp(self) -> None:
        template = TEMPLATE.read_text(encoding="utf-8")
        self.assertIn('class="ref001-links__instagram-line">Official</span>', template)
        self.assertIn('class="ref001-links__instagram-line">Instagram</span>', template)
        css = CSS.read_text(encoding="utf-8")
        desktop, mobile = split_responsive_css(css)
        self.assertRegex(desktop, r"\.ref001-links__instagram-line\s*\{[^}]*display:\s*inline")
        self.assertRegex(mobile, r"\.ref001-links__instagram-line\s*\{[^}]*display:\s*block")

    def test_instagram_uses_css_glyph_not_placeholder_character(self) -> None:
        template = TEMPLATE.read_text(encoding="utf-8")
        self.assertNotIn("◎", template)
        self.assertIn('class="ref001-links__instagram-icon"', template)
        css = CSS.read_text(encoding="utf-8")
        self.assertIn(".ref001-links__instagram-icon", css)
        self.assertIn("border: 1.2px solid currentColor", css)
        self.assertIn(".ref001-links__instagram-icon::before", css)
        self.assertIn(".ref001-links__instagram-icon::after", css)

    def test_circle_geometry_remains_exact_at_supplied_endpoints_and_fluid_below_sp(self) -> None:
        css = CSS.read_text(encoding="utf-8")
        desktop, mobile = split_responsive_css(css)

        # At 1380px, four 260px items plus three 24px gaps reproduce the supplied PC row.
        self.assertIn("grid-template-columns: repeat(auto-fit, 260px)", desktop)
        self.assertRegex(desktop, r"\.ref001-links__item\s*\{[^}]*width:\s*260px;[^}]*height:\s*260px")
        self.assertIn("width: 250px", desktop)
        self.assertIn("height: 250px", desktop)
        self.assertIn("top: 10px", desktop)
        self.assertIn("left: 10px", desktop)

        # At 375px, the 343px container resolves to 162px + 19px + 162px and
        # 155px faces. The intrinsic track/calc form can then contract safely at 320px.
        self.assertIn("grid-template-columns: repeat(2, minmax(0, 162px))", mobile)
        self.assertIn("aspect-ratio: 1", mobile)
        self.assertIn("width: calc(100% - 7px)", mobile)
        self.assertIn("height: calc(100% - 7px)", mobile)
        self.assertIn("top: 7px", mobile)
        self.assertIn("left: 7px", mobile)


if __name__ == "__main__":
    unittest.main()
