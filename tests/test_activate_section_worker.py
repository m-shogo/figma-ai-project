from __future__ import annotations

import hashlib
import sys
import tempfile
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from activate_section_worker import activate  # noqa: E402


def write_yaml(root: Path, relative: str, data: dict) -> Path:
    path = root / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
    return path


def section(section_id: str, order: int, path: str, *, depends_on: list[str] | None = None) -> dict:
    return {
        "section_id": section_id,
        "order": order,
        "figma": {
            "boundary_confidence": "HIGH",
            "pc_sp_mapping_confidence": "HIGH",
        },
        "dependencies": {
            "section_ids": depends_on or [],
            "integration_coupling": "LOW",
        },
        "implementation": {"allowed_paths": [path]},
        "worker": {
            "status": "PLANNED",
            "parallel_group": "",
            "contract_sha256": "",
            "base_commit": "",
            "isolation": {
                "mode": "UNASSIGNED",
                "ref": "",
                "parallel_safe": False,
                "notes": [],
            },
            "agent": "",
            "model": "",
        },
    }


def fixture(root: Path, sections: list[dict]) -> Path:
    write_yaml(
        root,
        "contracts/shared-contract.yaml",
        {
            "reference_id": "REF-1",
            "status": "FROZEN",
            "freeze": {"ready": True},
            "foundation": {"status": "VERIFIED", "commit": "foundation-123"},
        },
    )
    write_yaml(
        root,
        "profiles/figma-structure-profile.yaml",
        {"reference_id": "REF-1", "sections": []},
    )
    return write_yaml(
        root,
        "experiments/exp/section-manifest.yaml",
        {
            "reference_id": "REF-1",
            "shared_contract": "contracts/shared-contract.yaml",
            "figma_structure_profile": "profiles/figma-structure-profile.yaml",
            "sections": sections,
        },
    )


class ActivateSectionWorkerTests(unittest.TestCase):
    def test_parallel_wave_accepts_worktree_isolation(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            manifest = fixture(
                root,
                [
                    section("S01", 10, "src/sections/Header"),
                    section("S02", 20, "src/sections/Hero"),
                ],
            )
            prepared, wave = activate(
                manifest,
                root=root,
                section_id="S01",
                mode="BRANCH_WORKTREE",
                isolation_ref="worktree-S01",
                agent="codex",
                model="current",
            )
            worker = prepared["sections"][0]["worker"]
            self.assertEqual(worker["status"], "READY")
            self.assertEqual(worker["parallel_group"], "wave-01")
            self.assertEqual(worker["isolation"]["mode"], "BRANCH_WORKTREE")
            self.assertEqual(wave["sections"], ["S01", "S02"])

    def test_singleton_wave_allows_serial_shared_tree(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            manifest = fixture(root, [section("S01", 10, "src/sections/Header")])
            prepared, wave = activate(
                manifest,
                root=root,
                section_id="S01",
                mode="SERIAL_SHARED_TREE",
                isolation_ref="main-working-tree",
            )
            self.assertEqual(wave["sections"], ["S01"])
            isolation = prepared["sections"][0]["worker"]["isolation"]
            self.assertEqual(isolation["mode"], "SERIAL_SHARED_TREE")
            self.assertFalse(isolation["parallel_safe"])

    def test_parallel_wave_rejects_serial_shared_tree(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            manifest = fixture(
                root,
                [
                    section("S01", 10, "src/sections/Header"),
                    section("S02", 20, "src/sections/Hero"),
                ],
            )
            with self.assertRaisesRegex(ValueError, "singleton planner wave"):
                activate(
                    manifest,
                    root=root,
                    section_id="S01",
                    mode="SERIAL_SHARED_TREE",
                    isolation_ref="main-working-tree",
                )

    def test_dependency_can_create_singleton_serial_wave(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            manifest = fixture(
                root,
                [
                    section("S01", 10, "src/a"),
                    section("S02", 20, "src/b", depends_on=["S01"]),
                ],
            )
            prepared, wave = activate(
                manifest,
                root=root,
                section_id="S01",
                mode="SERIAL_SHARED_TREE",
                isolation_ref="main-working-tree",
            )
            self.assertEqual(wave["sections"], ["S01"])
            self.assertEqual(prepared["sections"][0]["worker"]["status"], "READY")

    def test_other_isolation_requires_safety_notes(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            manifest = fixture(root, [section("S01", 10, "src/a")])
            with self.assertRaisesRegex(ValueError, "requires explicit safety notes"):
                activate(
                    manifest,
                    root=root,
                    section_id="S01",
                    mode="OTHER",
                    isolation_ref="custom-1",
                    notes=[],
                )

    def test_ready_worker_identity_is_immutable(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            manifest = fixture(root, [section("S01", 10, "src/a")])
            data = yaml.safe_load(manifest.read_text(encoding="utf-8"))
            contract_path = root / data["shared_contract"]
            contract_hash = hashlib.sha256(contract_path.read_bytes()).hexdigest()
            worker = data["sections"][0]["worker"]
            worker["status"] = "READY"
            worker["contract_sha256"] = contract_hash
            worker["base_commit"] = "foundation-123"
            worker["parallel_group"] = "wave-01"
            manifest.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "already READY"):
                activate(
                    manifest,
                    root=root,
                    section_id="S01",
                    mode="BRANCH_WORKTREE",
                    isolation_ref="new-ref",
                )


if __name__ == "__main__":
    unittest.main()
