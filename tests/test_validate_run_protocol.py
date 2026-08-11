from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import validate_records as records  # noqa: E402


def base_run() -> dict:
    return {
        "status": "RUNNING",
        "tooling_preflight": {
            "mode": "AUTOMATED_UPDATE_RADAR",
            "checked_at": "2026-08-11T00:00:00+00:00",
            "official_sources_complete": True,
            "figma_release_notes_checked": True,
            "figma_mcp_docs_checked": True,
            "agent_docs_checked": True,
            "community_scan_checked": False,
        },
        "coordination": {"scope": "PAGE_BENCHMARK"},
        "execution": {"actual_repair_rounds": 0, "max_repair_rounds": 2},
        "rework": {"repair_rounds": 0},
        "scores": {
            "first_pass_fidelity": {"visual": None, "structural": None, "robustness": None, "total": None},
            "final_fidelity": {"visual": None, "structural": None, "robustness": None, "total": None},
            "rework_efficiency": None,
            "reproducibility": None,
            "final_composite": None,
        },
        "replay": {"result": "NOT_RUN"},
        "code": {"first_pass_commit": ""},
        "captures": {"first_pass": []},
    }


class ValidateRunProtocolTests(unittest.TestCase):
    def test_automated_mode_does_not_require_community_scan(self) -> None:
        errors = records.semantic_run_errors(base_run())
        self.assertFalse(any("community_scan_checked" in error for error in errors), errors)

    def test_legacy_mode_still_requires_community_scan(self) -> None:
        run = base_run()
        run["tooling_preflight"]["mode"] = "LEGACY_MANUAL"
        errors = records.semantic_run_errors(run)
        self.assertTrue(any("community_scan_checked" in error for error in errors), errors)

    def test_complete_run_requires_first_pass_commit_and_capture(self) -> None:
        run = base_run()
        run["status"] = "COMPLETE"
        run["scores"]["first_pass_fidelity"] = {
            "visual": 40,
            "structural": 25,
            "robustness": 15,
            "total": 80,
        }
        errors = records.semantic_run_errors(run)
        self.assertTrue(any("code.first_pass_commit" in error for error in errors), errors)
        self.assertTrue(any("captures.first_pass" in error for error in errors), errors)


if __name__ == "__main__":
    unittest.main()
