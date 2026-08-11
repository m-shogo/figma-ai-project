from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import validate_ref001_mv_cta_vectors as validator  # noqa: E402


class Ref001MvCtaVectorTests(unittest.TestCase):
    def test_repository_mv_cta_vectors_pass(self) -> None:
        self.assertEqual([], validator.validate())

    def test_exact_mv_cta_asset_set_is_complete(self) -> None:
        self.assertEqual(
            {
                "mv-oc-note-back.svg",
                "mv-oc-note-front.svg",
                "mv-oc-arrow-pc.svg",
                "mv-oc-arrow-sp.svg",
            },
            set(validator.EXPECTED),
        )


if __name__ == "__main__":
    unittest.main()
