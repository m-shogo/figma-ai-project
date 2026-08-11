from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
THEME = ROOT / "experiments" / "ref001-wordpress-acf" / "fixture-theme"
CSS = THEME / "assets" / "css" / "ref001-courses-visual.css"
TEMPLATE = THEME / "template-parts" / "ref001" / "courses.php"


class Ref001CoursesInternalVisualRepairTests(unittest.TestCase):
    def test_visual_repair_loads_after_geometry_and_before_following_section(self) -> None:
        functions = (THEME / "functions.php").read_text(encoding="utf-8")
        first_pass = functions.index("'courses'       => 'ref001-courses.css'")
        geometry = functions.index("'courses-geometry' => 'ref001-courses-geometry.css'")
        visual = functions.index("'courses-visual' => 'ref001-courses-visual.css'")
        links = functions.index("'links'         => 'ref001-links.css'")
        self.assertLess(first_pass, geometry)
        self.assertLess(geometry, visual)
        self.assertLess(visual, links)

    def test_repair_does_not_take_over_locked_section_or_card_dimensions(self) -> None:
        css = CSS.read_text(encoding="utf-8")
        self.assertNotIn("height: 271px", css)
        self.assertNotIn("height: 299px", css)
        self.assertNotIn("height: 320px", css)
        self.assertNotIn("padding: 72px 0 96px", css)
        self.assertNotIn("padding: 56px 0", css)

    def test_pc_internal_positions_follow_supplied_figma_coordinates(self) -> None:
        css = CSS.read_text(encoding="utf-8")
        self.assertIn("left: 124px", css)
        self.assertIn("top: 24px", css)
        self.assertIn("top: 60px", css)
        self.assertIn("width: 396px", css)
        self.assertIn("left: 32px", css)
        self.assertIn("top: 124px", css)
        self.assertIn("width: 496px", css)
        self.assertIn("height: 102px", css)
        self.assertIn("padding: 40px 20px 16px", css)

    def test_course_titles_and_markers_match_figma_scale(self) -> None:
        css = CSS.read_text(encoding="utf-8")
        self.assertIn("font-size: 20px", css)
        self.assertIn("height: 8px", css)
        self.assertIn("opacity: 0.3", css)
        for width in ("125px", "104px", "188px", "81px"):
            self.assertIn(f"width: {width}", css)

    def test_recommendation_marker_is_checkbox_not_course_color_dot(self) -> None:
        css = CSS.read_text(encoding="utf-8")
        checkbox_rule = css.split(".ref001-course-card__recommendations li::before", 1)[1].split("}", 1)[0]
        self.assertIn("width: 10px", checkbox_rule)
        self.assertIn("height: 10px", checkbox_rule)
        self.assertIn("border: 1px solid rgba(150, 150, 150, 0.5)", checkbox_rule)
        self.assertIn("border-radius: 0", checkbox_rule)
        self.assertIn("background: #fff", checkbox_rule)
        self.assertNotIn("var(--ref001-course-color)", checkbox_rule)
        self.assertIn("#ef8590", css)

    def test_sp_internals_use_supplied_72px_icon_and_311px_recommendation_base(self) -> None:
        css = CSS.read_text(encoding="utf-8")
        media = css.split("@media (max-width: 600px)", 1)[1]
        self.assertIn("width: 72px", media)
        self.assertIn("height: 72px", media)
        self.assertIn("left: 96px", media)
        self.assertIn("width: 231px", media)
        self.assertIn("width: 311px", media)
        self.assertIn("height: 136px", media)
        self.assertIn("top: 118px", media)
        self.assertIn("top: 139px", media)
        self.assertIn("padding: 36px 16px 16px", media)
        self.assertIn("min-height: 36px", media)

    def test_heading_separates_emphasized_seven_from_suffix(self) -> None:
        template = TEMPLATE.read_text(encoding="utf-8")
        self.assertIn('class="ref001-courses__count">７</span>つのコース', template)
        css = CSS.read_text(encoding="utf-8")
        self.assertIn(".ref001-courses__count", css)
        self.assertIn("font-size: 42px", css)
        self.assertIn("font-size: 32px", css)


if __name__ == "__main__":
    unittest.main()
