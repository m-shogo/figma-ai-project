from __future__ import annotations

import hashlib
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import yaml

import scripts.validate_environment_contract as env_validator

REPO_ROOT = Path(__file__).resolve().parents[1]


def write_yaml(root: Path, relative: str, data: dict) -> Path:
    path = root / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
    return path


def company_policy() -> dict:
    return {
        "policy_id": "POLICY-1",
        "status": "ACTIVE",
        "browser_support": {
            "runtime_detection": {
                "default": "CAPABILITY_FIRST",
                "ua_sniffing": "BUG_FIX_ONLY",
            },
            "environment_profiles": [
                {"id": "desktop-safari", "role": "REQUIRED"},
                {"id": "ios-safari", "role": "REQUIRED"},
                {"id": "android-chrome", "role": "SUPPORTED"},
            ],
        },
        "css": {
            "foundation_layers": {
                "device_specific_full_reset": False,
            }
        },
        "visual_tolerance": {
            "canonical_environment_profile": "desktop-safari",
        },
    }


def override(profile_id: str) -> dict:
    return {
        "profile_id": profile_id,
        "reset_profile": "BASE_PLUS_ENVIRONMENT",
        "smooth_scroll": "INHERIT",
        "hover_profile": "CAPABILITY_BASED",
        "touch_profile": "BROWSER_NATIVE",
        "viewport_profile": "INHERIT",
        "scroll_lock_profile": "EXISTING",
        "animation_profile": "INHERIT",
        "image_profile": "INHERIT",
        "evidence": ["company policy + existing project"],
    }


def environment_contract() -> dict:
    return {
        "status": "RESOLVED",
        "required_profiles": ["desktop-safari", "ios-safari"],
        "canonical_profile": "desktop-safari",
        "runtime_detection": {
            "strategy": "CAPABILITY_FIRST",
            "feature_detection_required": True,
            "ua_sniffing_policy": "BUG_FIX_ONLY",
            "notes": [],
        },
        "foundation": {
            "reset_source": "EXISTING_PROJECT",
            "reset_paths": ["src/reset.css"],
            "base_paths": ["src/base.css"],
            "environment_paths": ["src/environment.css"],
            "device_specific_full_reset": False,
            "notes": [],
        },
        "viewport": {},
        "interaction": {},
        "effective_overrides": [override("desktop-safari"), override("ios-safari")],
        "qa": {
            "section_capture": "CANONICAL_PLUS_DIFFERENCES",
            "boundary_capture": "CANONICAL_PLUS_DIFFERENCES",
            "full_page_capture": "ALL_REQUIRED",
            "interaction_qa": "ALL_RELEVANT_REQUIRED",
            "real_device_policy": "FROM_COMPANY_PROFILE",
            "notes": [],
        },
        "conflicts": [],
    }


def frozen_contract(policy_path: Path, policy_hash: str) -> dict:
    return {
        "status": "FROZEN",
        "company_policy": {
            "path": "policies/company-policy.yaml",
            "sha256": policy_hash,
            "policy_id": "POLICY-1",
            "status": "BOUND",
            "precedence_verified": True,
        },
        "environment_contract": environment_contract(),
    }


class EnvironmentContractTests(unittest.TestCase):
    def validate(self, root: Path, contract: dict) -> list[str]:
        with patch.object(env_validator, "ROOT", root):
            return env_validator.semantic_errors(contract)

    def test_valid_frozen_environment_contract_passes(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            policy_path = write_yaml(root, "policies/company-policy.yaml", company_policy())
            policy_hash = hashlib.sha256(policy_path.read_bytes()).hexdigest()
            self.assertEqual([], self.validate(root, frozen_contract(policy_path, policy_hash)))

    def test_required_profiles_must_match_company_policy(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            policy_path = write_yaml(root, "policies/company-policy.yaml", company_policy())
            contract = frozen_contract(policy_path, hashlib.sha256(policy_path.read_bytes()).hexdigest())
            contract["environment_contract"]["required_profiles"] = ["desktop-safari"]
            errors = self.validate(root, contract)
            self.assertTrue(any("exactly match REQUIRED" in error for error in errors))

    def test_each_required_profile_needs_explicit_effective_override(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            policy_path = write_yaml(root, "policies/company-policy.yaml", company_policy())
            contract = frozen_contract(policy_path, hashlib.sha256(policy_path.read_bytes()).hexdigest())
            contract["environment_contract"]["effective_overrides"] = [override("desktop-safari")]
            errors = self.validate(root, contract)
            self.assertTrue(any("one explicit effective override" in error for error in errors))

    def test_canonical_profile_must_match_company_policy(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            policy_path = write_yaml(root, "policies/company-policy.yaml", company_policy())
            contract = frozen_contract(policy_path, hashlib.sha256(policy_path.read_bytes()).hexdigest())
            contract["environment_contract"]["canonical_profile"] = "ios-safari"
            errors = self.validate(root, contract)
            self.assertTrue(any("canonical_profile must match" in error for error in errors))

    def test_full_page_capture_must_cover_all_required_profiles(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            policy_path = write_yaml(root, "policies/company-policy.yaml", company_policy())
            contract = frozen_contract(policy_path, hashlib.sha256(policy_path.read_bytes()).hexdigest())
            contract["environment_contract"]["qa"]["full_page_capture"] = "CANONICAL_ONLY"
            errors = self.validate(root, contract)
            self.assertTrue(any("Full Page capture" in error for error in errors))

    def test_device_specific_full_reset_requires_company_permission(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            policy_path = write_yaml(root, "policies/company-policy.yaml", company_policy())
            contract = frozen_contract(policy_path, hashlib.sha256(policy_path.read_bytes()).hexdigest())
            contract["environment_contract"]["foundation"]["device_specific_full_reset"] = True
            errors = self.validate(root, contract)
            self.assertTrue(any("full reset is not allowed" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
