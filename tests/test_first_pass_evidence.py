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


def add_v13_observation_lineage(path: Path) -> tuple[Path, Path]:
    profile_path = path.parent / "figma-structure-profile.yaml"
    profile_path.write_text(
        yaml.safe_dump(
            {
                "schema_version": 1,
                "reference_id": "REF-1",
                "captured_at": "2026-08-22T00:00:00Z",
                "figma_tooling_snapshot": "test",
                "page": {
                    "file_key": "test",
                    "page_or_frame_node_id": "1:1",
                    "auto_layout_generation": "UNDETERMINED",
                    "notes": [],
                },
                "sections": [],
                "notes": [],
            },
            sort_keys=False,
        ),
        encoding="utf-8",
    )

    manifest = yaml.safe_load((ROOT / "templates" / "section-manifest.yaml").read_text(encoding="utf-8"))
    manifest["reference_id"] = "REF-1"
    manifest_path = path.parent / "section-manifest.yaml"
    manifest["figma_structure_profile"] = profile_path.relative_to(ROOT).as_posix()
    manifest["figma_structure_profile_sha256"] = evidence.file_sha256(profile_path)
    manifest_path.write_text(yaml.safe_dump(manifest, sort_keys=False), encoding="utf-8")

    run = yaml.safe_load(path.read_text(encoding="utf-8"))
    run["schema_version"] = 13
    run["coordination"].update(
        {
            "scope": "PAGE_BENCHMARK",
            "section_manifest_path": manifest_path.relative_to(ROOT).as_posix(),
            "section_manifest_sha256": evidence.file_sha256(manifest_path),
            "figma_structure_profile_path": profile_path.relative_to(ROOT).as_posix(),
            "figma_structure_profile_sha256": evidence.file_sha256(profile_path),
        }
    )
    path.write_text(yaml.safe_dump(run, sort_keys=False), encoding="utf-8")
    return manifest_path, profile_path


class FirstPassEvidenceTests(unittest.TestCase):
    def test_freeze_creates_immutable_snapshot(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory).resolve() / "run.yaml"
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
            path = Path(directory).resolve() / "run.yaml"
            write_run(path)
            evidence.freeze(path, "tooling@1")
            run = yaml.safe_load(path.read_text(encoding="utf-8"))
            run["captures"]["first_pass"][0]["path"] = "mutated.png"
            path.write_text(yaml.safe_dump(run, sort_keys=False), encoding="utf-8")
            errors = evidence.validate_run_file(path)
            self.assertTrue(any("captures_sha256" in error for error in errors))

    def test_snapshot_detects_first_pass_score_mutation(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory).resolve() / "run.yaml"
            write_run(path)
            evidence.freeze(path, "tooling@1")
            run = yaml.safe_load(path.read_text(encoding="utf-8"))
            run["scores"]["first_pass_fidelity"]["total"] = 80
            path.write_text(yaml.safe_dump(run, sort_keys=False), encoding="utf-8")
            errors = evidence.validate_run_file(path)
            self.assertTrue(any("first_pass_fidelity" in error for error in errors))

    def test_snapshot_detects_implementation_profile_mutation(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory).resolve() / "run.yaml"
            write_run(path)
            evidence.freeze(path, "tooling@1")
            run = yaml.safe_load(path.read_text(encoding="utf-8"))
            run["coordination"]["implementation_profile_sha256"] = "changed-impl-sha"
            path.write_text(yaml.safe_dump(run, sort_keys=False), encoding="utf-8")
            errors = evidence.validate_run_file(path)
            self.assertTrue(any("implementation_profile_sha256" in error for error in errors))

    def test_first_pass_commit_requires_snapshot(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory).resolve() / "run.yaml"
            write_run(path)
            errors = evidence.validate_run_file(path)
            self.assertTrue(any("snapshot missing" in error for error in errors))

    def test_v3_freeze_pins_observation_lineage(self) -> None:
        with tempfile.TemporaryDirectory(dir=ROOT) as directory:
            path = Path(directory).resolve() / "run.yaml"
            write_run(path)
            manifest_path, profile_path = add_v13_observation_lineage(path)

            snapshot = evidence.freeze(path, "tooling@2")
            payload = json.loads(snapshot.read_text(encoding="utf-8"))

            self.assertEqual(payload["schema_version"], 3)
            self.assertEqual(payload["section_manifest_path"], manifest_path.relative_to(ROOT).as_posix())
            self.assertEqual(payload["section_manifest_sha256"], evidence.file_sha256(manifest_path))
            self.assertEqual(
                payload["figma_structure_profile_path"],
                profile_path.relative_to(ROOT).as_posix(),
            )
            self.assertEqual(
                payload["figma_structure_profile_sha256"],
                evidence.file_sha256(profile_path),
            )

    def test_v3_freeze_rejects_missing_observation_lineage(self) -> None:
        with tempfile.TemporaryDirectory(dir=ROOT) as directory:
            path = Path(directory).resolve() / "run.yaml"
            write_run(path)
            run = yaml.safe_load(path.read_text(encoding="utf-8"))
            run["schema_version"] = 13
            run["coordination"]["scope"] = "PAGE_BENCHMARK"
            path.write_text(yaml.safe_dump(run, sort_keys=False), encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "section_manifest_sha256"):
                evidence.freeze(path, "tooling@2")

    def test_v3_snapshot_detects_observation_pin_mutation(self) -> None:
        with tempfile.TemporaryDirectory(dir=ROOT) as directory:
            path = Path(directory).resolve() / "run.yaml"
            write_run(path)
            add_v13_observation_lineage(path)
            evidence.freeze(path, "tooling@2")

            run = yaml.safe_load(path.read_text(encoding="utf-8"))
            run["coordination"]["section_manifest_sha256"] = "changed-manifest-sha"
            path.write_text(yaml.safe_dump(run, sort_keys=False), encoding="utf-8")
            errors = evidence.validate_run_file(path)
            self.assertTrue(any("Section Manifest sha256 mismatch" in error for error in errors))

    def test_legacy_v1_snapshot_remains_valid(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory).resolve() / "run.yaml"
            write_run(path)
            snapshot = evidence.freeze(path, "tooling@1")
            payload = json.loads(snapshot.read_text(encoding="utf-8"))
            payload["schema_version"] = 1
            snapshot.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")

            self.assertEqual(evidence.validate_run_file(path), [])


if __name__ == "__main__":
    unittest.main()
