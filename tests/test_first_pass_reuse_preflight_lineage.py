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


def reuse_preflight() -> dict:
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


def run_record(*, schema_version: int = 14) -> dict:
    return {
        "schema_version": schema_version,
        "experiment_id": "EXP-REUSE",
        "run_id": "RUN-REUSE-A",
        "status": "RUNNING",
        "reference": {"manifest_sha256": "ref-sha"},
        "coordination": {
            "scope": "",
            "company_policy_sha256": "policy-sha",
            "implementation_profile_id": "IMPL-1",
            "implementation_profile_sha256": "impl-sha",
            "required_environment_profiles": [],
        },
        "reuse_preflight": reuse_preflight(),
        "code": {
            "starting_commit": "foundation",
            "first_pass_commit": "first-pass",
            "final_commit": "",
        },
        "captures": {
            "first_pass": [{"capture_id": "fp-1", "path": "first-pass.png"}],
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
    }


def write_run(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")


class FirstPassReusePreflightLineageTests(unittest.TestCase):
    def test_v3_freeze_pins_reuse_preflight_digest(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory).resolve() / "run.yaml"
            data = run_record()
            write_run(path, data)

            snapshot = evidence.freeze(path, "tooling@reuse")
            payload = json.loads(snapshot.read_text(encoding="utf-8"))

            self.assertEqual(payload["schema_version"], 3)
            self.assertEqual(
                payload["reuse_preflight_sha256"],
                evidence.sha256_text(evidence.canonical_json(data["reuse_preflight"])),
            )

    def test_v3_snapshot_detects_reuse_preflight_mutation(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory).resolve() / "run.yaml"
            data = run_record()
            write_run(path, data)
            evidence.freeze(path, "tooling@reuse")

            data["reuse_preflight"]["selected_reuse"] = ["retroactively claimed component"]
            write_run(path, data)

            errors = evidence.validate_run_file(path)
            self.assertTrue(any("reuse_preflight_sha256" in error for error in errors), errors)

    def test_v14_run_rejects_legacy_v2_snapshot_without_reuse_lineage(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory).resolve() / "run.yaml"
            data = run_record()
            write_run(path, data)
            snapshot = evidence.freeze(path, "tooling@reuse")
            payload = json.loads(snapshot.read_text(encoding="utf-8"))
            payload["schema_version"] = 2
            payload.pop("reuse_preflight_sha256", None)
            snapshot.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")

            errors = evidence.validate_run_file(path)
            self.assertTrue(any("schema-v14+ run requires FIRST PASS snapshot schema v3+" in error for error in errors), errors)

    def test_v14_freeze_rejects_pending_reuse_preflight(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory).resolve() / "run.yaml"
            data = run_record()
            data["reuse_preflight"]["status"] = "PENDING"
            data["reuse_preflight"]["checked_sources"] = []
            data["reuse_preflight"]["evidence"] = []
            write_run(path, data)

            with self.assertRaisesRegex(ValueError, "Reuse-Before-Build preflight is invalid"):
                evidence.freeze(path, "tooling@reuse")

    def test_v13_run_does_not_require_reuse_preflight_lineage(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory).resolve() / "run.yaml"
            data = run_record(schema_version=13)
            data.pop("reuse_preflight")
            write_run(path, data)

            snapshot = evidence.freeze(path, "tooling@legacy")
            payload = json.loads(snapshot.read_text(encoding="utf-8"))
            self.assertEqual(payload["schema_version"], 3)
            self.assertNotIn("reuse_preflight_sha256", payload)
            self.assertEqual(evidence.validate_run_file(path), [])


if __name__ == "__main__":
    unittest.main()
