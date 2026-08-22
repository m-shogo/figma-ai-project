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

    def test_repository_learning_index_is_valid(self) -> None:
        data = MODULE.load_yaml(ROOT / "research" / "frontend-learning-evidence.yaml")
        schema = MODULE.load_json(ROOT / "schemas" / "frontend-learning-evidence.schema.json")
        policy = MODULE.load_yaml(ROOT / "config" / "frontend-implementation-policy.yaml")
        self.assertEqual([], MODULE.schema_errors(data, schema))
        self.assertEqual(
            [],
            MODULE.semantic_errors(
                data,
                root=ROOT,
                allowed_states=set(policy["rule_lifecycle"]["allowed_states"]),
            ),
        )

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
