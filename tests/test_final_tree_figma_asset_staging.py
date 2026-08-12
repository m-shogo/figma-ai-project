from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import validate_no_figma_asset_staging as validator  # noqa: E402


class FinalTreeFigmaAssetStagingTests(unittest.TestCase):
    def test_repository_final_tree_contains_no_temporary_asset_staging(self) -> None:
        self.assertEqual([], validator.validate(ROOT))


if __name__ == "__main__":
    unittest.main()
