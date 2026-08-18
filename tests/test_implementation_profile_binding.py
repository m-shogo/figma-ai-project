from __future__ import annotations

import hashlib
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import bind_implementation_profile as binder  # noqa: E402
import pin_implementation_profile as pinner  # noqa: E402
import validate_implementation_profile as validator  # noqa: E402

CONFIG = yaml.safe_load((ROOT / "config" / "implementation-targets.yaml").read_text(encoding="utf-8"))


def write_yaml(root: Path, relative: str, data: dict) -> tuple[Path, str]:
    path = root / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
    return path, hashlib.sha256(path.read_bytes()).hexdigest()


def profile() -> dict:
    data = {
        "schema_version": 1,
        "profile_id": "IMPL-1",
        "status": "FROZEN",
        "selection": {"mode": "AUTO_EXISTING", "family": "AUTO_EXISTING", "variant": "", "selected_by": "test", "notes": []},
        "repository": {"repository": "m-shogo/example", "starting_commit": "base", "target_route_or_template": "/demo", "inspected": True, "evidence_paths": ["index.html"]},
        "resolution": {"detected_family": "STATIC_WEB", "detected_variant": "", "confidence": "HIGH", "evidence": ["index.html"], "conflicts": [], "conflict_resolution": "MATCHED"},
        "effective": {
            "family": "STATIC_WEB", "variant": "", "language_runtime": "HTML/CSS/JS", "package_manager": "none", "build_tool": "none", "styling_architecture": "CSS", "component_system": "partials", "routing": "static", "data_source": "static", "image_pipeline": "assets", "form_handling": "none", "i18n": "none", "test_harness": "browser", "rendering_mode": "STATIC", "notes": []
        },
        "platform": {
            "static_web": {"html_strategy": "SEMANTIC", "script_strategy": "VANILLA_JS", "partial_strategy": "NONE", "output_contract": "static"},
            "php_template": {}, "wordpress": {"enabled": False, "acf": {"enabled": False}}, "js_framework": {}
        },
        "delivery_requirements": {
            "source_code_required": True,
            "acf": {"required": False, "export_json": {"required": False, "format": "ACF_EXPORT_ARRAY", "target_repo_path": "", "evidence_copy_required": True}, "local_json": {"required": False, "target_repo_dir": ""}, "import_or_sync_smoke_required": False, "accepted_methods": []}
        },
        "checklist": [], "unknowns": [], "conflicts": [],
        "freeze": {"ready": True, "frozen_at": "2026-08-11T09:00:00+09:00", "notes": []}
    }
    data["checklist"] = [
        {"id": item, "status": "PASS", "evidence": ["test"], "notes": []}
        for item in validator.required_check_ids(data, CONFIG)
    ]
    return data


class ImplementationProfileBindingTests(unittest.TestCase):
    def test_frozen_profile_binds_to_draft_contract(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            profile_path, _ = write_yaml(root, "implementation-profiles/profile.yaml", profile())
            contract = {
                "status": "DRAFT",
                "freeze": {"ready": False},
                "codebase": {"repository": "m-shogo/example", "starting_commit": "base"},
            }
            with patch.object(binder, "ROOT", root):
                updated = binder.bind(contract, profile(), profile_path)
            self.assertEqual(updated["implementation_profile"]["status"], "BOUND")
            self.assertEqual(updated["implementation_profile"]["profile_id"], "IMPL-1")

    def test_pinner_copies_profile_and_deliverable_requirements_to_run(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            profile_path, profile_hash = write_yaml(root, "implementation-profiles/profile.yaml", profile())
            contract = {
                "implementation_profile": {
                    "path": "implementation-profiles/profile.yaml",
                    "sha256": profile_hash,
                    "profile_id": "IMPL-1",
                    "status": "BOUND",
                }
            }
            _, contract_hash = write_yaml(root, "contracts/shared-contract.yaml", contract)
            run = {
                "status": "PLANNED",
                "coordination": {
                    "shared_contract_path": "contracts/shared-contract.yaml",
                    "shared_contract_sha256": contract_hash,
                },
                "code": {"repository": "m-shogo/example"},
            }
            with patch.object(pinner, "ROOT", root):
                updated = pinner.pin(run)
            self.assertEqual(updated["coordination"]["implementation_profile_id"], "IMPL-1")
            self.assertFalse(updated["deliverables"]["acf"]["required"])

    def test_pinner_rejects_stale_profile_hash(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            profile_path, profile_hash = write_yaml(root, "implementation-profiles/profile.yaml", profile())
            _, contract_hash = write_yaml(
                root,
                "contracts/shared-contract.yaml",
                {"implementation_profile": {"path": "implementation-profiles/profile.yaml", "sha256": profile_hash, "profile_id": "IMPL-1", "status": "BOUND"}},
            )
            profile_path.write_text("profile_id: changed\n", encoding="utf-8")
            run = {"status": "PLANNED", "coordination": {"shared_contract_path": "contracts/shared-contract.yaml", "shared_contract_sha256": contract_hash}, "code": {"repository": "m-shogo/example"}}
            with patch.object(pinner, "ROOT", root), self.assertRaisesRegex(ValueError, "hash changed"):
                pinner.pin(run)


if __name__ == "__main__":
    unittest.main()
