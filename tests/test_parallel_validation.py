from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

import yaml

from scripts.validate_parallel_paths import validate_manifest


def section(
    section_id: str,
    *,
    group: str,
    allowed_paths: list[str],
    depends_on: list[str] | None = None,
    coupling: str = "LOW",
    status: str = "READY",
) -> dict:
    return {
        "section_id": section_id,
        "name": section_id,
        "order": int(section_id.removeprefix("S") or "0"),
        "figma": {
            "pc_node_id": f"pc-{section_id}",
            "sp_node_id": f"sp-{section_id}",
            "other_node_ids": [],
            "semantic_name_source": "FIGMA",
        },
        "evidence": {"screenshots": [], "metadata_capture": ""},
        "dependencies": {
            "section_ids": depends_on or [],
            "shared_components": [],
            "tokens": [],
            "fonts": [],
            "assets": [],
            "integration_coupling": coupling,
            "coupling_notes": [],
        },
        "responsive": {
            "uses_shared_breakpoints": True,
            "invariants": [],
            "transitions": [],
            "unknowns": [],
            "breakpoint_exception_proposals": [],
        },
        "implementation": {
            "component_path": allowed_paths[0] if allowed_paths else "",
            "style_path": "",
            "allowed_paths": allowed_paths,
            "shared_files_read_only": True,
        },
        "worker": {
            "status": status,
            "parallel_group": group,
            "agent": "test-agent",
            "model": "test-model",
            "base_commit": "foundation",
            "output_commit": "" if status != "COMPLETE" else f"out-{section_id}",
            "proposed_shared_changes": [],
        },
    }


def manifest(sections: list[dict]) -> dict:
    return {
        "schema_version": 4,
        "reference_id": "REF-TEST",
        "page_id": "PAGE-TEST",
        "shared_contract": "contracts/test/shared-contract.yaml",
        "shared_contract_sha256": "hash",
        "foundation_commit": "foundation",
        "sections": sections,
        "integration": {"root_composition_path": "", "required_checks": []},
    }


class ParallelValidationTests(unittest.TestCase):
    def validate(self, data: dict) -> list[str]:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "section-manifest.yaml"
            path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
            return validate_manifest(path)

    def test_disjoint_sections_can_share_parallel_group(self) -> None:
        errors = self.validate(
            manifest(
                [
                    section("S01", group="P1", allowed_paths=["src/sections/Header"]),
                    section("S02", group="P1", allowed_paths=["src/sections/Hero"]),
                ]
            )
        )
        self.assertEqual([], errors)

    def test_overlapping_write_roots_are_rejected(self) -> None:
        errors = self.validate(
            manifest(
                [
                    section("S01", group="P1", allowed_paths=["src/sections"]),
                    section("S02", group="P1", allowed_paths=["src/sections/Hero"]),
                ]
            )
        )
        self.assertTrue(any("write scope overlap" in error for error in errors))

    def test_direct_dependency_cannot_share_parallel_group(self) -> None:
        errors = self.validate(
            manifest(
                [
                    section("S01", group="P1", allowed_paths=["src/a"]),
                    section("S02", group="P1", allowed_paths=["src/b"], depends_on=["S01"]),
                ]
            )
        )
        self.assertTrue(any("depends on S01" in error for error in errors))

    def test_dependency_cycle_is_rejected(self) -> None:
        errors = self.validate(
            manifest(
                [
                    section("S01", group="P1", allowed_paths=["src/a"], depends_on=["S02"]),
                    section("S02", group="P2", allowed_paths=["src/b"], depends_on=["S01"]),
                ]
            )
        )
        self.assertTrue(any("dependency cycle" in error for error in errors))

    def test_high_coupling_section_is_not_parallelized_with_peer(self) -> None:
        errors = self.validate(
            manifest(
                [
                    section("S01", group="P1", allowed_paths=["src/a"], coupling="HIGH"),
                    section("S02", group="P1", allowed_paths=["src/b"]),
                ]
            )
        )
        self.assertTrue(any("HIGH-coupling" in error for error in errors))

    def test_active_worker_requires_parallel_group(self) -> None:
        errors = self.validate(
            manifest([section("S01", group="", allowed_paths=["src/a"])])
        )
        self.assertTrue(any("requires non-empty worker.parallel_group" in error for error in errors))

    def test_unknown_dependency_is_rejected(self) -> None:
        errors = self.validate(
            manifest(
                [section("S01", group="P1", allowed_paths=["src/a"], depends_on=["S99"])]
            )
        )
        self.assertTrue(any("unknown section S99" in error for error in errors))

    def test_glob_write_scope_is_rejected(self) -> None:
        errors = self.validate(
            manifest([section("S01", group="P1", allowed_paths=["src/sections/*"])])
        )
        self.assertTrue(any("not a glob" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
