from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import validate_ref001_mv_vectors as validator  # noqa: E402


class Ref001MvVectorTests(unittest.TestCase):
    def test_repository_mv_vectors_pass(self) -> None:
        self.assertEqual([], validator.validate())

    def test_exact_endpoint_asset_set_is_complete(self) -> None:
        self.assertEqual(
            {
                "mv-cyan-pc.svg",
                "mv-lavender-pc.svg",
                "mv-cyan-sp.svg",
                "mv-lavender-sp.svg",
            },
            set(validator.EXPECTED),
        )


if __name__ == "__main__":
    unittest.main()
