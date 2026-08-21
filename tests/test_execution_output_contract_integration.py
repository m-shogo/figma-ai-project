from __future__ import annotations

import hashlib
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import yaml

import scripts.validate_execution_output_contract as output_contract
from scripts.validate_execution_output_contract import validate_manifest


def wp_profile() -> dict:
    return {
        "profile_id": "IMPL-TEST-WP",
        "status": "FROZEN",
        "freeze": {"ready": True},
        "effective": {"family": "WORDPRESS", "rendering_mode": "SERVER_RENDERED_PHP"},
        "platform": {"wordpress": {"acf": {"enabled": True}}},
        "delivery_requirements": {
            "acf": {
                "required": True,
                "export_json": {"required": True, "target_repo_path": "acf-export.json"},
                "import_or_sync_smoke_required": True,
            }
        },
    }


def bp_contract(profile_sha: str) -> dict:
    return {
        "implementation_profile": {
            "path": "profile.yaml",
            "sha256": profile_sha,
            "profile_id": "IMPL-TEST-WP",
            "status": "BOUND",
            "family": "WORDPRESS",
            "variant": "",
        },
        "breakpoints": {
            "mode": "GLOBAL_SPECIFIED",
            "source": "OWNER",
            "worker_override": "PROPOSE_ONLY",
            "values": [
                {
                    "name": "mobile",
                    "media_query": "(max-width: 767px)",
                    "min_width_px": None,
                    "max_width_px": 767,
                },
                {
                    "name": "desktop",
                    "media_query": "(min-width: 768px)",
                    "min_width_px": 768,
                    "max_width_px": None,
                },
            ],
        },
    }


def section_manifest(component: str) -> dict:
    return {
        "shared_contract": "contract.yaml",
        "sections": [
            {
                "section_id": "hero",
                "implementation": {
                    "component_path": component,
                    "style_path": "hero.css",
                    "allowed_paths": [component, "hero.css"],
                },
                "responsive": {"breakpoint_exception_proposals": []},
                "worker": {"status": "READY"},
            }
        ],
    }


class ExecutionOutputContractIntegrationTests(unittest.TestCase):
    def write_fixture(self, root: Path, *, component: str, css: str) -> Path:
        profile_path = root / "profile.yaml"
        profile_path.write_text(yaml.safe_dump(wp_profile()), encoding="utf-8")
        profile_sha = hashlib.sha256(profile_path.read_bytes()).hexdigest()
        (root / "contract.yaml").write_text(yaml.safe_dump(bp_contract(profile_sha)), encoding="utf-8")
        (root / "hero.css").write_text(css, encoding="utf-8")
        manifest_path = root / "section-manifest.yaml"
        manifest_path.write_text(yaml.safe_dump(section_manifest(component)), encoding="utf-8")
        return manifest_path

    def test_bound_wordpress_profile_and_css_are_checked_end_to_end(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            manifest_path = self.write_fixture(
                root,
                component="hero.html",
                css="@media (min-width: 1100px){.hero{display:grid}}",
            )
            with patch.object(output_contract, "ROOT", root):
                errors = validate_manifest(manifest_path)
        self.assertTrue(any("requires PHP template ownership" in error for error in errors))
        self.assertTrue(any("unowned viewport threshold 1100px" in error for error in errors))

    def test_bound_wordpress_profile_and_owned_threshold_pass_end_to_end(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            manifest_path = self.write_fixture(
                root,
                component="hero.php",
                css="@media (min-width: 768px){.hero{display:grid}}",
            )
            with patch.object(output_contract, "ROOT", root):
                self.assertEqual([], validate_manifest(manifest_path))


if __name__ == "__main__":
    unittest.main()
