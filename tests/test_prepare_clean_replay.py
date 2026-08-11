from __future__ import annotations

import hashlib
import sys
import tempfile
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import first_pass_evidence as evidence  # noqa: E402
import prepare_clean_replay as replay  # noqa: E402


def write_run(path: Path, *, run_id: str, run_class: str, isolation: str, status: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    data = {
        "experiment_id": "EXP-1",
        "run_id": run_id,
        "run_class": run_class,
        "status": status,
        "reference": {"reference_id": "REF-1", "manifest_sha256": "ref-sha"},
        "coordination": {
            "scope": "SECTION",
            "section_id": "S01",
            "required_environment_profiles": ["ios-safari", "desktop-chrome"],
            "isolation_ref": isolation,
        },
        "code": {
            "repository": "m-shogo/example",
            "starting_commit": "foundation",
            "first_pass_commit": "first-pass" if status == "COMPLETE" else "",
            "final_commit": "final" if status == "COMPLETE" else "",
        },
        "captures": {
            "first_pass": ([{"capture_id": "fp", "path": "fp.png"}] if status == "COMPLETE" else []),
            "verify": [],
            "final": [],
        },
        "scores": {
            "first_pass_fidelity": {
                "visual": 38 if status == "COMPLETE" else None,
                "structural": 23 if status == "COMPLETE" else None,
                "robustness": 13 if status == "COMPLETE" else None,
                "total": 74 if status == "COMPLETE" else None,
            }
        },
        "replay": {"required": False, "source_run": "", "result": "NOT_RUN"},
    }
    path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")


class CleanReplayTests(unittest.TestCase):
    def test_prepare_pins_source_and_leakage_guards(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            original_root = replay.ROOT
            original_evidence_root = evidence.ROOT
            try:
                replay.ROOT = root
                evidence.ROOT = root
                source = root / "experiments/exp/run-a-run.yaml"
                candidate = root / "experiments/exp/run-b-run.yaml"
                write_run(source, run_id="RUN-A", run_class="COMMON", isolation="iso-a", status="COMPLETE")
                write_run(candidate, run_id="RUN-B", run_class="COMMON", isolation="iso-b", status="PLANNED")
                evidence.freeze(source, "tooling@A")

                updated = replay.prepare(source, candidate)
                self.assertEqual(updated["run_class"], "REPLAY")
                meta = updated["replay"]
                self.assertEqual(meta["source_run_id"], "RUN-A")
                self.assertEqual(meta["source_run_sha256"], hashlib.sha256(source.read_bytes()).hexdigest())
                self.assertTrue(meta["fresh_isolation"])
                self.assertFalse(meta["source_final_code_exposed"])
                self.assertFalse(meta["source_repair_diff_exposed"])
                self.assertFalse(meta["project_specific_values_exposed"])
            finally:
                replay.ROOT = original_root
                evidence.ROOT = original_evidence_root

    def test_same_isolation_is_rejected(self) -> None:
        source = {
            "run_id": "RUN-A",
            "run_class": "COMMON",
            "reference": {"reference_id": "REF", "manifest_sha256": "sha"},
            "coordination": {"scope": "SECTION", "section_id": "S01", "required_environment_profiles": ["ios"], "isolation_ref": "same"},
            "code": {"repository": "repo"},
        }
        run_b = {
            "run_class": "REPLAY",
            "reference": {"reference_id": "REF", "manifest_sha256": "sha"},
            "coordination": {"scope": "SECTION", "section_id": "S01", "required_environment_profiles": ["ios"], "isolation_ref": "same"},
            "code": {"repository": "repo"},
            "replay": {
                "source_run": "a.yaml",
                "source_run_sha256": "sha",
                "source_run_id": "RUN-A",
                "fresh_isolation": True,
                "source_final_code_exposed": False,
                "source_repair_diff_exposed": False,
                "project_specific_values_exposed": False,
            },
        }
        errors = replay.pair_errors(source, run_b)
        self.assertTrue(any("isolation_ref must differ" in error for error in errors))

    def test_reference_or_environment_drift_is_rejected(self) -> None:
        source = {
            "run_id": "RUN-A",
            "run_class": "COMMON",
            "reference": {"reference_id": "REF", "manifest_sha256": "sha-a"},
            "coordination": {"scope": "SECTION", "section_id": "S01", "required_environment_profiles": ["ios"], "isolation_ref": "a"},
            "code": {"repository": "repo"},
        }
        run_b = {
            "run_class": "REPLAY",
            "reference": {"reference_id": "REF", "manifest_sha256": "sha-b"},
            "coordination": {"scope": "SECTION", "section_id": "S01", "required_environment_profiles": ["android"], "isolation_ref": "b"},
            "code": {"repository": "repo"},
            "replay": {
                "source_run": "a.yaml",
                "source_run_sha256": "sha",
                "source_run_id": "RUN-A",
                "fresh_isolation": True,
                "source_final_code_exposed": False,
                "source_repair_diff_exposed": False,
                "project_specific_values_exposed": False,
            },
        }
        errors = replay.pair_errors(source, run_b)
        self.assertTrue(any("Reference Manifest" in error for error in errors))
        self.assertTrue(any("Required Environment" in error for error in errors))

    def test_leakage_flags_must_be_false(self) -> None:
        source = {
            "run_id": "RUN-A",
            "run_class": "COMMON",
            "reference": {"reference_id": "REF", "manifest_sha256": "sha"},
            "coordination": {"scope": "SECTION", "section_id": "S01", "required_environment_profiles": [], "isolation_ref": "a"},
            "code": {"repository": "repo"},
        }
        run_b = {
            "run_class": "REPLAY",
            "reference": {"reference_id": "REF", "manifest_sha256": "sha"},
            "coordination": {"scope": "SECTION", "section_id": "S01", "required_environment_profiles": [], "isolation_ref": "b"},
            "code": {"repository": "repo"},
            "replay": {
                "source_run": "a.yaml",
                "source_run_sha256": "sha",
                "source_run_id": "RUN-A",
                "fresh_isolation": True,
                "source_final_code_exposed": True,
                "source_repair_diff_exposed": False,
                "project_specific_values_exposed": False,
            },
        }
        errors = replay.pair_errors(source, run_b)
        self.assertTrue(any("source_final_code_exposed=false" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
