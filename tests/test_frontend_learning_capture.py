from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "audit_frontend_learning_capture",
    ROOT / "scripts" / "audit_frontend_learning_capture.py",
)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class FrontendLearningCaptureTests(unittest.TestCase):
    def write_run(self, root: Path, text: str, *, field: str = "candidate_rules") -> tuple[str, str]:
        relative = "experiments/example/run.yaml"
        run_id = "RUN-EXAMPLE-A"
        path = root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            yaml.safe_dump(
                {
                    "run_id": run_id,
                    "reference": {"reference_id": "REF-EXAMPLE"},
                    "lessons": {
                        "candidate_rules": [],
                        "confirmed_rules": [],
                        "contradicted_rules": [],
                        "rules_needing_retest": [],
                        "promotion_candidates": [],
                        "demotion_candidates": [],
                        field: [text],
                    },
                },
                sort_keys=False,
            ),
            encoding="utf-8",
        )
        return relative, run_id

    def index(self, *, path: str, run_id: str, text: str, field: str = "candidate_rules") -> dict:
        relation = "contradicts" if field in {"contradicted_rules", "demotion_candidates"} else "supports"
        other_relation = "supports" if relation == "contradicts" else "contradicts"
        return {
            "records": [
                {
                    "evidence": {
                        relation: [
                            {
                                "kind": "RUN_RECORD",
                                "path": path,
                                "run_id": run_id,
                                "source_field": f"lessons.{field}",
                                "source_text_sha256": MODULE.learning.text_sha256(text),
                            }
                        ],
                        other_relation: [],
                    }
                }
            ]
        }

    def test_unindexed_candidate_rule_is_reported(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.write_run(root, "Candidate that should be captured.")
            errors = MODULE.capture_errors({"records": []}, root=root)
            self.assertEqual(1, len(errors), errors)
            self.assertIn("unindexed reusable run lesson", errors[0])

    def test_exact_candidate_fragment_is_considered_captured(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            text = "Candidate that should be captured."
            path, run_id = self.write_run(root, text)
            self.assertEqual([], MODULE.capture_errors(self.index(path=path, run_id=run_id, text=text), root=root))

    def test_changed_candidate_text_invalidates_old_capture_hash(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            original = "Original candidate."
            path, run_id = self.write_run(root, "Changed candidate.")
            errors = MODULE.capture_errors(
                self.index(path=path, run_id=run_id, text=original),
                root=root,
            )
            self.assertEqual(1, len(errors), errors)

    def test_capture_proposal_preserves_exact_provenance_without_classifying_rule(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            text = "Candidate that needs meaning review."
            path, run_id = self.write_run(root, text)
            proposals = MODULE.capture_proposals({"records": []}, root=root)
            self.assertEqual(1, len(proposals))
            self.assertEqual("REF-EXAMPLE", proposals[0]["reference_id"])
            self.assertEqual(run_id, proposals[0]["run_id"])
            self.assertEqual(path, proposals[0]["path"])
            self.assertEqual("lessons.candidate_rules", proposals[0]["source_field"])
            self.assertEqual(MODULE.learning.text_sha256(text), proposals[0]["source_text_sha256"])
            self.assertEqual(text, proposals[0]["source_text"])
            self.assertEqual("supports", proposals[0]["suggested_relation"])
            self.assertNotIn("category", proposals[0])
            self.assertNotIn("promotion_state", proposals[0])

    def test_contradiction_and_retest_proposals_keep_semantic_relation_hint(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.write_run(root, "Counterexample.", field="contradicted_rules")
            proposals = MODULE.capture_proposals({"records": []}, root=root)
            self.assertEqual("contradicts", proposals[0]["suggested_relation"])

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.write_run(root, "Needs retest.", field="rules_needing_retest")
            proposals = MODULE.capture_proposals({"records": []}, root=root)
            self.assertEqual("review", proposals[0]["suggested_relation"])

    def test_observations_do_not_require_cross_run_indexing(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / "experiments/example/run.yaml"
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(
                yaml.safe_dump(
                    {
                        "run_id": "RUN-OBS",
                        "lessons": {
                            "observations": ["Keep raw observations in the run record."],
                        },
                    },
                    sort_keys=False,
                ),
                encoding="utf-8",
            )
            self.assertEqual([], MODULE.capture_errors({"records": []}, root=root))

    def test_repository_reusable_run_lessons_are_all_indexed(self) -> None:
        index, _, combine_errors = MODULE.learning.load_combined_index(ROOT)
        self.assertEqual([], combine_errors)
        self.assertEqual([], MODULE.capture_errors(index, root=ROOT))
        self.assertEqual([], MODULE.capture_proposals(index, root=ROOT))


if __name__ == "__main__":
    unittest.main()
