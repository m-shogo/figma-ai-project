from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import validate_ref001_mv_typography as validator  # noqa: E402


class Ref001MvTypographyTests(unittest.TestCase):
    def test_repository_mv_typography_passes(self) -> None:
        self.assertEqual([], validator.validate())


if __name__ == "__main__":
    unittest.main()
