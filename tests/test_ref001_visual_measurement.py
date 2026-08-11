from __future__ import annotations

import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PREVIEW = ROOT / "experiments" / "ref001-wordpress-acf" / "visual-preview"


class Ref001VisualMeasurementTests(unittest.TestCase):
    def test_measurement_covers_pc_sp_reference_frames(self) -> None:
        source = (PREVIEW / "measure.mjs").read_text(encoding="utf-8")
        self.assertIn("width: 1380", source)
        self.assertIn("fullHeight: 7714", source)
        self.assertIn("width: 375", source)
        self.assertIn("fullHeight: 10777", source)
        self.assertIn("40px iOS status bar", source)

    def test_measurement_covers_every_visual_section(self) -> None:
        source = (PREVIEW / "measure.mjs").read_text(encoding="utf-8")
        for key in (
            "header",
            "mv",
            "reason",
            "education",
            "cta_1",
            "student_voice",
            "messages",
            "cta_2",
            "courses",
            "links",
            "cta_value",
            "footer",
        ):
            self.assertRegex(source, rf"key: '{re.escape(key)}'")

    def test_measurement_uses_existing_figma_node_ids_not_fuzzy_classes_only(self) -> None:
        source = (PREVIEW / "measure.mjs").read_text(encoding="utf-8")
        for node_id in (
            "21378:8066",
            "21378:8032",
            "21378:7999",
            "21378:7868",
            "21378:7867",
            "21378:7766",
            "21378:7746",
            "21378:7730",
            "21378:7505",
            "21378:7458",
            "21378:7481",
            "21378:7457",
            "21376:4918",
            "21376:4886",
            "21376:4852",
            "21376:4720",
            "21376:4719",
            "21376:4650",
            "21376:4629",
            "21376:4628",
            "21376:4403",
            "21376:4919",
            "21376:4942",
            "21376:4402",
        ):
            self.assertIn(node_id, source)

    def test_repeated_ctas_are_measured_by_rendered_occurrence(self) -> None:
        source = (PREVIEW / "measure.mjs").read_text(encoding="utf-8")
        self.assertGreaterEqual(source.count("selector: '.ref001-cta'"), 4)
        self.assertGreaterEqual(source.count("index: 0"), 2)
        self.assertGreaterEqual(source.count("index: 1"), 2)
        self.assertIn("Repeated visual component measured by rendered occurrence", source)

    def test_measurement_script_does_not_modify_implementation(self) -> None:
        shell = (PREVIEW / "measure.sh").read_text(encoding="utf-8")
        self.assertIn("ref001-measure.json", shell)
        self.assertNotIn("git commit", shell)
        self.assertNotIn("git push", shell)


if __name__ == "__main__":
    unittest.main()
