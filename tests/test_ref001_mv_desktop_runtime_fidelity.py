from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
THEME = ROOT / "experiments" / "ref001-wordpress-acf" / "fixture-theme"
BASE = THEME / "assets" / "css" / "ref001-mv-type.css"
FLUID = THEME / "assets" / "css" / "ref001-mv-desktop-fluid.css"


class Ref001MvDesktopRuntimeFidelityTests(unittest.TestCase):
    def test_runtime_repair_loads_after_exact_endpoint_typography(self) -> None:
        functions = (THEME / "functions.php").read_text(encoding="utf-8")
        exact = functions.index("'mv-type'       => 'ref001-mv-type.css'")
        fluid = functions.index("'mv-desktop-fluid' => 'ref001-mv-desktop-fluid.css'")
        header = functions.index("'header'        => 'ref001-header.css'")
        self.assertLess(exact, fluid)
        self.assertLess(fluid, header)

    def test_desktop_x_positions_are_center_relative_from_768_up(self) -> None:
        css = FLUID.read_text(encoding="utf-8")
        self.assertIn("@media (min-width: 768px)", css)
        expected = {
            ".ref001-mv__quote--open": -219,
            ".ref001-mv__quote--close": 140,
            ".ref001-mv__economy": -171,
            ".ref001-mv__surprise": -187,
            ".ref001-mv__fun": -194,
            ".ref001-mv__lead": -209,
        }
        for selector, offset in expected.items():
            sign = "+" if offset >= 0 else "-"
            magnitude = abs(offset)
            block = css.split(f"{selector} {{", 1)[1].split("}", 1)[0]
            self.assertIn(f"left: calc(50% {sign} {magnitude}px)", block)

    def test_center_translation_preserves_exact_1380_figma_x_coordinates(self) -> None:
        endpoint_center = 1380 / 2
        expected = {
            -219: 471,
            140: 830,
            -171: 519,
            -187: 503,
            -194: 496,
            -209: 481,
        }
        for offset, figma_x in expected.items():
            self.assertEqual(figma_x, endpoint_center + offset)

    def test_runtime_repair_changes_only_horizontal_positioning(self) -> None:
        css = FLUID.read_text(encoding="utf-8")
        declarations = [line.strip() for line in css.splitlines() if ":" in line and not line.lstrip().startswith("/*")]
        for forbidden_property in (
            "top:",
            "width:",
            "height:",
            "font-size:",
            "font-weight:",
            "line-height:",
            "letter-spacing:",
            "transform:",
        ):
            self.assertFalse(any(line.startswith(forbidden_property) for line in declarations), forbidden_property)

        exact = BASE.read_text(encoding="utf-8")
        for token in ("left: 471px", "left: 830px", "left: 519px", "left: 503px", "left: 496px", "left: 481px"):
            self.assertIn(token, exact)


if __name__ == "__main__":
    unittest.main()
