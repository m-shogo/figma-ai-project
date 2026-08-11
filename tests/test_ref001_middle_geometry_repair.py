from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
THEME = ROOT / "experiments" / "ref001-wordpress-acf" / "fixture-theme"


class Ref001MiddleGeometryRepairTests(unittest.TestCase):
    def test_pc_external_gaps_match_supplied_figma_coordinates(self) -> None:
        css = (THEME / "assets" / "css" / "ref001-middle-geometry.css").read_text(encoding="utf-8")
        self.assertIn("margin-top: 96px", css)
        self.assertIn("margin-top: 183px", css)
        self.assertIn("margin-top: 118px", css)

    def test_sp_uses_three_equal_56px_gaps_and_exact_education_flow_box(self) -> None:
        css = (THEME / "assets" / "css" / "ref001-middle-geometry.css").read_text(encoding="utf-8")
        self.assertIn("height: 1534px", css)
        self.assertIn("min-height: 0", css)
        self.assertIn("margin-top: 56px", css)

    def test_repair_targets_only_known_adjacent_sections(self) -> None:
        css = (THEME / "assets" / "css" / "ref001-middle-geometry.css").read_text(encoding="utf-8")
        self.assertIn(".ref001-cta + .ref001-student-voice", css)
        self.assertIn(".ref001-student-voice + .ref001-messages", css)
        self.assertIn(".ref001-messages + .ref001-cta", css)

    def test_middle_repair_is_loaded_before_courses(self) -> None:
        functions = (THEME / "functions.php").read_text(encoding="utf-8")
        repair = functions.index("'middle-geometry' => 'ref001-middle-geometry.css'")
        courses = functions.index("'courses'       => 'ref001-courses.css'")
        self.assertLess(repair, courses)


if __name__ == "__main__":
    unittest.main()
