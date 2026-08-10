from __future__ import annotations

import hashlib
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import yaml

import scripts.validate_capture_environment as capture_validator


def write_yaml(root: Path, relative: str, data: dict) -> Path:
    path = root / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
    return path


def profile(profile_id: str, *, browser: str, os_name: str) -> dict:
    return {
        "id": profile_id,
        "role": "REQUIRED",
        "browser": browser,
        "os": os_name,
        "engine": "WebKit" if browser == "Safari" else "Blink",
        "webview": False,
    }


def capture(capture_id: str, profile_id: str, *, browser: str, os_name: str, scope: str = "SECTION") -> dict:
    return {
        "capture_id": capture_id,
        "scope": scope,
        "target_id": "S01" if scope == "SECTION" else "PAGE",
        "frame_id": "main",
        "environment_profile_id": profile_id,
        "runtime": {
            "browser": browser,
            "browser_version": "current",
            "os": os_name,
            "os_version": "current",
            "engine": "WebKit" if browser == "Safari" else "Blink",
            "webview": False,
            "viewport_width_css_px": 390,
            "viewport_height_css_px": 844,
            "dpr": 3,
            "zoom": 1.0,
            "text_scale": 1.0,
            "orientation": "PORTRAIT",
        },
        "input_state": {
            "primary_hover": "NONE",
            "primary_pointer": "COARSE",
            "touch": True,
        },
        "preferences": {
            "reduced_motion": "NO_PREFERENCE",
            "forced_colors": "NONE",
            "contrast": "NO_PREFERENCE",
            "color_scheme": "LIGHT",
        },
        "path": f"evidence/{capture_id}.png",
        "captured_at": "2026-08-10T22:00:00+09:00",
        "deterministic": True,
        "notes": [],
    }


def fixture(root: Path, *, scope: str = "SECTION", status: str = "COMPLETE") -> dict:
    policy = {
        "policy_id": "POLICY-1",
        "status": "ACTIVE",
        "browser_support": {
            "environment_profiles": [
                profile("ios-safari", browser="Safari", os_name="iOS"),
                profile("android-chrome", browser="Chrome", os_name="Android"),
            ]
        },
    }
    policy_path = write_yaml(root, "policies/company-policy.yaml", policy)
    policy_hash = hashlib.sha256(policy_path.read_bytes()).hexdigest()

    contract = {
        "environment_contract": {
            "status": "RESOLVED",
            "required_profiles": ["ios-safari", "android-chrome"],
            "canonical_profile": "ios-safari",
        }
    }
    contract_path = write_yaml(root, "contracts/shared-contract.yaml", contract)
    contract_hash = hashlib.sha256(contract_path.read_bytes()).hexdigest()

    run = {
        "status": status,
        "coordination": {
            "scope": scope,
            "section_id": "S01" if scope == "SECTION" else "",
            "company_policy_path": "policies/company-policy.yaml",
            "company_policy_id": "POLICY-1",
            "company_policy_sha256": policy_hash,
            "shared_contract_path": "contracts/shared-contract.yaml",
            "shared_contract_sha256": contract_hash,
            "required_environment_profiles": ["ios-safari", "android-chrome"],
            "canonical_environment_profile": "ios-safari",
        },
        "captures": {
            "first_pass": [],
            "verify": [],
            "final": [],
        },
    }
    if scope == "SECTION":
        run["captures"]["first_pass"] = [
            capture("cap-ios", "ios-safari", browser="Safari", os_name="iOS")
        ]
    else:
        run["captures"]["verify"] = [
            capture("page-ios", "ios-safari", browser="Safari", os_name="iOS", scope="FULL_PAGE"),
            capture("page-android", "android-chrome", browser="Chrome", os_name="Android", scope="FULL_PAGE"),
        ]
    return run


class CaptureEnvironmentTests(unittest.TestCase):
    def validate(self, root: Path, run: dict) -> list[str]:
        with patch.object(capture_validator, "ROOT", root):
            return capture_validator.validate_run(run)

    def test_complete_section_with_canonical_first_pass_passes(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.assertEqual([], self.validate(root, fixture(root)))

    def test_unknown_capture_environment_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            run = fixture(root)
            run["captures"]["first_pass"][0]["environment_profile_id"] = "unknown-device"
            errors = self.validate(root, run)
            self.assertTrue(any("unknown environment_profile_id" in error for error in errors))

    def test_runtime_browser_must_match_profile(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            run = fixture(root)
            run["captures"]["first_pass"][0]["runtime"]["browser"] = "Chrome"
            errors = self.validate(root, run)
            self.assertTrue(any("runtime browser" in error for error in errors))

    def test_run_environment_pin_must_match_contract(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            run = fixture(root)
            run["coordination"]["required_environment_profiles"] = ["ios-safari"]
            errors = self.validate(root, run)
            self.assertTrue(any("required_environment_profiles" in error for error in errors))

    def test_capture_must_be_deterministic(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            run = fixture(root)
            run["captures"]["first_pass"][0]["deterministic"] = False
            errors = self.validate(root, run)
            self.assertTrue(any("deterministic" in error for error in errors))

    def test_complete_section_requires_canonical_first_pass(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            run = fixture(root)
            run["captures"]["first_pass"] = []
            errors = self.validate(root, run)
            self.assertTrue(any("canonical-environment FIRST_PASS" in error for error in errors))

    def test_complete_integration_requires_full_page_for_all_required(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            run = fixture(root, scope="INTEGRATION")
            run["captures"]["verify"] = run["captures"]["verify"][:1]
            errors = self.validate(root, run)
            self.assertTrue(any("FULL_PAGE evidence" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
