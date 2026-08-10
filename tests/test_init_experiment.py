from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import yaml

import scripts.init_experiment as init


class InitExperimentTests(unittest.TestCase):
    def make_templates(self, root: Path) -> None:
        templates = root / "templates"
        templates.mkdir(parents=True)
        (templates / "reference-manifest.yaml").write_text(
            yaml.safe_dump(
                {
                    "schema_version": 2,
                    "reference_id": "REF-XXXX",
                    "status": "WAITING_FOR_REFERENCE",
                    "figma": {"file_url": "", "file_key": "", "node_ids": [], "captured_at": ""},
                    "frames": [],
                    "responsive": {
                        "invariants": [],
                        "transitions": [],
                        "ordering_rules": [],
                        "visibility_rules": [],
                        "wrapping_rules": [],
                        "container_rules": [],
                        "unknowns": [],
                    },
                    "code_baseline": {"repository": "", "base_branch": "", "starting_commit": "", "target_route": "", "framework": ""},
                    "freeze": {"ready": False, "frozen_at": "", "notes": ""},
                },
                sort_keys=False,
            ),
            encoding="utf-8",
        )
        (templates / "shared-contract.yaml").write_text(
            yaml.safe_dump(
                {
                    "schema_version": 5,
                    "contract_id": "CONTRACT-XXXX",
                    "reference_id": "REF-XXXX",
                    "status": "DRAFT",
                    "freeze": {"ready": False, "frozen_at": "", "notes": ""},
                },
                sort_keys=False,
            ),
            encoding="utf-8",
        )
        (templates / "figma-structure-profile.yaml").write_text(
            yaml.safe_dump(
                {
                    "schema_version": 3,
                    "reference_id": "REF-XXXX",
                    "captured_at": "",
                    "figma_tooling_snapshot": "",
                    "page": {"file_key": "", "page_or_frame_node_id": "", "auto_layout_generation": "UNKNOWN", "notes": []},
                    "sections": [],
                    "notes": [],
                },
                sort_keys=False,
            ),
            encoding="utf-8",
        )
        (templates / "section-manifest.yaml").write_text(
            yaml.safe_dump(
                {
                    "schema_version": 8,
                    "reference_id": "REF-XXXX",
                    "page_id": "",
                    "shared_contract": "",
                    "shared_contract_sha256": "",
                    "figma_structure_profile": "",
                    "figma_structure_profile_sha256": "",
                    "foundation_commit": "",
                    "sections": [],
                    "integration": {"root_composition_path": "", "required_checks": []},
                },
                sort_keys=False,
            ),
            encoding="utf-8",
        )

    def test_build_records_links_all_skeleton_paths(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.make_templates(root)
            with patch.object(init, "ROOT", root):
                records = init.build_records("EXP-1", "REF-1")

            expected = {
                root / "references/REF-1/reference.yaml",
                root / "contracts/EXP-1/shared-contract.yaml",
                root / "experiments/EXP-1/figma-structure-profile.yaml",
                root / "experiments/EXP-1/section-manifest.yaml",
            }
            self.assertEqual(set(records), expected)

            section = records[root / "experiments/EXP-1/section-manifest.yaml"]
            self.assertEqual(section["reference_id"], "REF-1")
            self.assertEqual(section["shared_contract"], "contracts/EXP-1/shared-contract.yaml")
            self.assertEqual(
                section["figma_structure_profile"],
                "experiments/EXP-1/figma-structure-profile.yaml",
            )
            self.assertEqual(section["sections"], [])
            self.assertEqual(section["foundation_commit"], "")

    def test_bootstrap_records_do_not_invent_design_values(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.make_templates(root)
            with patch.object(init, "ROOT", root):
                records = init.build_records("EXP-1", "REF-1")

            reference = records[root / "references/REF-1/reference.yaml"]
            self.assertEqual(reference["status"], "WAITING_FOR_REFERENCE")
            self.assertEqual(reference["frames"], [])
            self.assertFalse(reference["freeze"]["ready"])

            contract = records[root / "contracts/EXP-1/shared-contract.yaml"]
            self.assertEqual(contract["status"], "DRAFT")
            self.assertFalse(contract["freeze"]["ready"])

            profile = records[root / "experiments/EXP-1/figma-structure-profile.yaml"]
            self.assertEqual(profile["sections"], [])
            self.assertEqual(profile["captured_at"], "")

    def test_atomic_create_refuses_overwrite(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            target = root / "existing.yaml"
            target.write_text("old: true\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "refusing to overwrite"):
                init.atomic_create_yaml(target, {"new": True})
            self.assertEqual(target.read_text(encoding="utf-8"), "old: true\n")


if __name__ == "__main__":
    unittest.main()
