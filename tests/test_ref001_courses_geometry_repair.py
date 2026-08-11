from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
THEME = ROOT / "experiments" / "ref001-wordpress-acf" / "fixture-theme"


class Ref001CoursesGeometryRepairTests(unittest.TestCase):
    def test_pc_card_dimensions_are_border_box(self) -> None:
        css = (THEME / "assets" / "css" / "ref001-courses-geometry.css").read_text(encoding="utf-8")
        self.assertIn("box-sizing: border-box", css)
        self.assertIn("height: 271px", css)
        self.assertIn("min-height: 0", css)

    def test_pc_section_spacing_closes_to_supplied_1514px(self) -> None:
        css = (THEME / "assets" / "css" / "ref001-courses-geometry.css").read_text(encoding="utf-8")
        self.assertIn("padding: 72px 0 96px", css)
        self.assertIn("height: 106px", css)
        self.assertIn("margin-bottom: 36px", css)
        self.assertIn("72 + 106 + 36 + 1204 + 96 = 1514px", css)

    def test_sp_uses_supplied_card_heights_gap_and_section_spacing(self) -> None:
        css = (THEME / "assets" / "css" / "ref001-courses-geometry.css").read_text(encoding="utf-8")
        self.assertIn("padding: 56px 0", css)
        self.assertIn("height: 114px", css)
        self.assertIn("margin-bottom: 34px", css)
        self.assertIn("gap: 20px", css)
        self.assertIn("height: 299px", css)
        self.assertIn("nth-child(1)", css)
        self.assertIn("nth-child(5)", css)
        self.assertIn("height: 320px", css)
        self.assertIn("56 + 114 + 34 + 2255 + 56 = 2515px", css)

    def test_header_height_is_explicit_not_font_metric_derived(self) -> None:
        css = (THEME / "assets" / "css" / "ref001-courses-geometry.css").read_text(encoding="utf-8")
        self.assertIn("Header heights are explicit", css)
        self.assertIn(".ref001-courses__header {\n\theight: 106px", css)
        self.assertIn(".ref001-courses__header {\n\t\theight: 114px", css)

    def test_repair_loads_after_courses_first_pass(self) -> None:
        functions = (THEME / "functions.php").read_text(encoding="utf-8")
        first_pass = functions.index("'courses'       => 'ref001-courses.css'")
        repair = functions.index("'courses-geometry' => 'ref001-courses-geometry.css'")
        links = functions.index("'links'         => 'ref001-links.css'")
        self.assertLess(first_pass, repair)
        self.assertLess(repair, links)


if __name__ == "__main__":
    unittest.main()
