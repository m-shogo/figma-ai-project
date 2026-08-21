from __future__ import annotations

import unittest

from scripts.validate_benchmark_replay_pipeline import (
    ACF_ADMIN_EVIDENCE_JSON,
    ACF_ADMIN_REQUIRED_CHECKS,
    ACF_ADMIN_REQUIRED_TRUE,
    ACF_ADMIN_SCREENSHOT_DIR,
    acf_admin_contract_errors,
    main,
)


class BenchmarkReplayPipelineTests(unittest.TestCase):
    def test_ref001_benchmark_clean_replay_pipeline(self) -> None:
        self.assertEqual(0, main())

    def test_acf_admin_gate_rejects_missing_roundtrip_contract(self) -> None:
        errors = acf_admin_contract_errors({})
        self.assertTrue(any("acf_admin_e2e" in error for error in errors))
        self.assertTrue(any("integration.required_checks" in error for error in errors))

    def test_acf_admin_gate_accepts_complete_roundtrip_contract(self) -> None:
        config = {key: True for key in ACF_ADMIN_REQUIRED_TRUE}
        config.update(
            {
                "browser_driver": "PLAYWRIGHT",
                "evidence_json": ACF_ADMIN_EVIDENCE_JSON,
                "screenshot_dir": ACF_ADMIN_SCREENSHOT_DIR,
            }
        )
        contract = {
            "cms_validation": {"acf_admin_e2e": config},
            "integration": {"required_checks": sorted(ACF_ADMIN_REQUIRED_CHECKS)},
        }
        self.assertEqual([], acf_admin_contract_errors(contract))


if __name__ == "__main__":
    unittest.main()
