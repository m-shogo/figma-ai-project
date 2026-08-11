from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import validate_ref001_reason_geometry as validator  # noqa: E402


class Ref001ReasonGeometryTests(unittest.TestCase):
    def test_repository_reason_geometry_passes(self) -> None:
        self.assertEqual([], validator.validate())


if __name__ == "__main__":
    unittest.main()
