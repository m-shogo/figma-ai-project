from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
THEME = ROOT / "experiments" / "ref001-wordpress-acf" / "fixture-theme"


class Ref001LowerGeometryRepairTests(unittest.TestCase):
    def test_pc_uses_two_supplied_72px_gaps(self) -> None:
        css = (THEME / "assets" / "css" / "ref001-lower-geometry.css").read_text(encoding="utf-8")
        self.assertIn(".ref001-courses + .ref001-links", css)
        self.assertIn(".ref001-links + .ref001-cta-value", css)
        self.assertIn("margin-top: 72px", css)

    def test_sp_uses_two_supplied_56px_gaps_at_owner_resolved_boundary(self) -> None:
        css = (THEME / "assets" / "css" / "ref001-lower-geometry.css").read_text(encoding="utf-8")
        self.assertIn("@media (max-width: 767px)", css)
        self.assertNotIn("@media (max-width: 600px)", css)
        self.assertIn("margin-top: 56px", css)

    def test_lower_repair_loads_after_link_and_cta_value_first_pass_styles(self) -> None:
        functions = (THEME / "functions.php").read_text(encoding="utf-8")
        links = functions.index("'links'         => 'ref001-links.css'")
        cta_value = functions.index("'cta-value'     => 'ref001-cta-value.css'")
        repair = functions.index("'lower-geometry' => 'ref001-lower-geometry.css'")
        footer = functions.index("'footer'        => 'ref001-footer.css'")
        self.assertLess(links, repair)
        self.assertLess(cta_value, repair)
        self.assertLess(repair, footer)


if __name__ == "__main__":
    unittest.main()
