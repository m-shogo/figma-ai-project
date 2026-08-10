from __future__ import annotations

import hashlib
import sys
import tempfile
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from create_section_run import build_run_record  # noqa: E402


def write_yaml(root: Path, relative: str, data: dict) -> Path:
    path = root / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
    return path


def fixture(
    root: Path,
    *,
    worker_status: str = "READY",
    isolation_mode: str = "BRANCH_WORKTREE",
    bind_company: bool = False,
) -> tuple[Path, Path, Path, Path, Path]:
    reference_path = write_yaml(
        root,
        "references/ref/reference.yaml",
        {
            "reference_id": "REF-1",
            "code_baseline": {
                "repository": "m-shogo/example",
                "target_route": "/demo",
            },
        },
    )

    contract: dict = {
        "reference_id": "REF-1",
        "status": "FROZEN",
        "freeze": {"ready": True},
        "foundation": {"status": "VERIFIED", "commit": "foundation-123"},
    }
    if bind_company:
        policy_path = write_yaml(
            root,
            "policies/company-policy.yaml",
            {
                "policy_id": "POLICY-1",
                "status": "ACTIVE",
            },
        )
        policy_hash = hashlib.sha256(policy_path.read_bytes()).hexdigest()
        contract["company_policy"] = {
            "path": "policies/company-policy.yaml",
            "policy_id": "POLICY-1",
            "sha256": policy_hash,
            "status": "BOUND",
            "precedence_verified": True,
        }
        contract["environment_contract"] = {
            "status": "RESOLVED",
            "required_profiles": ["desktop-safari", "ios-safari"],
            "canonical_profile": "desktop-safari",
            "effective_overrides": [
                {"profile_id": "desktop-safari"},
                {"profile_id": "ios-safari"},
            ],
        }

    contract_path = write_yaml(root, "contracts/shared-contract.yaml", contract)
    contract_hash = hashlib.sha256(contract_path.read_bytes()).hexdigest()

    profile_path = write_yaml(
        root,
        "profiles/figma-structure-profile.yaml",
        {
            "reference_id": "REF-1",
            "sections": [
                {
                    "section_id": "S01",
                    "recommended_translation_mode": "HYBRID",
                }
            ],
        },
    )
    profile_hash = hashlib.sha256(profile_path.read_bytes()).hexdigest()

    isolation = {
        "mode": isolation_mode,
        "ref": "section/S01",
        "parallel_safe": isolation_mode != "SERIAL_SHARED_TREE",
        "notes": ["validated custom sandbox"] if isolation_mode == "OTHER" else [],
    }
    manifest_path = write_yaml(
        root,
        "experiments/exp/section-manifest.yaml",
        {
            "reference_id": "REF-1",
            "shared_contract": "contracts/shared-contract.yaml",
            "shared_contract_sha256": contract_hash,
            "figma_structure_profile": "profiles/figma-structure-profile.yaml",
            "figma_structure_profile_sha256": profile_hash,
            "foundation_commit": "foundation-123",
            "sections": [
                {
                    "section_id": "S01",
                    "figma": {
                        "pc_node_id": "pc:1",
                        "sp_node_id": "sp:1",
                        "other_node_ids": [],
                    },
                    "worker": {
                        "status": worker_status,
                        "parallel_group": "wave-01",
                        "contract_sha256": contract_hash,
                        "base_commit": "foundation-123",
                        "isolation": isolation,
                    },
                }
            ],
        },
    )
    return reference_path, contract_path, profile_path, manifest_path, root


