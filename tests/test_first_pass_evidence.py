from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import first_pass_evidence as evidence  # noqa: E402


def write_run(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        yaml.safe_dump(
            {
                "experiment_id": "EXP-1",
                "run_id": "RUN-A",
                "status": "RUNNING",
                "reference": {"manifest_sha256": "ref-sha"},
                "coordination": {
                    "company_policy_sha256": "policy-sha",
                    "implementation_profile_id": "IMPL-1",
                    "implementation_profile_sha256": "impl-sha",
                    "required_environment_profiles": ["ios", "desktop"],
                },
                "code": {
                    "starting_commit": "foundation",
                    "first_pass_commit": "first-pass",
                    "final_commit": "",
                },
                "captures": {
                    "first_pass": [{"capture_id": "fp-1", "path": "fp.png"}],
                    "verify": [],
                    "final": [],
                },
                "scores": {
                    "first_pass_fidelity": {
                        "visual": 38,
                        "structural": 23,
                        "robustness": 13,
                        "total": 74,
                    }
                },
            },
            sort_keys=False,
        ),
        encoding="utf-8",
    )


class FirstPassEvidenceTests(unittest.TestCase):
    def test_freeze_creates_immutable_snapshot(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "run.yaml"
            write_run(path)
            snapshot = evidence.freeze(path, "figma-ai-project@abc123")
            self.assertTrue(snapshot.is_file())
            payload = json.loads(snapshot.read_text(encoding="utf-8"))
            self.assertEqual(payload["run_id"], "RUN-A")
            self.assertEqual(payload["first_pass_commit"], "first-pass")
            self.assertEqual(payload["implementation_profile_id"], "IMPL-1")
            self.assertEqual(payload["implementation_profile_sha256"], "impl-sha")
            self.assertEqual(payload["tooling_revision"], "figma-ai-project@abc123")
            with self.assertRaisesRegex(ValueError, "immutable"):
                evidence.freeze(path, "figma-ai-project@def456")

    def test_snapshot_detects_first_pass_capture_mutation(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "run.yaml"
            write_run(path)
            evidence.freeze(path, "tooling@1")
            run = yaml.safe_load(path.read_text(encoding="utf-8"))
            run["captures"]["first_pass"][0]["path"] = "mutated.png"
            path.write_text(yaml.safe_dump(run, sort_keys=False), encoding="utf-8")
            errors = evidence.validate_run_file(path)
            self.assertTrue(any("captures_sha256" in error for error in errors))

    def test_snapshot_detects_first_pass_score_mutation(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "run.yaml"
            write_run(path)
            evidence.freeze(path, "tooling@1")
            run = yaml.safe_load(path.read_text(encoding="utf-8"))
            run["scores"]["first_pass_fidelity"]["total"] = 80
            path.write_text(yaml.safe_dump(run, sort_keys=False), encoding="utf-8")
            errors = evidence.validate_run_file(path)
            self.assertTrue(any("first_pass_fidelity" in error for error in errors))

    def test_snapshot_detects_implementation_profile_mutation(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "run.yaml"
            write_run(path)
            evidence.freeze(path, "tooling@1")
            run = yaml.safe_load(path.read_text(encoding="utf-8"))
            run["coordination"]["implementation_profile_sha256"] = "changed-impl-sha"
            path.write_text(yaml.safe_dump(run, sort_keys=False), encoding="utf-8")
            errors = evidence.validate_run_file(path)
            self.assertTrue(any("implementation_profile_sha256" in error for error in errors))

    def test_first_pass_commit_requires_snapshot(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "run.yaml"
            write_run(path)
            errors = evidence.validate_run_file(path)
            self.assertTrue(any("snapshot missing" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
