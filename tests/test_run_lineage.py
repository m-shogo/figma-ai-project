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


def structure_profile() -> dict:
    return {
        "reference_id": "REF-1",
        "sections": [
            {
                "section_id": "S01",
                "recommended_translation_mode": "HYBRID",
            }
        ],
    }


def shared_contract() -> dict:
    return {
        "reference_id": "REF-1",
        "foundation": {"commit": "foundation-commit"},
    }


def section_manifest(contract_hash: str, profile_hash: str) -> dict:
    return {
        "reference_id": "REF-1",
        "shared_contract_sha256": contract_hash,
        "figma_structure_profile": "experiments/exp/figma-structure-profile.yaml",
        "figma_structure_profile_sha256": profile_hash,
        "foundation_commit": "foundation-commit",
        "sections": [
            {
                "section_id": "S01",
                "worker": {
                    "parallel_group": "wave-01",
                    "contract_sha256": contract_hash,
                    "isolation": {
                        "mode": "BRANCH_WORKTREE",
                        "ref": "worktree-s01",
                    },
                },
            }
        ],
    }


def base_run(
    reference_hash: str,
    contract_hash: str,
    manifest_hash: str,
    profile_hash: str,
) -> dict:
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
            "shared_contract_path": "contracts/shared-contract.yaml",
            "shared_contract_sha256": contract_hash,
            "section_manifest_path": "experiments/exp/section-manifest.yaml",
            "section_manifest_sha256": manifest_hash,
            "figma_structure_profile_path": "experiments/exp/figma-structure-profile.yaml",
            "figma_structure_profile_sha256": profile_hash,
            "foundation_commit": "foundation-commit",
            "isolation_mode": "BRANCH_WORKTREE",
            "isolation_ref": "worktree-s01",
        },
    }


class RunLineageTests(unittest.TestCase):
    def make_fixture(self, root: Path) -> tuple[dict, dict[str, Path]]:
        reference_path = root / "references/ref/reference.yaml"
        reference_hash = write_yaml(
            root,
            "references/ref/reference.yaml",
            {"reference_id": "REF-1"},
        )

        contract_path = root / "contracts/shared-contract.yaml"
        contract_hash = write_yaml(
            root,
            "contracts/shared-contract.yaml",
            shared_contract(),
        )

        profile_path = root / "experiments/exp/figma-structure-profile.yaml"
        profile_hash = write_yaml(
            root,
            "experiments/exp/figma-structure-profile.yaml",
            structure_profile(),
        )

        manifest_path = root / "experiments/exp/section-manifest.yaml"
        manifest_hash = write_yaml(
            root,
            "experiments/exp/section-manifest.yaml",
            section_manifest(contract_hash, profile_hash),
        )

        run = base_run(reference_hash, contract_hash, manifest_hash, profile_hash)
        return run, {
            "reference": reference_path,
            "contract": contract_path,
            "profile": profile_path,
            "manifest": manifest_path,
        }

    def validate(self, root: Path, run: dict) -> list[str]:
        with patch.object(lineage, "ROOT", root):
            return lineage.validate_run(run)

    def test_valid_section_run_lineage_passes(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            run, _ = self.make_fixture(root)
            self.assertEqual([], self.validate(root, run))

    def test_reference_manifest_hash_drift_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            run, paths = self.make_fixture(root)
            paths["reference"].write_text("reference_id: REF-1\nchanged: true\n", encoding="utf-8")
            errors = self.validate(root, run)
            self.assertTrue(any("reference manifest sha256 mismatch" in error for error in errors))

    def test_shared_contract_hash_drift_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            run, paths = self.make_fixture(root)
            paths["contract"].write_text(
                "reference_id: REF-1\nfoundation:\n  commit: changed\n",
                encoding="utf-8",
            )
            errors = self.validate(root, run)
            self.assertTrue(any("shared contract sha256 mismatch" in error for error in errors))

    def test_section_manifest_hash_drift_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            run, paths = self.make_fixture(root)
            data = yaml.safe_load(paths["manifest"].read_text(encoding="utf-8"))
            data["sections"][0]["worker"]["parallel_group"] = "changed-wave"
            paths["manifest"].write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
            errors = self.validate(root, run)
            self.assertTrue(any("section manifest sha256 mismatch" in error for error in errors))

    def test_structure_profile_hash_drift_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            run, paths = self.make_fixture(root)
            data = yaml.safe_load(paths["profile"].read_text(encoding="utf-8"))
            data["sections"][0]["recommended_translation_mode"] = "STRUCTURE_FIRST"
            paths["profile"].write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
            errors = self.validate(root, run)
            self.assertTrue(any("Figma Structure Profile sha256 mismatch" in error for error in errors))

    def test_worker_contract_hash_must_match_run(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            run, paths = self.make_fixture(root)
            data = yaml.safe_load(paths["manifest"].read_text(encoding="utf-8"))
            data["sections"][0]["worker"]["contract_sha256"] = "stale-contract"
            paths["manifest"].write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
            run["coordination"]["section_manifest_sha256"] = hashlib.sha256(
                paths["manifest"].read_bytes()
            ).hexdigest()
            errors = self.validate(root, run)
            self.assertTrue(any("worker contract_sha256" in error for error in errors))

    def test_run_profile_hash_must_match_manifest(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            run, _ = self.make_fixture(root)
            run["coordination"]["figma_structure_profile_sha256"] = "wrong"
            errors = self.validate(root, run)
            self.assertTrue(
                any("Figma Structure Profile" in error or "profile hash" in error for error in errors),
                errors,
            )

    def test_isolation_identity_must_match_manifest(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            run, _ = self.make_fixture(root)
            run["coordination"]["isolation_ref"] = "different-worktree"
            errors = self.validate(root, run)
            self.assertTrue(any("isolation_ref" in error for error in errors))

    def test_parallel_group_must_match_manifest(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            run, _ = self.make_fixture(root)
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
