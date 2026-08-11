from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
THEME = ROOT / "experiments" / "ref001-wordpress-acf" / "fixture-theme"
TEMPLATE = THEME / "template-parts" / "ref001" / "links.php"
CSS = THEME / "assets" / "css" / "ref001-links.css"


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
        self.assertIn(".ref001-links__numbers-top", css)
        self.assertIn("font-size: 18px", css)
        self.assertIn(".ref001-links__numbers-main", css)
        self.assertIn("font-size: 22px", css)
        media = css.split("@media (max-width: 600px)", 1)[1]
        self.assertIn("font-size: 13px", media)
        self.assertIn("font-size: 16px", media)

    def test_instagram_title_is_one_line_pc_and_two_lines_sp(self) -> None:
        template = TEMPLATE.read_text(encoding="utf-8")
        self.assertIn('class="ref001-links__instagram-line">Official</span>', template)
        self.assertIn('class="ref001-links__instagram-line">Instagram</span>', template)
        css = CSS.read_text(encoding="utf-8")
        self.assertIn(".ref001-links__instagram-line {\n\tdisplay: inline", css)
        media = css.split("@media (max-width: 600px)", 1)[1]
        self.assertIn(".ref001-links__instagram-line {\n\t\tdisplay: block", media)

    def test_instagram_uses_css_glyph_not_placeholder_character(self) -> None:
        template = TEMPLATE.read_text(encoding="utf-8")
        self.assertNotIn("◎", template)
        self.assertIn('class="ref001-links__instagram-icon"', template)
        css = CSS.read_text(encoding="utf-8")
        self.assertIn(".ref001-links__instagram-icon", css)
        self.assertIn("border: 1.2px solid currentColor", css)
        self.assertIn(".ref001-links__instagram-icon::before", css)
        self.assertIn(".ref001-links__instagram-icon::after", css)

    def test_circle_geometry_remains_supplied_pc_and_sp_values(self) -> None:
        css = CSS.read_text(encoding="utf-8")
        self.assertIn("grid-template-columns: repeat(4, 260px)", css)
        self.assertIn("width: 250px", css)
        self.assertIn("height: 250px", css)
        self.assertIn("top: 10px", css)
        self.assertIn("left: 10px", css)
        media = css.split("@media (max-width: 600px)", 1)[1]
        self.assertIn("grid-template-columns: repeat(2, 162px)", media)
        self.assertIn("width: 155px", media)
        self.assertIn("height: 155px", media)
        self.assertIn("top: 7px", media)
        self.assertIn("left: 7px", media)


if __name__ == "__main__":
    unittest.main()
