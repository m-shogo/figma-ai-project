from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "validate_human_editability",
    ROOT / "scripts" / "validate_human_editability.py",
)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class HumanEditabilityValidationTests(unittest.TestCase):
    def base_run(self, *, scope: str = "PAGE_BENCHMARK", status: str = "RUNNING") -> dict:
        return {
            "schema_version": 11,
            "status": status,
            "coordination": {"scope": scope},
            "human_editability": {
                "status": "PASS",
                "score": 10,
                "dimensions": {
                    "discoverability": 2,
                    "locality_of_change": 2,
                    "intent_readability": 2,
                    "change_safety_reuse": 2,
                    "cms_content_ownership_clarity": 2,
                },
                "blockers": [],
                "change_drills": [],
                "evidence": ["review.md"],
            },
        }

    def drill(self, drill_id: str, result: str = "PASS") -> dict:
        return {
            "drill_id": drill_id,
            "task": "temporary maintainability change",
            "snapshot_commit": "abc123",
            "located_paths": ["section.php"],
            "changed_paths": ["section.css"],
            "unexpected_paths": [],
            "regression_status": "PASS",
            "result": result,
            "notes": [],
        }

    def test_pass_score_must_equal_dimension_sum(self) -> None:
        run = self.base_run()
        run["human_editability"]["score"] = 9
        errors = MODULE.validate_run_block(run, "run")
        self.assertTrue(any("dimension sum 10" in error for error in errors))

    def test_pass_rejects_blockers(self) -> None:
        run = self.base_run()
        run["human_editability"]["blockers"] = ["local change couples unrelated sections"]
        errors = MODULE.validate_run_block(run, "run")
        self.assertTrue(any("zero blockers" in error for error in errors))

    def test_complete_page_requires_three_relevant_drills(self) -> None:
        run = self.base_run(status="COMPLETE")
        run["human_editability"]["change_drills"] = [self.drill("HE-1"), self.drill("HE-2")]
        errors = MODULE.validate_run_block(run, "run")
        self.assertTrue(any("at least 3 relevant" in error for error in errors))

    def test_complete_page_passes_with_three_drills(self) -> None:
        run = self.base_run(status="COMPLETE")
        run["human_editability"]["change_drills"] = [
            self.drill("HE-1"),
            self.drill("HE-2"),
            self.drill("HE-3"),
        ]
        self.assertEqual(MODULE.validate_run_block(run, "run"), [])

    def test_complete_section_requires_one_relevant_drill(self) -> None:
        run = self.base_run(scope="SECTION", status="COMPLETE")
        errors = MODULE.validate_run_block(run, "run")
        self.assertTrue(any("at least 1 relevant" in error for error in errors))
        run["human_editability"]["change_drills"] = [self.drill("HE-SECTION")]
        self.assertEqual(MODULE.validate_run_block(run, "run"), [])

    def test_failed_drill_prevents_pass(self) -> None:
        run = self.base_run()
        run["human_editability"]["change_drills"] = [self.drill("HE-FAIL", result="FAIL")]
        errors = MODULE.validate_run_block(run, "run")
        self.assertTrue(any("cannot contain a failed change drill" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
