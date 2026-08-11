from __future__ import annotations

import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import validate_asset_manifests as validator  # noqa: E402


PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"asset-integrity-test"


def manifest_for(asset: Path, root: Path) -> dict:
    return {
        "schema_version": 1,
        "source_kind": "FIGMA_MCP_EPHEMERAL_ASSET",
        "source_url_persisted": False,
        "figma": {
            "file_key": "ZYTdtw4wCgkcBy2cVnhxVI",
            "node_id": "21384:8173",
            "logical_name": "test-asset",
        },
        "artifact": {
            "path": str(asset.relative_to(root)),
            "sha256": hashlib.sha256(PNG_BYTES).hexdigest(),
            "size_bytes": len(PNG_BYTES),
            "content_type": "image/png",
            "detected_format": "png",
        },
        "security": {
            "source_url_storage": "PROHIBITED",
            "source_url_transport": "STDIN_OR_ENV_ONLY",
            "redirect_policy": "HTTPS_ONLY",
        },
    }


class ManifestValidationTests(unittest.TestCase):
    def make_fixture(self, directory: str) -> tuple[Path, Path, dict]:
        root = Path(directory)
        asset = root / "assets" / "person.png"
        asset.parent.mkdir(parents=True)
        asset.write_bytes(PNG_BYTES)
        manifest = manifest_for(asset, root)
        manifest_path = asset.with_name(asset.name + ".asset.json")
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
        return root, manifest_path, manifest

    def test_valid_manifest_passes(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root, manifest_path, _ = self.make_fixture(directory)
            self.assertEqual(validator.validate_manifest(manifest_path, root=root), [])

    def test_hash_drift_fails(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root, manifest_path, manifest = self.make_fixture(directory)
            manifest["artifact"]["sha256"] = "0" * 64
            manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
            errors = validator.validate_manifest(manifest_path, root=root)
            self.assertIn("artifact.sha256 does not match file bytes", errors)

    def test_size_drift_fails(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root, manifest_path, manifest = self.make_fixture(directory)
            manifest["artifact"]["size_bytes"] += 1
            manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
            errors = validator.validate_manifest(manifest_path, root=root)
            self.assertIn("artifact.size_bytes does not match file bytes", errors)

    def test_missing_asset_fails(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root, manifest_path, manifest = self.make_fixture(directory)
            (root / manifest["artifact"]["path"]).unlink()
            errors = validator.validate_manifest(manifest_path, root=root)
            self.assertTrue(any("does not exist" in error for error in errors))

    def test_path_escape_fails_closed(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root, manifest_path, manifest = self.make_fixture(directory)
            manifest["artifact"]["path"] = "../outside.png"
            manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
            errors = validator.validate_manifest(manifest_path, root=root)
            self.assertIn("artifact.path escapes repository root", errors)

    def test_source_url_persistence_must_be_false(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root, manifest_path, manifest = self.make_fixture(directory)
            manifest["source_url_persisted"] = True
            manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
            errors = validator.validate_manifest(manifest_path, root=root)
            self.assertIn("source_url_persisted must be false", errors)

    def test_security_transport_contract_is_required(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root, manifest_path, manifest = self.make_fixture(directory)
            manifest["security"]["source_url_transport"] = "FILE"
            manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
            errors = validator.validate_manifest(manifest_path, root=root)
            self.assertIn("security.source_url_transport must be STDIN_OR_ENV_ONLY", errors)


if __name__ == "__main__":
    unittest.main()
