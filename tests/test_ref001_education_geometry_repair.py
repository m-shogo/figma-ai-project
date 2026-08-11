from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
THEME = ROOT / "experiments" / "ref001-wordpress-acf" / "fixture-theme"


class Ref001EducationGeometryRepairTests(unittest.TestCase):
    def test_pc_header_uses_only_the_two_supplied_rows(self) -> None:
        css = (THEME / "assets" / "css" / "ref001-education-geometry.css").read_text(encoding="utf-8")
        self.assertIn("grid-template-rows: repeat(2, 56px)", css)
        self.assertIn("height: 112px", css)
        self.assertIn("grid-row: 1 / span 2", css)
        self.assertIn("grid-row: 1", css)

    def test_repair_is_pc_only_so_sp_first_pass_is_untouched(self) -> None:
        css = (THEME / "assets" / "css" / "ref001-education-geometry.css").read_text(encoding="utf-8")
        self.assertIn("@media (min-width: 601px)", css)
        self.assertNotIn("max-width: 600px", css)

    def test_repair_is_enqueued_immediately_after_education_first_pass(self) -> None:
        functions = (THEME / "functions.php").read_text(encoding="utf-8")
        first_pass = functions.index("'education'     => 'ref001-education.css'")
        repair = functions.index("'education-geometry' => 'ref001-education-geometry.css'")
        cta = functions.index("'cta'           => 'ref001-cta.css'")
        self.assertLess(first_pass, repair)
        self.assertLess(repair, cta)


if __name__ == "__main__":
    unittest.main()
