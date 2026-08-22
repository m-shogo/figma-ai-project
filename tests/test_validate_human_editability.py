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

    def strict_run(self) -> dict:
        run = self.base_run()
        run["schema_version"] = 13
        return run

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

    def test_schema_v13_pass_drill_requires_material_snapshot_commit(self) -> None:
        run = self.strict_run()
        drill = self.drill("HE-SNAPSHOT")
        drill["snapshot_commit"] = "TBD"
        run["human_editability"]["change_drills"] = [drill]
        errors = MODULE.validate_run_block(run, "run")
        self.assertTrue(any("material snapshot_commit evidence" in error for error in errors), errors)

    def test_schema_v13_pass_drill_requires_located_source(self) -> None:
        run = self.strict_run()
        drill = self.drill("HE-LOCATE")
        drill["located_paths"] = []
        run["human_editability"]["change_drills"] = [drill]
        errors = MODULE.validate_run_block(run, "run")
        self.assertTrue(any("at least one located_path" in error for error in errors), errors)

    def test_schema_v13_pass_drill_requires_passing_regression_evidence(self) -> None:
        run = self.strict_run()
        drill = self.drill("HE-REGRESSION")
        drill["regression_status"] = "NOT_RUN"
        run["human_editability"]["change_drills"] = [drill]
        errors = MODULE.validate_run_block(run, "run")
        self.assertTrue(any("PASS-prefixed regression_status" in error for error in errors), errors)

        drill["regression_status"] = "PASS_SCOPED_SELECTOR_NO_UNRELATED_PATHS"
        self.assertEqual(MODULE.validate_run_block(run, "run"), [])

    def test_schema_v13_pass_drill_with_no_file_change_requires_explanation(self) -> None:
        run = self.strict_run()
        drill = self.drill("HE-CMS")
        drill["changed_paths"] = []
        run["human_editability"]["change_drills"] = [drill]
        errors = MODULE.validate_run_block(run, "run")
        self.assertTrue(any("zero changed_paths requires notes" in error for error in errors), errors)

        drill["notes"] = ["Changed the editor-owned ACF value in the disposable runtime; no code file changed."]
        self.assertEqual(MODULE.validate_run_block(run, "run"), [])

    def test_schema_v13_path_evidence_rejects_placeholder_entries(self) -> None:
        run = self.strict_run()
        drill = self.drill("HE-PATH")
        drill["changed_paths"] = ["TODO"]
        run["human_editability"]["change_drills"] = [drill]
        errors = MODULE.validate_run_block(run, "run")
        self.assertTrue(any("entries must be non-placeholder strings" in error for error in errors), errors)

    def test_schema_v11_historical_drill_keeps_rich_regression_status_compatible(self) -> None:
        run = self.base_run()
        drill = self.drill("HE-HISTORICAL")
        drill["regression_status"] = "PASS_RENDERED_EDITOR_VALUE_WITHOUT_LAYOUT_CHANGE"
        run["human_editability"]["change_drills"] = [drill]
        self.assertEqual(MODULE.validate_run_block(run, "run"), [])


if __name__ == "__main__":
    unittest.main()
