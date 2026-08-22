from __future__ import annotations

import copy
import unittest

from scripts.validate_benchmark_replay_pipeline import (
    ACF_ADMIN_EVIDENCE_JSON,
    ACF_ADMIN_REQUIRED_CHECKS,
    ACF_ADMIN_REQUIRED_TRUE,
    ACF_ADMIN_SCREENSHOT_DIR,
    EXECUTION_POLICY_EXPECTATIONS,
    HANDOFF_EXECUTION_MARKERS,
    OBSERVATION_SOURCE_CLASSES,
    acf_admin_contract_errors,
    current_execution_contract_errors,
    main,
)


class BenchmarkReplayPipelineTests(unittest.TestCase):
    def current_execution_fixture(self) -> tuple[dict, dict, dict, str]:
        policy = {
            "responsive": {
                **EXECUTION_POLICY_EXPECTATIONS,
                "pc_change_to_shared_owner_invalidates_prior_sp_acceptance": True,
                "parallel_capture_must_not_override_acceptance_order": True,
            }
        }
        section_template = {
            "schema_version": 9,
            "integration": {
                "observation_coverage": {
                    "sp_full_page": "PENDING",
                    "pc_full_page": "PENDING",
                    "evidence": [],
                    "known_gaps": [],
                }
            },
        }
        section_schema = {
            "$defs": {
                "sectionObservationCoverage": {
                    "properties": {
                        "source_presence": {
                            "required": sorted(OBSERVATION_SOURCE_CLASSES),
                        },
                        "runtime_review": {
                            "required": ["sp", "pc"],
                        },
                    }
                }
            }
        }
        handoff = "\n".join(sorted(HANDOFF_EXECUTION_MARKERS))
        return policy, section_template, section_schema, handoff

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

    def test_current_execution_contract_accepts_sp_then_pc_observation_authority(self) -> None:
        policy, template, schema, handoff = self.current_execution_fixture()
        self.assertEqual(
            [],
            current_execution_contract_errors(policy, template, schema, handoff),
        )

    def test_current_execution_contract_rejects_pc_first_drift(self) -> None:
        policy, template, schema, handoff = self.current_execution_fixture()
        policy = copy.deepcopy(policy)
        policy["responsive"]["execution_order_default"] = "PC_THEN_SP"
        errors = current_execution_contract_errors(policy, template, schema, handoff)
        self.assertTrue(any("execution_order_default" in error for error in errors), errors)

    def test_current_execution_contract_rejects_legacy_observation_manifest(self) -> None:
        policy, template, schema, handoff = self.current_execution_fixture()
        template = copy.deepcopy(template)
        template["schema_version"] = 8
        errors = current_execution_contract_errors(policy, template, schema, handoff)
        self.assertTrue(any("schema_version >= 9" in error for error in errors), errors)

    def test_current_execution_contract_rejects_missing_observation_source_class(self) -> None:
        policy, template, schema, handoff = self.current_execution_fixture()
        schema = copy.deepcopy(schema)
        schema["$defs"]["sectionObservationCoverage"]["properties"]["source_presence"]["required"].remove(
            "DECORATION"
        )
        errors = current_execution_contract_errors(policy, template, schema, handoff)
        self.assertTrue(any("DECORATION" in error for error in errors), errors)

    def test_current_execution_contract_rejects_stale_handoff_markers(self) -> None:
        policy, template, schema, handoff = self.current_execution_fixture()
        handoff = handoff.replace("shared_owner_change_restart_acceptance_from: SP", "")
        errors = current_execution_contract_errors(policy, template, schema, handoff)
        self.assertTrue(any("shared_owner_change_restart_acceptance_from: SP" in error for error in errors), errors)


if __name__ == "__main__":
    unittest.main()
