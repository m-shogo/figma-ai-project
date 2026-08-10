from __future__ import annotations

import hashlib
import sys
import tempfile
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from prepare_section_execution import prepare_manifest  # noqa: E402


def write_yaml(root: Path, relative: str, data: dict) -> Path:
    path = root / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
    return path


def contract(reference_id: str = "REF-1", frozen: bool = True) -> dict:
    return {
        "reference_id": reference_id,
        "status": "FROZEN" if frozen else "DRAFT",
        "freeze": {"ready": frozen},
        "foundation": {
            "status": "VERIFIED" if frozen else "BUILT",
            "commit": "foundation-123" if frozen else "",
        },
    }


def profile(reference_id: str = "REF-1") -> dict:
    return {"reference_id": reference_id, "sections": []}


def section(section_id: str, order: int, path: str) -> dict:
    return {
        "section_id": section_id,
        "order": order,
        "figma": {
            "boundary_confidence": "HIGH",
            "pc_sp_mapping_confidence": "HIGH",
        },
        "dependencies": {
            "section_ids": [],
            "integration_coupling": "LOW",
        },
        "implementation": {"allowed_paths": [path]},
        "worker": {
            "status": "PLANNED",
            "parallel_group": "",
            "contract_sha256": "",
            "base_commit": "",
        },
    }


def manifest() -> dict:
    return {
        "reference_id": "REF-1",
        "shared_contract": "contracts/shared-contract.yaml",
        "figma_structure_profile": "profiles/figma-structure-profile.yaml",
        "sections": [
            section("S01", 10, "src/sections/Header"),
            section("S02", 20, "src/sections/Hero"),
        ],
    }


class PrepareSectionExecutionTests(unittest.TestCase):
    def fixture(self, root: Path) -> tuple[Path, Path, Path]:
        contract_path = write_yaml(root, "contracts/shared-contract.yaml", contract())
        profile_path = write_yaml(root, "profiles/figma-structure-profile.yaml", profile())
        manifest_path = write_yaml(root, "experiments/exp/section-manifest.yaml", manifest())
        return manifest_path, contract_path, profile_path

    def test_prepares_hashes_foundation_and_safe_wave_groups(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            manifest_path, contract_path, profile_path = self.fixture(root)
            prepared, plan = prepare_manifest(manifest_path, root=root)

            contract_hash = hashlib.sha256(contract_path.read_bytes()).hexdigest()
            profile_hash = hashlib.sha256(profile_path.read_bytes()).hexdigest()
            self.assertEqual(prepared["shared_contract_sha256"], contract_hash)
            self.assertEqual(prepared["figma_structure_profile_sha256"], profile_hash)
            self.assertEqual(prepared["foundation_commit"], "foundation-123")
            self.assertEqual(plan["waves"][0]["sections"], ["S01", "S02"])

            for item in prepared["sections"]:
                self.assertEqual(item["worker"]["contract_sha256"], contract_hash)
                self.assertEqual(item["worker"]["base_commit"], "foundation-123")
                self.assertEqual(item["worker"]["parallel_group"], "wave-01")

    def test_prepare_is_dry_run_and_does_not_write_manifest(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            manifest_path, _, _ = self.fixture(root)
            before = manifest_path.read_text(encoding="utf-8")
            prepare_manifest(manifest_path, root=root)
            self.assertEqual(before, manifest_path.read_text(encoding="utf-8"))

    def test_non_frozen_contract_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            manifest_path, contract_path, _ = self.fixture(root)
            contract_path.write_text(yaml.safe_dump(contract(frozen=False)), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "must be FROZEN"):
                prepare_manifest(manifest_path, root=root)

    def test_reference_mismatch_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            manifest_path, _, profile_path = self.fixture(root)
            profile_path.write_text(yaml.safe_dump(profile("REF-OTHER")), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "Profile reference_id does not match"):
                prepare_manifest(manifest_path, root=root)

    def test_active_worker_cannot_be_silently_repinned_to_new_contract(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            manifest_path, _, _ = self.fixture(root)
            data = yaml.safe_load(manifest_path.read_text(encoding="utf-8"))
            data["sections"][0]["worker"].update(
                {
                    "status": "READY",
                    "contract_sha256": "old-contract",
                    "base_commit": "foundation-123",
                    "parallel_group": "wave-01",
                }
            )
            manifest_path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "pinned to a different Shared Contract"):
                prepare_manifest(manifest_path, root=root)

    def test_active_worker_group_is_not_rewritten_if_planner_changes(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            manifest_path, contract_path, _ = self.fixture(root)
            current_hash = hashlib.sha256(contract_path.read_bytes()).hexdigest()
            data = yaml.safe_load(manifest_path.read_text(encoding="utf-8"))
            first = data["sections"][0]
            first["worker"].update(
                {
                    "status": "READY",
                    "contract_sha256": current_hash,
                    "base_commit": "foundation-123",
                    "parallel_group": "legacy-wave",
                }
            )
            manifest_path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "Do not rewrite an active worker group"):
                prepare_manifest(manifest_path, root=root)


if __name__ == "__main__":
    unittest.main()