class CreateSectionRunTests(unittest.TestCase):
    def test_builds_fully_pinned_planned_run(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            reference_path, contract_path, profile_path, manifest_path, _ = fixture(root)
            record = build_run_record(
                root=root,
                manifest_path=manifest_path,
                reference_path=reference_path,
                experiment_id="EXP-1",
                run_id="RUN-1",
                section_id="S01",
                agent_client="codex",
                model="model-current",
            )

            self.assertEqual(record["schema_version"], 9)
            self.assertEqual(record["status"], "PLANNED")
            self.assertEqual(record["coordination"]["scope"], "SECTION")
            self.assertEqual(record["coordination"]["foundation_commit"], "foundation-123")
            self.assertEqual(
                record["coordination"]["shared_contract_sha256"],
                hashlib.sha256(contract_path.read_bytes()).hexdigest(),
            )
            self.assertEqual(
                record["coordination"]["figma_structure_profile_sha256"],
                hashlib.sha256(profile_path.read_bytes()).hexdigest(),
            )
            self.assertEqual(
                record["coordination"]["section_manifest_sha256"],
                hashlib.sha256(manifest_path.read_bytes()).hexdigest(),
            )
            self.assertEqual(record["reference"]["figma_nodes"], ["pc:1", "sp:1"])
            self.assertEqual(record["code"]["starting_commit"], "foundation-123")
            self.assertEqual(record["code"]["repository"], "m-shogo/example")
            self.assertEqual(record["coordination"]["required_environment_profiles"], [])

    def test_company_bound_run_pins_resolved_environment_profiles(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            reference_path, _, _, manifest_path, _ = fixture(root, bind_company=True)
            record = build_run_record(
                root=root,
                manifest_path=manifest_path,
                reference_path=reference_path,
                experiment_id="EXP-1",
                run_id="RUN-1",
                section_id="S01",
                agent_client="codex",
                model="",
            )
            self.assertEqual(record["coordination"]["company_policy_id"], "POLICY-1")
            self.assertEqual(
                record["coordination"]["required_environment_profiles"],
                ["desktop-safari", "ios-safari"],
            )
            self.assertEqual(
                record["coordination"]["canonical_environment_profile"], "desktop-safari"
            )

    def test_planned_worker_is_rejected_until_isolation_is_ready(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            reference_path, _, _, manifest_path, _ = fixture(root, worker_status="PLANNED")
            with self.assertRaisesRegex(ValueError, "must be READY or RUNNING"):
                build_run_record(
                    root=root,
                    manifest_path=manifest_path,
                    reference_path=reference_path,
                    experiment_id="EXP-1",
                    run_id="RUN-1",
                    section_id="S01",
                    agent_client="codex",
                    model="",
                )

    def test_stale_structure_profile_hash_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            reference_path, _, profile_path, manifest_path, _ = fixture(root)
            profile_path.write_text("reference_id: REF-1\nsections: []\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "Structure Profile hash is stale"):
                build_run_record(
                    root=root,
                    manifest_path=manifest_path,
                    reference_path=reference_path,
                    experiment_id="EXP-1",
                    run_id="RUN-1",
                    section_id="S01",
                    agent_client="codex",
                    model="",
                )

    def test_serial_shared_tree_is_allowed_for_singleton_wave(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            reference_path, _, _, manifest_path, _ = fixture(root, isolation_mode="SERIAL_SHARED_TREE")
            record = build_run_record(
                root=root,
                manifest_path=manifest_path,
                reference_path=reference_path,
                experiment_id="EXP-1",
                run_id="RUN-1",
                section_id="S01",
                agent_client="codex",
                model="",
            )
            self.assertEqual(record["coordination"]["isolation_mode"], "SERIAL_SHARED_TREE")

    def test_serial_shared_tree_is_rejected_for_multi_section_wave(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            reference_path, _, _, manifest_path, _ = fixture(root, isolation_mode="SERIAL_SHARED_TREE")
            manifest = yaml.safe_load(manifest_path.read_text(encoding="utf-8"))
            second = {
                "section_id": "S02",
                "worker": {
                    "status": "PLANNED",
                    "parallel_group": "wave-01",
                    "contract_sha256": manifest["sections"][0]["worker"]["contract_sha256"],
                    "base_commit": "foundation-123",
                    "isolation": {
                        "mode": "SERIAL_SHARED_TREE",
                        "ref": "section/S02",
                        "parallel_safe": False,
                        "notes": [],
                    },
                },
            }
            manifest["sections"].append(second)
            manifest_path.write_text(yaml.safe_dump(manifest, sort_keys=False), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "singleton execution wave"):
                build_run_record(
                    root=root,
                    manifest_path=manifest_path,
                    reference_path=reference_path,
                    experiment_id="EXP-1",
                    run_id="RUN-1",
                    section_id="S01",
                    agent_client="codex",
                    model="",
                )

    def test_other_isolation_requires_safety_evidence(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            reference_path, _, _, manifest_path, _ = fixture(root, isolation_mode="OTHER")
            data = yaml.safe_load(manifest_path.read_text(encoding="utf-8"))
            data["sections"][0]["worker"]["isolation"]["notes"] = []
            manifest_path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "OTHER isolation requires"):
                build_run_record(
                    root=root,
                    manifest_path=manifest_path,
                    reference_path=reference_path,
                    experiment_id="EXP-1",
                    run_id="RUN-1",
                    section_id="S01",
                    agent_client="codex",
                    model="",
                )

    def test_unknown_translation_mode_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            reference_path, _, profile_path, manifest_path, _ = fixture(root)
            profile_data = yaml.safe_load(profile_path.read_text(encoding="utf-8"))
            profile_data["sections"][0]["recommended_translation_mode"] = "UNKNOWN"
            profile_path.write_text(yaml.safe_dump(profile_data, sort_keys=False), encoding="utf-8")
            manifest_data = yaml.safe_load(manifest_path.read_text(encoding="utf-8"))
            manifest_data["figma_structure_profile_sha256"] = hashlib.sha256(
                profile_path.read_bytes()
            ).hexdigest()
            manifest_path.write_text(yaml.safe_dump(manifest_data, sort_keys=False), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "translation mode is still UNKNOWN"):
                build_run_record(
                    root=root,
                    manifest_path=manifest_path,
                    reference_path=reference_path,
                    experiment_id="EXP-1",
                    run_id="RUN-1",
                    section_id="S01",
                    agent_client="codex",
                    model="",
                )


if __name__ == "__main__":
    unittest.main()
