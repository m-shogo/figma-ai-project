from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import validate_ref001_asset_map as validator  # noqa: E402


class Ref001AssetMapTests(unittest.TestCase):
    def test_current_asset_map_is_structurally_safe_during_incremental_materialization(self) -> None:
        errors, counts = validator.validate(validator.DEFAULT_MAP)
        self.assertEqual([], errors)
        self.assertEqual(32, counts["total"])
        self.assertEqual(32, counts["rendered"] + counts["dummy"])

    def test_complete_mode_rejects_any_remaining_dummy(self) -> None:
        errors, counts = validator.validate(validator.DEFAULT_MAP, require_complete=True)
        if counts["dummy"]:
            self.assertTrue(any("dummy remains" in error for error in errors))
        else:
            self.assertEqual([], errors)


if __name__ == "__main__":
    unittest.main()
