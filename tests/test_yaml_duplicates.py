from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from scripts.validate_yaml_duplicates import validate_file


class YamlDuplicateKeyTests(unittest.TestCase):
    def test_unique_mapping_passes(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "valid.yaml"
            path.write_text("root:\n  a: 1\n  b: 2\n", encoding="utf-8")
            self.assertEqual([], validate_file(path))

    def test_duplicate_mapping_key_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "invalid.yaml"
            path.write_text("root:\n  a: 1\n  a: 2\n", encoding="utf-8")
            errors = validate_file(path)
            self.assertTrue(any("duplicate key" in error for error in errors))

    def test_nested_duplicate_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "nested.yaml"
            path.write_text(
                "root:\n  child:\n    policy: first\n    policy: second\n",
                encoding="utf-8",
            )
            errors = validate_file(path)
            self.assertTrue(any("duplicate key" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
