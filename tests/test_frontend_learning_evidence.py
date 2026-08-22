from __future__ import annotations

import copy
import importlib.util
import tempfile
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "validate_frontend_learning_evidence",
    ROOT / "scripts" / "validate_frontend_learning_evidence.py",
)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

ALLOWED_STATES = {"CORE", "ACTIVE", "CANDIDATE", "PROJECT_ONLY", "DEPRECATED", "RETIRED"}


class FrontendLearningEvidenceTests(unittest.TestCase):
    def record(self, learning_id: str = "OBS-TEST") -> dict:
        return {
            "learning_id": learning_id,
            "summary": "Evidence-backed test learning.",
            "category": "TOOLING",
            "applicability": {
                "scope": "PROJECT",
                "conditions": [],
                "exclusions": [],
            },
            "promotion_state": None,
            "promotion": {
                "candidate": False,
                "rationale": "test",
                "blocked_by": [],
                "contradiction_review": "",
            },
            "evidence": {
                "supports": [
                    {
                        "evidence_id": "EV-1",
                        "kind": "LOCAL_RESEARCH",
                        "reference_id": "REF-A",
                        "run_id": "",
                        "path": "evidence.md",
                        "commit": "",
                        "note": "local evidence",
                    }
                ],
                "contradicts": [],
            },
            "notes": [],
        }

    def index(self, records: list[dict]) -> dict:
        return {
            "schema_version": 1,
            "policy": {
                "auto_promotion": False,
                "evidence_retention": "APPEND_OR_SUPERSEDE_WITH_TRACE",
                "contradictions_are_preserved": True,
                "lifecycle_doc": "docs/frontend-visual-repair-learning-loop.md",
                "cross_reference_evidence_required_for_active": True,
            },
            "records": records,
        }

    def validate(self, data: dict, root: Path) -> list[str]:
        return MODULE.semantic_errors(data, root=root, allowed_states=ALLOWED_STATES)

    def make_root(self) -> tempfile.TemporaryDirectory:
        return tempfile.TemporaryDirectory()

    def write_evidence(self, root: Path, path: str = "evidence.md") -> None:
        target = root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text("evidence\n", encoding="utf-8")

    def write_run(self, root: Path, *, run_id: str = "RUN-X", candidate: str = "candidate") -> str:
        relative = "experiments/test/run.yaml"
        target = root / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(
            yaml.safe_dump(
                {
                    "run_id": run_id,
                    "lessons": {
                        "candidate_rules": [candidate],
                    },
                },
                sort_keys=False,
            ),
            encoding="utf-8",
        )
        return relative

    def test_repository_learning_shards_are_valid_as_one_evidence_set(self) -> None:
        combined, paths, combine_errors = MODULE.load_combined_index(ROOT)
        schema = MODULE.load_json(ROOT / "schemas" / "frontend-learning-evidence.schema.json")
        policy = MODULE.load_yaml(ROOT / "config" / "frontend-implementation-policy.yaml")
        self.assertGreaterEqual(len(paths), 2)
        self.assertEqual([], combine_errors)
        for path in paths:
            self.assertEqual([], MODULE.schema_errors(MODULE.load_yaml(path), schema), path)
        self.assertEqual(
            [],
            MODULE.semantic_errors(
                combined,
                root=ROOT,
                allowed_states=set(policy["rule_lifecycle"]["allowed_states"]),
            ),
        )

    def test_combine_shards_rejects_policy_drift(self) -> None:
        first = self.index([self.record("OBS-A")])
        second = self.index([self.record("OBS-B")])
        second["policy"]["cross_reference_evidence_required_for_active"] = False
        _, errors = MODULE.combine_index_documents(
            [(Path("a.yaml"), first), (Path("b.yaml"), second)]
        )
        self.assertTrue(any("policy block must match" in error for error in errors), errors)

    def test_duplicate_learning_id_across_shards_is_rejected(self) -> None:
        with self.make_root() as directory:
            root = Path(directory)
            self.write_evidence(root)
            first = self.record("OBS-DUP")
            second = copy.deepcopy(first)
            second["evidence"]["supports"][0]["evidence_id"] = "EV-2"
            combined, combine_errors = MODULE.combine_index_documents(
                [(Path("a.yaml"), self.index([first])), (Path("b.yaml"), self.index([second]))]
            )
            self.assertEqual([], combine_errors)
            errors = self.validate(combined, root)
            self.assertTrue(any("duplicate learning_id" in error for error in errors), errors)

    def test_duplicate_learning_id_is_rejected(self) -> None:
        with self.make_root() as directory:
            root = Path(directory)
            self.write_evidence(root)
            first = self.record("OBS-DUP")
            second = copy.deepcopy(first)
            second["evidence"]["supports"][0]["evidence_id"] = "EV-2"
            errors = self.validate(self.index([first, second]), root)
            self.assertTrue(any("duplicate learning_id" in error for error in errors), errors)

    def test_missing_local_evidence_path_is_rejected(self) -> None:
        with self.make_root() as directory:
            root = Path(directory)
            errors = self.validate(self.index([self.record()]), root)
            self.assertTrue(any("does not exist" in error for error in errors), errors)

    def test_commit_evidence_requires_commit_identity(self) -> None:
        with self.make_root() as directory:
            root = Path(directory)
            self.write_evidence(root)
            record = self.record()
            record["evidence"]["supports"][0]["kind"] = "COMMIT"
            errors = self.validate(self.index([record]), root)
            self.assertTrue(any("COMMIT evidence requires" in error for error in errors), errors)

    def test_run_record_evidence_requires_exact_run_identity(self) -> None:
        with self.make_root() as directory:
            root = Path(directory)
            relative = self.write_run(root, run_id="RUN-A")
            record = self.record()
            item = record["evidence"]["supports"][0]
            item.update(
                {
                    "kind": "RUN_RECORD",
                    "run_id": "RUN-WRONG",
                    "path": relative,
                }
            )
            errors = self.validate(self.index([record]), root)
            self.assertTrue(any("run_id does not match" in error for error in errors), errors)

            item["run_id"] = "RUN-A"
            self.assertEqual([], self.validate(self.index([record]), root))

    def test_run_lesson_fragment_hash_must_match_exact_source_item(self) -> None:
        with self.make_root() as directory:
            root = Path(directory)
            candidate = "Preserve this exact candidate lesson."
            relative = self.write_run(root, run_id="RUN-A", candidate=candidate)
            record = self.record()
            item = record["evidence"]["supports"][0]
            item.update(
                {
                    "kind": "RUN_RECORD",
                    "run_id": "RUN-A",
                    "path": relative,
                    "source_field": "lessons.candidate_rules",
                    "source_text_sha256": "0" * 64,
                }
            )
            errors = self.validate(self.index([record]), root)
            self.assertTrue(any("source_text_sha256 does not match" in error for error in errors), errors)

            item["source_text_sha256"] = MODULE.text_sha256(candidate)
            self.assertEqual([], self.validate(self.index([record]), root))

    def test_active_learning_requires_two_distinct_references(self) -> None:
        with self.make_root() as directory:
            root = Path(directory)
            self.write_evidence(root)
            record = self.record()
            record["promotion_state"] = "ACTIVE"
            errors = self.validate(self.index([record]), root)
            self.assertTrue(any("at least two distinct references" in error for error in errors), errors)

            second = copy.deepcopy(record["evidence"]["supports"][0])
            second["evidence_id"] = "EV-2"
            second["reference_id"] = "REF-B"
            record["evidence"]["supports"].append(second)
            self.assertEqual([], self.validate(self.index([record]), root))

    def test_project_only_learning_does_not_fake_cross_reference_proof(self) -> None:
        with self.make_root() as directory:
            root = Path(directory)
            self.write_evidence(root)
            record = self.record()
            record["promotion_state"] = "PROJECT_ONLY"
            record["evidence"]["supports"][0]["reference_id"] = ""
            self.assertEqual([], self.validate(self.index([record]), root))

    def test_active_contradiction_requires_review_text(self) -> None:
        with self.make_root() as directory:
            root = Path(directory)
            self.write_evidence(root)
            record = self.record()
            record["promotion_state"] = "ACTIVE"
            second = copy.deepcopy(record["evidence"]["supports"][0])
            second["evidence_id"] = "EV-2"
            second["reference_id"] = "REF-B"
            record["evidence"]["supports"].append(second)
            contradiction = copy.deepcopy(second)
            contradiction["evidence_id"] = "EV-C"
            contradiction["note"] = "counterexample"
            record["evidence"]["contradicts"] = [contradiction]
            errors = self.validate(self.index([record]), root)
            self.assertTrue(any("contradiction_review" in error for error in errors), errors)

            record["promotion"]["contradiction_review"] = "Reviewed; applicability narrowed to preserve the counterexample."
            self.assertEqual([], self.validate(self.index([record]), root))

    def test_external_guidance_requires_url(self) -> None:
        with self.make_root() as directory:
            root = Path(directory)
            record = self.record()
            item = record["evidence"]["supports"][0]
            item["kind"] = "EXTERNAL_GUIDANCE"
            item["path"] = "docs/not-a-url.md"
            errors = self.validate(self.index([record]), root)
            self.assertTrue(any("http(s) URL" in error for error in errors), errors)


if __name__ == "__main__":
    unittest.main()
