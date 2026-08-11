from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import controlled_run_phase as gate  # noqa: E402
import first_pass_evidence  # noqa: E402


def base_run() -> dict:
    return {
        "schema_version": 10,
        "experiment_id": "EXP-CONTROLLED",
        "run_id": "RUN-A",
        "status": "RUNNING",
        "reference": {"manifest_sha256": "ref-sha"},
        "coordination": {
            "company_policy_sha256": "policy-sha",
            "implementation_profile_id": "PROFILE-WP-ACF",
            "implementation_profile_sha256": "profile-sha",
            "required_environment_profiles": ["chrome-desktop", "safari-mobile"],
        },
        "code": {
            "starting_commit": "start-sha",
            "first_pass_commit": "",
            "final_commit": "",
        },
        "captures": {"first_pass": [], "verify": [], "final": []},
        "scores": {
            "first_pass_fidelity": {"visual": None, "structural": None, "robustness": None, "total": None},
            "final_fidelity": {"visual": None, "structural": None, "robustness": None, "total": None},
        },
    }


class ControlledRunPhaseTests(unittest.TestCase):
    def write_run(self, root: Path, run: dict) -> Path:
        path = root / "run.yaml"
        path.write_text(yaml.safe_dump(run, sort_keys=False), encoding="utf-8")
        return path

    def ready_for_freeze(self, run: dict) -> None:
        run["code"]["first_pass_commit"] = "first-pass-sha"
        run["captures"]["first_pass"] = [
            {"capture_id": "pc", "path": "captures/pc.png"},
            {"capture_id": "sp", "path": "captures/sp.png"},
        ]
        run["scores"]["first_pass_fidelity"] = {
            "visual": 30,
            "structural": 20,
            "robustness": 10,
            "total": 60,
        }

    def test_first_pass_build_is_allowed_only_before_commit_is_recorded(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            run = base_run()
            path = self.write_run(root, run)
            self.assertEqual([], gate.check_phase(path, "FIRST_PASS_BUILD"))

            run["code"]["first_pass_commit"] = "first-pass-sha"
            path = self.write_run(root, run)
            errors = gate.check_phase(path, "FIRST_PASS_BUILD")
            self.assertTrue(any("freeze FIRST PASS" in error for error in errors))

    def test_freeze_phase_requires_commit_capture_and_score(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            path = self.write_run(Path(temp_dir), base_run())
            errors = gate.check_phase(path, "FIRST_PASS_FREEZE")
            self.assertTrue(any("first_pass_commit" in error for error in errors))
            self.assertTrue(any("captures.first_pass" in error for error in errors))
            self.assertTrue(any("first_pass_fidelity.total" in error for error in errors))

    def test_repair_is_blocked_until_first_pass_snapshot_is_frozen(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            run = base_run()
            self.ready_for_freeze(run)
            path = self.write_run(root, run)

            errors = gate.check_phase(path, "REPAIR")
            self.assertTrue(any("snapshot missing" in error for error in errors))

            first_pass_evidence.freeze(path, "tooling-sha")
            self.assertEqual([], gate.check_phase(path, "REPAIR"))

    def test_final_commit_before_first_pass_snapshot_is_invalid(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            run = base_run()
            run["code"]["final_commit"] = "final-sha"
            path = self.write_run(root, run)
            errors = gate.check_phase(path, "FINALIZE")
            self.assertTrue(any("final_commit exists before immutable FIRST PASS" in error for error in errors))

    def test_snapshot_drift_blocks_repair(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            run = base_run()
            self.ready_for_freeze(run)
            path = self.write_run(root, run)
            first_pass_evidence.freeze(path, "tooling-sha")

            run["captures"]["first_pass"].append({"capture_id": "late", "path": "captures/late.png"})
            self.write_run(root, run)
            errors = gate.check_phase(path, "REPAIR")
            self.assertTrue(any("captures_sha256" in error for error in errors))

    def test_finalize_is_allowed_after_frozen_first_pass_even_when_final_commit_is_recorded(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            run = base_run()
            self.ready_for_freeze(run)
            path = self.write_run(root, run)
            first_pass_evidence.freeze(path, "tooling-sha")

            run["code"]["final_commit"] = "final-sha"
            self.write_run(root, run)
            self.assertEqual([], gate.check_phase(path, "FINALIZE"))


if __name__ == "__main__":
    unittest.main()
