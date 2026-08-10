from __future__ import annotations

import hashlib
import json
import sys
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import start_section_run as starter  # noqa: E402
import validate_run_lineage as lineage  # noqa: E402


def write_yaml(root: Path, relative: str, data: dict) -> tuple[Path, str]:
    path = root / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
    return path, hashlib.sha256(path.read_bytes()).hexdigest()


def fixture(root: Path) -> dict:
    _, ref_hash = write_yaml(root, "references/ref/reference.yaml", {"reference_id": "REF-1"})
    _, contract_hash = write_yaml(
        root,
        "contracts/shared-contract.yaml",
        {"reference_id": "REF-1", "foundation": {"commit": "foundation"}},
    )
    _, profile_hash = write_yaml(
        root,
        "profiles/figma-structure-profile.yaml",
        {
            "reference_id": "REF-1",
            "sections": [{"section_id": "S01", "recommended_translation_mode": "HYBRID"}],
        },
    )
    _, manifest_hash = write_yaml(
        root,
        "experiments/exp/section-manifest.yaml",
        {
            "reference_id": "REF-1",
            "shared_contract_sha256": contract_hash,
            "figma_structure_profile": "profiles/figma-structure-profile.yaml",
            "figma_structure_profile_sha256": profile_hash,
            "foundation_commit": "foundation",
            "sections": [
                {
                    "section_id": "S01",
                    "worker": {
                        "parallel_group": "wave-01",
                        "contract_sha256": contract_hash,
                        "isolation": {"mode": "BRANCH_WORKTREE", "ref": "wt-S01"},
                    },
                }
            ],
        },
    )
    return {
        "status": "PLANNED",
        "tooling_preflight": {
            "mode": "LEGACY_MANUAL",
            "checked_at": "2026-08-10T19:00:00+09:00",
            "figma_release_notes_checked": True,
            "figma_mcp_docs_checked": True,
            "agent_docs_checked": True,
            "community_scan_checked": True,
        },
        "reference": {
            "reference_id": "REF-1",
            "manifest_path": "references/ref/reference.yaml",
            "manifest_sha256": ref_hash,
        },
        "coordination": {
            "scope": "SECTION",
            "section_id": "S01",
            "parallel_group": "wave-01",
            "shared_contract_path": "contracts/shared-contract.yaml",
            "shared_contract_sha256": contract_hash,
            "section_manifest_path": "experiments/exp/section-manifest.yaml",
            "section_manifest_sha256": manifest_hash,
            "figma_structure_profile_path": "profiles/figma-structure-profile.yaml",
            "figma_structure_profile_sha256": profile_hash,
            "foundation_commit": "foundation",
            "isolation_mode": "BRANCH_WORKTREE",
            "isolation_ref": "wt-S01",
        },
    }


def make_radar(root: Path) -> tuple[Path, str]:
    path = root / "research/update-radar/latest.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({"generated_at": datetime.now(timezone.utc).isoformat()}), encoding="utf-8")
    return path, hashlib.sha256(path.read_bytes()).hexdigest()


class StartSectionRunTests(unittest.TestCase):
    def validate_start(self, root: Path, data: dict) -> dict:
        with patch.object(lineage, "ROOT", root), patch.object(starter, "ROOT", root):
            return starter.start(data)

    def test_complete_legacy_preflight_and_valid_lineage_can_start(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            data = fixture(root)
            started = self.validate_start(root, data)
            self.assertEqual(started["status"], "RUNNING")
            self.assertEqual(data["status"], "PLANNED")

    def test_legacy_preflight_still_requires_community_flag(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            data = fixture(root)
            data["tooling_preflight"]["community_scan_checked"] = False
            with self.assertRaisesRegex(ValueError, "community_scan_checked"):
                self.validate_start(root, data)

    def test_automated_preflight_does_not_require_manual_community_scan(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            data = fixture(root)
            radar_path, radar_hash = make_radar(root)
            data["tooling_preflight"] = {
                "mode": "AUTOMATED_UPDATE_RADAR",
                "checked_at": datetime.now(timezone.utc).isoformat(),
                "update_radar_path": radar_path.relative_to(root).as_posix(),
                "update_radar_sha256": radar_hash,
                "update_radar_generated_at": datetime.now(timezone.utc).isoformat(),
                "update_radar_max_age_hours": 36,
                "official_sources_complete": True,
                "figma_release_notes_checked": True,
                "figma_mcp_docs_checked": True,
                "agent_docs_checked": True,
                "community_scan_checked": False,
            }
            started = self.validate_start(root, data)
            self.assertEqual(started["status"], "RUNNING")

    def test_automated_preflight_rejects_changed_radar_fingerprint(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            data = fixture(root)
            radar_path, radar_hash = make_radar(root)
            data["tooling_preflight"] = {
                "mode": "AUTOMATED_UPDATE_RADAR",
                "checked_at": datetime.now(timezone.utc).isoformat(),
                "update_radar_path": radar_path.relative_to(root).as_posix(),
                "update_radar_sha256": radar_hash,
                "update_radar_generated_at": datetime.now(timezone.utc).isoformat(),
                "update_radar_max_age_hours": 36,
                "official_sources_complete": True,
                "figma_release_notes_checked": True,
                "figma_mcp_docs_checked": True,
                "agent_docs_checked": True,
            }
            radar_path.write_text('{"changed": true}', encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "SHA-256 changed"):
                self.validate_start(root, data)

    def test_missing_checked_at_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            data = fixture(root)
            data["tooling_preflight"]["checked_at"] = ""
            with self.assertRaisesRegex(ValueError, "checked_at"):
                self.validate_start(root, data)

    def test_stale_profile_hash_is_rejected_at_start_time(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            data = fixture(root)
            profile = root / "profiles/figma-structure-profile.yaml"
            profile.write_text("reference_id: REF-1\nsections: []\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "Figma Structure Profile sha256 mismatch"):
                self.validate_start(root, data)

    def test_non_planned_run_cannot_be_restarted(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            data = fixture(root)
            data["status"] = "RUNNING"
            with self.assertRaisesRegex(ValueError, "only PLANNED runs can start"):
                self.validate_start(root, data)

    def test_integration_scope_is_not_started_by_section_cli(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            data = fixture(root)
            data["coordination"]["scope"] = "INTEGRATION"
            with self.assertRaisesRegex(ValueError, "only starts SECTION runs"):
                self.validate_start(root, data)


if __name__ == "__main__":
    unittest.main()
