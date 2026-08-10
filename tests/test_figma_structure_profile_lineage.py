from __future__ import annotations

import hashlib
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import yaml

import scripts.validate_figma_structure_profile as lineage


def signal(state: str = "OBSERVED", confidence: str = "HIGH") -> dict:
    return {
        "state": state,
        "confidence": confidence,
        "evidence": ["inspected exact section node"],
    }


def profile() -> dict:
    return {
        "reference_id": "REF-1",
        "captured_at": "2026-08-10T19:00:00+09:00",
        "figma_tooling_snapshot": "mcp-current",
        "page": {
            "auto_layout_generation": "UNDETERMINED",
            "notes": ["generation not exposed reliably by current tooling"],
        },
        "sections": [
            {
                "section_id": "S01",
                "figma_node_ids": ["pc:1", "sp:1"],
                "signals": {
                    "components": signal(),
                    "variables": signal("UNDETERMINED", "HIGH"),
                    "auto_layout": signal("UNDETERMINED", "HIGH"),
                    "semantic_naming": signal(),
                    "code_connect": signal("NONE", "HIGH"),
                    "assets": signal(),
                    "responsive_mapping": signal(),
                },
                "recommended_translation_mode": "HYBRID",
                "mode_reasoning_evidence": ["mixed trusted and undetermined structure"],
            }
        ],
    }


def manifest(profile_path: str, profile_hash: str) -> dict:
    return {
        "reference_id": "REF-1",
        "figma_structure_profile": profile_path,
        "figma_structure_profile_sha256": profile_hash,
        "sections": [
            {
                "section_id": "S01",
                "figma": {"pc_node_id": "pc:1", "sp_node_id": "sp:1"},
                "worker": {"status": "READY"},
            }
        ],
    }


class FigmaStructureProfileLineageTests(unittest.TestCase):
    def make_fixture(self, root: Path) -> tuple[Path, Path]:
        profile_path = root / "profiles/figma-structure-profile.yaml"
        profile_path.parent.mkdir(parents=True, exist_ok=True)
        profile_path.write_text(yaml.safe_dump(profile(), sort_keys=False), encoding="utf-8")
        profile_hash = hashlib.sha256(profile_path.read_bytes()).hexdigest()

        manifest_path = root / "section-manifest.yaml"
        manifest_path.write_text(
            yaml.safe_dump(
                manifest(profile_path.relative_to(root).as_posix(), profile_hash),
                sort_keys=False,
            ),
            encoding="utf-8",
        )
        return manifest_path, profile_path

    def validate(self, root: Path, manifest_path: Path) -> list[str]:
        with patch.object(lineage, "ROOT", root):
            return lineage.validate_manifest(manifest_path)

    def test_valid_lineage_with_undetermined_signal_passes(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            manifest_path, _ = self.make_fixture(root)
            self.assertEqual([], self.validate(root, manifest_path))

    def test_profile_hash_drift_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            manifest_path, profile_path = self.make_fixture(root)
            data = yaml.safe_load(profile_path.read_text(encoding="utf-8"))
            data["sections"][0]["recommended_translation_mode"] = "VISUAL_FIRST"
            profile_path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
            errors = self.validate(root, manifest_path)
            self.assertTrue(any("sha256 does not match" in error for error in errors), errors)

    def test_unknown_signal_is_rejected_for_active_worker(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            manifest_path, profile_path = self.make_fixture(root)
            data = yaml.safe_load(profile_path.read_text(encoding="utf-8"))
            data["sections"][0]["signals"]["variables"]["state"] = "UNKNOWN"
            profile_path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
            manifest_data = yaml.safe_load(manifest_path.read_text(encoding="utf-8"))
            manifest_data["figma_structure_profile_sha256"] = hashlib.sha256(
                profile_path.read_bytes()
            ).hexdigest()
            manifest_path.write_text(yaml.safe_dump(manifest_data, sort_keys=False), encoding="utf-8")
            errors = self.validate(root, manifest_path)
            self.assertTrue(any("variables cannot remain UNKNOWN" in error for error in errors), errors)

    def test_manifest_nodes_must_exist_in_profile_entry(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            manifest_path, _ = self.make_fixture(root)
            data = yaml.safe_load(manifest_path.read_text(encoding="utf-8"))
            data["sections"][0]["figma"]["sp_node_id"] = "sp:other"
            manifest_path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
            errors = self.validate(root, manifest_path)
            self.assertTrue(any("sp_node_id=sp:other" in error for error in errors), errors)

    def test_translation_mode_must_be_resolved(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            manifest_path, profile_path = self.make_fixture(root)
            data = yaml.safe_load(profile_path.read_text(encoding="utf-8"))
            data["sections"][0]["recommended_translation_mode"] = "UNKNOWN"
            profile_path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
            manifest_data = yaml.safe_load(manifest_path.read_text(encoding="utf-8"))
            manifest_data["figma_structure_profile_sha256"] = hashlib.sha256(
                profile_path.read_bytes()
            ).hexdigest()
            manifest_path.write_text(yaml.safe_dump(manifest_data, sort_keys=False), encoding="utf-8")
            errors = self.validate(root, manifest_path)
            self.assertTrue(any("recommended_translation_mode" in error for error in errors), errors)

    def test_empty_inactive_manifest_does_not_require_profile(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            manifest_path = root / "section-manifest.yaml"
            manifest_path.write_text(
                yaml.safe_dump({"reference_id": "REF-1", "sections": []}, sort_keys=False),
                encoding="utf-8",
            )
            self.assertEqual([], self.validate(root, manifest_path))


if __name__ == "__main__":
    unittest.main()
