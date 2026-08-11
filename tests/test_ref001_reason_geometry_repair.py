from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
THEME = ROOT / "experiments" / "ref001-wordpress-acf" / "fixture-theme"


class Ref001ReasonGeometryRepairTests(unittest.TestCase):
    def test_repair_moves_pc_whitespace_outside_reason_box(self) -> None:
        css = (THEME / "assets" / "css" / "ref001-reason-geometry.css").read_text(encoding="utf-8")
        self.assertIn("height: 559px", css)
        self.assertIn("margin: 78px auto 96px", css)
        self.assertIn("margin-bottom: 30px", css)

    def test_repair_preserves_supplied_sp_endpoint_geometry(self) -> None:
        css = (THEME / "assets" / "css" / "ref001-reason-geometry.css").read_text(encoding="utf-8")
        self.assertIn("height: 1295px", css)
        self.assertIn("margin: 56px auto", css)
        self.assertIn("padding: 40px 0 0", css)
        self.assertIn("margin-bottom: 36px", css)

    def test_repair_is_enqueued_after_baseline(self) -> None:
        functions = (THEME / "functions.php").read_text(encoding="utf-8")
        base = functions.index("get_theme_file_uri( 'assets/css/ref001.css' )")
        repair = functions.index("'reason-geometry' => 'ref001-reason-geometry.css'")
        self.assertLess(base, repair)


if __name__ == "__main__":
    unittest.main()
