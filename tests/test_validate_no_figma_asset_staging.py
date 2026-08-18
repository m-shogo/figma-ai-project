from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import validate_no_figma_asset_staging as validator  # noqa: E402


class FigmaAssetStagingHygieneTests(unittest.TestCase):
    def test_clean_tree_passes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            self.assertEqual([], validator.validate(Path(tmp).resolve()))

    def test_chunk_staging_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            path = root / "tmp" / "ref001-plugin-asset" / "chunks"
            path.mkdir(parents=True)
            (path / "0001.b64").write_text("AAAA", encoding="ascii")
            errors = validator.validate(root)
            self.assertTrue(any("tmp/ref001-plugin-asset" in error for error in errors))

    def test_one_shot_workflow_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            path = root / ".github" / "workflows" / "ref001-rendered-asset-materialize.yml"
            path.parent.mkdir(parents=True)
            path.write_text("name: temporary\n", encoding="utf-8")
            errors = validator.validate(root)
            self.assertTrue(any("ref001-rendered-asset-materialize.yml" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
