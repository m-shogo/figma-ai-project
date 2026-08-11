from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import validate_ref001_course_icons as validator  # noqa: E402


class Ref001CourseIconTests(unittest.TestCase):
    def test_repository_exact_course_icons_pass(self) -> None:
        self.assertEqual([], validator.validate())

    def test_expected_set_is_exactly_seven_course_assets(self) -> None:
        self.assertEqual(
            {
                "public-service.svg",
                "accounting.svg",
                "business-management.svg",
                "finance.svg",
                "teaching.svg",
                "curator.svg",
                "it.svg",
            },
            set(validator.EXPECTED),
        )


if __name__ == "__main__":
    unittest.main()
