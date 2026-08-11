from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
THEME = ROOT / "experiments" / "ref001-wordpress-acf" / "fixture-theme"
CSS = THEME / "assets" / "css" / "ref001-student-voice-profile-fidelity.css"


class Ref001StudentVoiceMobileProfileFidelityTests(unittest.TestCase):
    def test_repair_loads_after_student_voice_base_css(self) -> None:
        functions = (THEME / "functions.php").read_text(encoding="utf-8")
        base = functions.index("'student-voice' => 'ref001-student-voice.css'")
        repair = functions.index(
            "'student-voice-profile-fidelity' => 'ref001-student-voice-profile-fidelity.css'"
        )
        messages = functions.index("'messages'      => 'ref001-messages.css'")
        self.assertLess(base, repair)
        self.assertLess(repair, messages)

    def test_sp_profile_uses_supplied_independent_text_column(self) -> None:
        css = CSS.read_text(encoding="utf-8")
        self.assertIn("@media (max-width: 767px)", css)
        self.assertIn("left: -60px", css)
        self.assertIn("width: min(240px, calc(100% + 76px))", css)
        self.assertIn("font-size: 14px", css)
        self.assertIn("line-height: 1.6", css)

    def test_open_and_closed_states_preserve_figma_vertical_offsets(self) -> None:
        css = CSS.read_text(encoding="utf-8")
        self.assertIn(
            ".ref001-student-voice__item--open .ref001-student-voice__bubble p",
            css,
        )
        self.assertIn("top: 99px", css)
        self.assertIn(
            ".ref001-student-voice__item--closed .ref001-student-voice__bubble p",
            css,
        )
        self.assertIn("top: 78px", css)


if __name__ == "__main__":
    unittest.main()
