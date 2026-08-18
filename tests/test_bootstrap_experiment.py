from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

import yaml

from scripts.bootstrap_experiment import bootstrap


def load(path: Path) -> dict:
    return yaml.safe_load(path.read_text(encoding="utf-8"))


class BootstrapExperimentTests(unittest.TestCase):
    def test_bootstrap_creates_expected_bundle_without_design_guesses(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            target = bootstrap("EXP-TEST", "REF-TEST", destination_root=root)

            self.assertTrue((target / "reference.yaml").is_file())
            self.assertTrue((target / "shared-contract.yaml").is_file())
            self.assertTrue((target / "section-manifest.yaml").is_file())
            self.assertTrue((target / "figma-structure-profile.yaml").is_file())
            self.assertTrue((target / "runs").is_dir())
            self.assertTrue((target / "artifacts").is_dir())

            reference = load(target / "reference.yaml")
            self.assertEqual("REF-TEST", reference["reference_id"])
            self.assertEqual("WAITING_FOR_REFERENCE", reference["status"])
            self.assertEqual([], reference["frames"])

            contract = load(target / "shared-contract.yaml")
            self.assertEqual("REF-TEST", contract["reference_id"])
            self.assertEqual("DRAFT", contract["status"])
            self.assertFalse(contract["freeze"]["ready"])
            self.assertEqual("GLOBAL_SPECIFIED", contract["breakpoints"]["mode"])
            self.assertEqual("UNKNOWN", contract["breakpoints"]["source"])
            self.assertEqual([], contract["breakpoints"]["values"])

            sections = load(target / "section-manifest.yaml")
            self.assertEqual("REF-TEST", sections["reference_id"])
            self.assertEqual([], sections["sections"])
            self.assertEqual("", sections["foundation_commit"])

            profile = load(target / "figma-structure-profile.yaml")
            self.assertEqual("REF-TEST", profile["reference_id"])
            self.assertEqual([], profile["sections"])

    def test_existing_experiment_is_never_overwritten(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            bootstrap("EXP-TEST", "REF-1", destination_root=root)
            with self.assertRaises(FileExistsError):
                bootstrap("EXP-TEST", "REF-2", destination_root=root)

    def test_invalid_experiment_identifier_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(ValueError):
                bootstrap("../escape", "REF-1", destination_root=Path(directory).resolve())

    def test_readme_keeps_design_values_external(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            target = bootstrap("EXP-TEST", "REF-TEST", destination_root=Path(directory).resolve())
            text = (target / "README.md").read_text(encoding="utf-8")
            self.assertIn("no invented design values", text)
            self.assertIn("real Figma/codebase evidence", text)


if __name__ == "__main__":
    unittest.main()