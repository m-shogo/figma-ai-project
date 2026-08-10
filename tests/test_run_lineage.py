from __future__ import annotations

import hashlib
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import yaml

import scripts.validate_run_lineage as lineage


def write_yaml(root: Path, relative: str, data: dict) -> str:
    path = root / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
    return hashlib.sha256(path.read_bytes()).hexdigest()


def base_run(reference_hash: str, manifest_hash: str) -> dict:
    return {
        "status": "RUNNING",
        "reference": {
            "reference_id": "REF-1",
            "manifest_path": "references/ref/reference.yaml",
            "manifest_sha256": reference_hash,
        },
        "coordination": {
            "scope": "SECTION",
            "section_id": "S01",
            "parallel_group": "wave-01",
            "shared_contract_sha256": "contract-hash",
            "section_manifest_path": "experiments/exp/section-manifest.yaml",
            "section_manifest_sha256": manifest_hash,
            "foundation_commit": "foundation-commit",
            "isolation_mode": "BRANCH_WORKTREE",
            "isolation_ref": "worktree-s01",
        },
    }


def section_manifest() -> dict:
    return {
        "reference_id": "REF-1",
        "shared_contract_sha256": "contract-hash",
        "foundation_commit": "foundation-commit",
        "sections": [
            {
                "section_id": "S01",
                "worker": {
                    "parallel_group": "wave-01",
                    "contract_sha256": "contract-hash",
                    "isolation": {
                        "mode": "BRANCH_WORKTREE",
                        "ref": "worktree-s01",
                    },
                },
            }
        ],
    }


class RunLineageTests(unittest.TestCase):
    def make_fixture(self, root: Path) -> tuple[dict, Path, Path]:
        reference_path = root / "references/ref/reference.yaml"
        reference_hash = write_yaml(
            root,
            "references/ref/reference.yaml",
            {"reference_id": "REF-1"},
        )
        manifest_path = root / "experiments/exp/section-manifest.yaml"
        manifest_hash = write_yaml(
            root,
            "experiments/exp/section-manifest.yaml",
            section_manifest(),
        )
        return base_run(reference_hash, manifest_hash), reference_path, manifest_path

    def validate(self, root: Path, run: dict) -> list[str]:
        with patch.object(lineage, "ROOT", root):
            return lineage.validate_run(run)

    def test_valid_section_run_lineage_passes(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            run, _, _ = self.make_fixture(root)
            self.assertEqual([], self.validate(root, run))

    def test_reference_manifest_hash_drift_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            run, reference_path, _ = self.make_fixture(root)
            reference_path.write_text("reference_id: REF-1\nchanged: true\n", encoding="utf-8")
            errors = self.validate(root, run)
            self.assertTrue(any("reference manifest sha256 mismatch" in error for error in errors))

    def test_section_manifest_hash_drift_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            run, _, manifest_path = self.make_fixture(root)
            data = yaml.safe_load(manifest_path.read_text(encoding="utf-8"))
            data["sections"][0]["worker"]["parallel_group"] = "changed-wave"
            manifest_path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
            errors = self.validate(root, run)
            self.assertTrue(any("section manifest sha256 mismatch" in error for error in errors))

    def test_worker_contract_hash_must_match_run(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            run, _, manifest_path = self.make_fixture(root)
            data = yaml.safe_load(manifest_path.read_text(encoding="utf-8"))
            data["sections"][0]["worker"]["contract_sha256"] = "stale-contract"
            new_hash = hashlib.sha256(
                yaml.safe_dump(data, sort_keys=False).encode("utf-8")
            ).hexdigest()
            manifest_path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
            run["coordination"]["section_manifest_sha256"] = new_hash
            errors = self.validate(root, run)
            self.assertTrue(any("worker contract_sha256" in error for error in errors))

    def test_isolation_identity_must_match_manifest(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            run, _, _ = self.make_fixture(root)
            run["coordination"]["isolation_ref"] = "different-worktree"
            errors = self.validate(root, run)
            self.assertTrue(any("isolation_ref" in error for error in errors))

    def test_parallel_group_must_match_manifest(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            run, _, _ = self.make_fixture(root)
            run["coordination"]["parallel_group"] = "wave-02"
            errors = self.validate(root, run)
            self.assertTrue(any("parallel_group" in error for error in errors))

    def test_page_benchmark_only_requires_frozen_reference_lineage(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            reference_hash = write_yaml(
                root,
                "references/ref/reference.yaml",
                {"reference_id": "REF-1"},
            )
            run = {
                "status": "RUNNING",
                "reference": {
                    "reference_id": "REF-1",
                    "manifest_path": "references/ref/reference.yaml",
                    "manifest_sha256": reference_hash,
                },
                "coordination": {"scope": "PAGE_BENCHMARK"},
            }
            self.assertEqual([], self.validate(root, run))


if __name__ == "__main__":
    unittest.main()
