from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import start_section_run as starter  # noqa: E402


def base_run(schema_version: int) -> dict:
    return {
        "schema_version": schema_version,
        "status": "PLANNED",
        "coordination": {"scope": "SECTION"},
    }


def resolved_reuse_preflight() -> dict:
    return {
        "status": "PASS",
        "checked_sources": ["EXISTING_CODEBASE", "OFFICIAL_CAPABILITY"],
        "evidence": [
            "existing project component/pattern search completed",
            "official capability checked before custom work",
        ],
        "selected_reuse": ["existing project pattern"],
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
    }


class StartSectionRunReusePreflightTests(unittest.TestCase):
    def start_with_other_gates_stubbed(self, data: dict) -> dict:
        with (
            patch.object(starter, "implementation_profile_errors", return_value=[]),
            patch.object(starter, "preflight_errors", return_value=[]),
            patch.object(starter, "figma_variable_mode_errors", return_value=[]),
            patch.object(starter, "validate_run", return_value=[]),
        ):
            return starter.start(data)

    def test_schema_v14_pending_reuse_preflight_blocks_start(self) -> None:
        data = base_run(14)
        data["reuse_preflight"] = {
            "status": "PENDING",
            "checked_sources": [],
            "evidence": [],
            "selected_reuse": [],
            "decision_notes": [],
            "custom_infrastructure": {"planned": False},
        }
        with self.assertRaisesRegex(ValueError, "reuse_preflight.status PASS or NOT_APPLICABLE"):
            self.start_with_other_gates_stubbed(data)

    def test_schema_v14_resolved_reuse_preflight_allows_start(self) -> None:
        data = base_run(14)
        data["reuse_preflight"] = resolved_reuse_preflight()
        started = self.start_with_other_gates_stubbed(data)
        self.assertEqual(started["status"], "RUNNING")
        self.assertEqual(data["status"], "PLANNED")

    def test_schema_v14_not_applicable_with_reason_allows_start(self) -> None:
        data = base_run(14)
        data["reuse_preflight"] = resolved_reuse_preflight()
        data["reuse_preflight"].update(
            {
                "status": "NOT_APPLICABLE",
                "checked_sources": [],
                "evidence": [],
                "selected_reuse": [],
                "decision_notes": ["Research-only section run; no implementation mechanism is being added."],
            }
        )
        started = self.start_with_other_gates_stubbed(data)
        self.assertEqual(started["status"], "RUNNING")

    def test_schema_v13_legacy_run_is_not_retroactively_blocked(self) -> None:
        data = base_run(13)
        started = self.start_with_other_gates_stubbed(data)
        self.assertEqual(started["status"], "RUNNING")

    def test_custom_infrastructure_without_admission_evidence_blocks_start(self) -> None:
        data = base_run(14)
        data["reuse_preflight"] = resolved_reuse_preflight()
        data["reuse_preflight"]["custom_infrastructure"] = {
            "planned": True,
            "existing_solution_checked": [],
            "why_existing_is_insufficient": "",
            "smallest_missing_glue": "",
            "ownership": "",
            "verification": "",
            "retirement_trigger": "",
        }
        with self.assertRaisesRegex(ValueError, "existing_solution_checked"):
            self.start_with_other_gates_stubbed(data)


if __name__ == "__main__":
    unittest.main()
