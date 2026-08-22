from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "validate_reuse_preflight",
    ROOT / "scripts" / "validate_reuse_preflight.py",
)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class ReusePreflightTests(unittest.TestCase):
    def run_record(self, *, schema_version: int = 14, status: str = "PLANNED") -> dict:
        return {
            "schema_version": schema_version,
            "run_id": "RUN-TEST",
            "status": status,
            "reuse_preflight": {
                "status": "PENDING",
                "checked_sources": [],
                "evidence": [],
                "selected_reuse": [],
                "decision_notes": [],
                "custom_infrastructure": {
                    "planned": False,
                    "existing_solution_checked": [],
                    "why_existing_is_insufficient": "",
                    "smallest_missing_glue": "",
                    "ownership": "",
                    "verification": "",
                    "retirement_trigger": "",
                },
            },
        }

    def test_legacy_run_is_untouched(self) -> None:
        self.assertEqual([], MODULE.reuse_preflight_errors({"schema_version": 13, "status": "COMPLETE"}))

    def test_planned_modern_run_may_remain_pending(self) -> None:
        self.assertEqual([], MODULE.reuse_preflight_errors(self.run_record()))

    def test_active_modern_run_requires_resolved_preflight(self) -> None:
        errors = MODULE.reuse_preflight_errors(self.run_record(status="RUNNING"))
        self.assertTrue(any("PASS or NOT_APPLICABLE" in error for error in errors), errors)

    def test_pass_requires_checked_source_and_evidence(self) -> None:
        record = self.run_record(status="RUNNING")
        record["reuse_preflight"]["status"] = "PASS"
        errors = MODULE.reuse_preflight_errors(record)
        self.assertTrue(any("checked source" in error for error in errors), errors)
        self.assertTrue(any("material evidence" in error for error in errors), errors)

        record["reuse_preflight"]["checked_sources"] = ["EXISTING_CODEBASE", "OFFICIAL_CAPABILITY"]
        record["reuse_preflight"]["evidence"] = ["repo component search: no matching owner", "Figma download_assets available"]
        self.assertEqual([], MODULE.reuse_preflight_errors(record))

    def test_not_applicable_requires_reason(self) -> None:
        record = self.run_record(status="BLOCKED")
        record["reuse_preflight"]["status"] = "NOT_APPLICABLE"
        errors = MODULE.reuse_preflight_errors(record)
        self.assertTrue(any("decision_notes" in error for error in errors), errors)
        record["reuse_preflight"]["decision_notes"] = ["Research-only run; no implementation mechanism is being added."]
        self.assertEqual([], MODULE.reuse_preflight_errors(record))

    def test_custom_infrastructure_requires_admission_evidence(self) -> None:
        record = self.run_record(status="RUNNING")
        preflight = record["reuse_preflight"]
        preflight["status"] = "PASS"
        preflight["checked_sources"] = ["OFFICIAL_CAPABILITY", "MATURE_OSS_OR_PATTERN"]
        preflight["evidence"] = ["official capability checked", "mature OSS checked"]
        preflight["custom_infrastructure"]["planned"] = True
        errors = MODULE.reuse_preflight_errors(record)
        self.assertTrue(any("existing_solution_checked" in error for error in errors), errors)
        self.assertTrue(any("smallest_missing_glue" in error for error in errors), errors)

        custom = preflight["custom_infrastructure"]
        custom.update(
            {
                "existing_solution_checked": ["official Figma asset download", "existing project bridge"],
                "why_existing_is_insufficient": "Neither path persists approved bytes in this execution environment.",
                "smallest_missing_glue": "One durable-byte handoff adapter.",
                "ownership": "figma asset intake",
                "verification": "clean replay with hash and visual evidence",
                "retirement_trigger": "remove when the active client can persist Figma asset bytes directly",
            }
        )
        self.assertEqual([], MODULE.reuse_preflight_errors(record))

    def test_unknown_checked_source_is_rejected(self) -> None:
        record = self.run_record()
        record["reuse_preflight"]["checked_sources"] = ["INVENTED_SOURCE"]
        errors = MODULE.reuse_preflight_errors(record)
        self.assertTrue(any("unknown values" in error for error in errors), errors)

    def test_template_is_modern_and_contains_reuse_preflight(self) -> None:
        template = yaml.safe_load((ROOT / "templates" / "run-record.yaml").read_text(encoding="utf-8"))
        self.assertGreaterEqual(template["schema_version"], MODULE.RUN_SCHEMA_VERSION)
        self.assertIn("reuse_preflight", template)
        self.assertEqual(template["reuse_preflight"]["status"], "PENDING")
        self.assertFalse(template["reuse_preflight"]["custom_infrastructure"]["planned"])

    def test_repository_runs_pass_reuse_preflight_compatibility(self) -> None:
        self.assertEqual([], MODULE.repository_errors(ROOT))


if __name__ == "__main__":
    unittest.main()
