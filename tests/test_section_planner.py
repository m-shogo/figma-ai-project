from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from section_planner import build_plan  # noqa: E402


def section(
    section_id: str,
    *,
    order: int,
    depends_on: list[str] | None = None,
    paths: list[str] | None = None,
    coupling: str = "LOW",
    status: str = "PLANNED",
) -> dict:
    return {
        "section_id": section_id,
        "name": section_id,
        "order": order,
        "figma": {"pc_node_id": "", "sp_node_id": "", "other_node_ids": [], "semantic_name_source": "FIGMA"},
        "evidence": {"screenshots": [], "metadata_capture": ""},
        "dependencies": {
            "section_ids": depends_on or [],
            "shared_components": [], "tokens": [], "fonts": [], "assets": [],
            "integration_coupling": coupling, "coupling_notes": [],
        },
        "responsive": {
            "uses_shared_breakpoints": True, "invariants": [], "transitions": [],
            "unknowns": [], "breakpoint_exception_proposals": [],
        },
        "implementation": {
            "component_path": "", "style_path": "", "allowed_paths": paths or [],
            "shared_files_read_only": True,
        },
        "worker": {
            "status": status, "parallel_group": "", "agent": "", "model": "",
            "base_commit": "", "output_commit": "", "proposed_shared_changes": [],
        },
    }


def manifest(sections: list[dict]) -> dict:
    return {"reference_id": "REF-1", "page_id": "PAGE-1", "foundation_commit": "abc", "sections": sections}


class SectionPlannerTests(unittest.TestCase):
    def test_independent_sections_share_one_parallel_group(self) -> None:
        plan = build_plan(manifest([
            section("S01", order=10, paths=["src/sections/Header"]),
            section("S02", order=20, paths=["src/sections/Hero"]),
            section("S03", order=30, paths=["src/sections/Footer"]),
        ]))
        self.assertEqual(len(plan["waves"]), 1)
        self.assertEqual(plan["waves"][0]["groups"][0]["sections"], ["S01", "S02", "S03"])

    def test_dependencies_create_later_waves(self) -> None:
        plan = build_plan(manifest([
            section("S01", order=10, paths=["src/a"]),
            section("S02", order=20, depends_on=["S01"], paths=["src/b"]),
            section("S03", order=30, depends_on=["S02"], paths=["src/c"]),
        ]))
        self.assertEqual(
            [[group["sections"] for group in wave["groups"]] for wave in plan["waves"]],
            [[["S01"]], [["S02"]], [["S03"]]],
        )

    def test_overlapping_write_scopes_split_parallel_groups(self) -> None:
        plan = build_plan(manifest([
            section("S01", order=10, paths=["src/sections"]),
            section("S02", order=20, paths=["src/sections/Hero"]),
        ]))
        self.assertEqual(len(plan["waves"][0]["groups"]), 2)

    def test_unknown_write_scope_is_not_parallelized(self) -> None:
        plan = build_plan(manifest([
            section("S01", order=10, paths=[]),
            section("S02", order=20, paths=["src/b"]),
        ]))
        self.assertEqual(len(plan["waves"][0]["groups"]), 2)

    def test_high_coupling_section_is_isolated(self) -> None:
        plan = build_plan(manifest([
            section("S01", order=10, paths=["src/a"], coupling="HIGH"),
            section("S02", order=20, paths=["src/b"]),
        ]))
        self.assertEqual(len(plan["waves"][0]["groups"]), 2)

    def test_complete_dependency_is_already_satisfied(self) -> None:
        plan = build_plan(manifest([
            section("S01", order=10, paths=["src/a"], status="COMPLETE"),
            section("S02", order=20, depends_on=["S01"], paths=["src/b"]),
        ]))
        self.assertEqual(plan["completed_sections"], ["S01"])
        self.assertEqual(plan["waves"][0]["groups"][0]["sections"], ["S02"])

    def test_cycle_fails_closed(self) -> None:
        with self.assertRaisesRegex(ValueError, "dependency cycle|unsatisfied graph"):
            build_plan(manifest([
                section("S01", order=10, depends_on=["S02"], paths=["src/a"]),
                section("S02", order=20, depends_on=["S01"], paths=["src/b"]),
            ]))


if __name__ == "__main__":
    unittest.main()
