from __future__ import annotations

import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import validate_run_deliverables as validator  # noqa: E402


def write_yaml(root: Path, relative: str, data: dict) -> tuple[Path, str]:
    path = root / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
    return path, hashlib.sha256(path.read_bytes()).hexdigest()


def write_acf_export(root: Path) -> Path:
    path = root / "experiments/exp/artifacts/acf-export.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(
            [
                {
                    "key": "group_test123",
                    "title": "Test fields",
                    "fields": [
                        {"key": "field_title123", "label": "Title", "name": "title", "type": "text"}
                    ],
                    "location": [[{"param": "post_type", "operator": "==", "value": "page"}]],
                    "active": True,
                }
            ]
        ),
        encoding="utf-8",
    )
    return path


def fixture(root: Path) -> dict:
    profile = {
        "profile_id": "IMPL-1",
        "delivery_requirements": {
            "acf": {
                "required": True,
            }
        },
    }
    _, profile_hash = write_yaml(root, "implementation-profiles/profile.yaml", profile)
    export_path = write_acf_export(root)
    return {
        "status": "COMPLETE",
        "coordination": {
            "implementation_profile_path": "implementation-profiles/profile.yaml",
            "implementation_profile_sha256": profile_hash,
        },
        "deliverables": {
            "acf": {
                "required": True,
                "export_json": {
                    "required": True,
                    "target_repo_path": "acf-export.json",
                    "evidence_json_path": export_path.relative_to(root).as_posix(),
                    "validation_status": "PASS",
                },
                "local_json": {
                    "required": True,
                    "target_repo_dir": "acf-json",
                    "evidence_files": ["acf-json/group_test123.json"],
                },
                "import_smoke": {
                    "required": True,
                    "status": "PASS",
                    "method": "ADMIN_UI",
                    "accepted_methods": ["ADMIN_UI", "WP_CLI_IMPORT"],
                    "evidence": ["Imported successfully in test WordPress instance"],
                },
            }
        },
    }


class RunDeliverableTests(unittest.TestCase):
    def validate(self, root: Path, run: dict) -> list[str]:
        with patch.object(validator, "ROOT", root):
            return validator.validate_run(run)

    def test_complete_acf_run_passes_with_export_and_import_smoke(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.assertEqual([], self.validate(root, fixture(root)))

    def test_missing_export_evidence_blocks_completion(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            run = fixture(root)
            run["deliverables"]["acf"]["export_json"]["evidence_json_path"] = ""
            errors = self.validate(root, run)
            self.assertTrue(any("evidence_json_path" in error for error in errors))

    def test_failed_import_smoke_blocks_completion(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            run = fixture(root)
            run["deliverables"]["acf"]["import_smoke"]["status"] = "FAIL"
            errors = self.validate(root, run)
            self.assertTrue(any("smoke must PASS" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
