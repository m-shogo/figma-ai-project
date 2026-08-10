from __future__ import annotations

import hashlib
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import yaml

import scripts.validate_company_policy as policy


EXPECTED = [
    "COMPANY_POLICY",
    "EXISTING_CODEBASE",
    "FIGMA_IMPLEMENTATION_EVIDENCE",
    "AGENT_INFERENCE",
]


def active_policy() -> dict:
    return {
        "policy_id": "COMPANY-1",
        "status": "ACTIVE",
        "precedence": {"implementation_constraints": EXPECTED},
        "browser_support": {"browserslist": ["last 2 versions"]},
        "update_policy": {"significant_run_preflight": True},
    }


class CompanyPolicyTests(unittest.TestCase):
    def test_active_policy_with_browser_contract_passes_semantics(self) -> None:
        self.assertEqual([], policy.semantic_policy_errors(active_policy()))

    def test_precedence_order_is_not_negotiable(self) -> None:
        data = active_policy()
        data["precedence"]["implementation_constraints"] = list(reversed(EXPECTED))
        errors = policy.semantic_policy_errors(data)
        self.assertTrue(any("implementation precedence" in error for error in errors))

    def test_active_policy_requires_browser_support_contract(self) -> None:
        data = active_policy()
        data["browser_support"] = {"browserslist": [], "explicit_minimums": [], "test_matrix": []}
        errors = policy.semantic_policy_errors(data)
        self.assertTrue(any("browser support contract" in error for error in errors))

    def test_frozen_contract_requires_actual_policy_hash(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            policy_path = root / "policies/company-policy.yaml"
            policy_path.parent.mkdir(parents=True)
            policy_path.write_text(yaml.safe_dump(active_policy(), sort_keys=False), encoding="utf-8")
            digest = hashlib.sha256(policy_path.read_bytes()).hexdigest()
            contract = {
                "status": "FROZEN",
                "company_policy": {
                    "path": "policies/company-policy.yaml",
                    "sha256": digest,
                    "policy_id": "COMPANY-1",
                    "status": "BOUND",
                    "precedence_verified": True,
                },
            }
            with patch.object(policy, "ROOT", root):
                self.assertEqual([], policy.validate_frozen_contract(root / "contract.yaml", contract))

            contract["company_policy"]["sha256"] = "stale"
            with patch.object(policy, "ROOT", root):
                errors = policy.validate_frozen_contract(root / "contract.yaml", contract)
            self.assertTrue(any("sha256 mismatch" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
